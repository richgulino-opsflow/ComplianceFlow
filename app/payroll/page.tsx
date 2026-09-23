'use client'

import { FormEvent, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '../../lib/supabase'

type PayrollRecord = {
  id: number
  project: string
  contractor: string
  week_ending_date: string
  report_number: string | null
  employee_name: string
  trade_classification: string | null
  apprentice_status: string | null
  regular_hours: number
  overtime_hours: number
  gross_wages: number
  fringe_benefits: number
  total_wages: number
  work_location: string | null
  notes: string | null
  created_at: string
}

type PayrollForm = {
  project: string
  contractor: string
  week_ending_date: string
  report_number: string
  employee_name: string
  trade_classification: string
  apprentice_status: string
  regular_hours: string
  overtime_hours: string
  gross_wages: string
  fringe_benefits: string
  work_location: string
  notes: string
}

const initialForm: PayrollForm = {
  project: '',
  contractor: '',
  week_ending_date: '',
  report_number: '',
  employee_name: '',
  trade_classification: '',
  apprentice_status: '',
  regular_hours: '0',
  overtime_hours: '0',
  gross_wages: '0',
  fringe_benefits: '0',
  work_location: '',
  notes: '',
}

const apprenticeOptions = [
  'Apprentice',
  'Journeyworker',
  'Not Applicable',
]

export default function PayrollPage() {
  const [records, setRecords] = useState<PayrollRecord[]>([])
  const [form, setForm] = useState<PayrollForm>(initialForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [contractorFilter, setContractorFilter] = useState('')
  const [weekFilter, setWeekFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    void loadPayroll()
  }, [])

  async function loadPayroll() {
    setLoading(true)
    setError('')

    const { data, error: queryError } = await supabase
      .from('certified_payroll')
      .select('*')
      .order('week_ending_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (queryError) {
      setRecords([])
      setError(queryError.message)
    } else {
      setRecords((data ?? []) as PayrollRecord[])
    }

    setLoading(false)
  }

  function updateField(field: keyof PayrollForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function resetForm() {
    setForm(initialForm)
    setEditingId(null)
    setError('')
    setSuccess('')
  }

  function editRecord(record: PayrollRecord) {
    setEditingId(record.id)
    setForm({
      project: record.project,
      contractor: record.contractor,
      week_ending_date: record.week_ending_date,
      report_number: record.report_number ?? '',
      employee_name: record.employee_name,
      trade_classification: record.trade_classification ?? '',
      apprentice_status: record.apprentice_status ?? '',
      regular_hours: String(record.regular_hours ?? 0),
      overtime_hours: String(record.overtime_hours ?? 0),
      gross_wages: String(record.gross_wages ?? 0),
      fringe_benefits: String(record.fringe_benefits ?? 0),
      work_location: record.work_location ?? '',
      notes: record.notes ?? '',
    })

    setError('')
    setSuccess('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (
      !form.project.trim() ||
      !form.contractor.trim() ||
      !form.week_ending_date ||
      !form.employee_name.trim()
    ) {
      setError(
        'Project, Contractor, Week Ending Date, and Employee Name are required.',
      )
      return
    }

    const regularHours = Number(form.regular_hours)
    const overtimeHours = Number(form.overtime_hours)
    const grossWages = Number(form.gross_wages)
    const fringeBenefits = Number(form.fringe_benefits)

    if (
      [regularHours, overtimeHours, grossWages, fringeBenefits].some(
        (value) => !Number.isFinite(value) || value < 0,
      )
    ) {
      setError('Hours and wage amounts must be valid non-negative numbers.')
      return
    }

    setSaving(true)

    const payrollData = {
      project: form.project.trim(),
      contractor: form.contractor.trim(),
      week_ending_date: form.week_ending_date,
      report_number: form.report_number.trim() || null,
      employee_name: form.employee_name.trim(),
      trade_classification: form.trade_classification.trim() || null,
      apprentice_status: form.apprentice_status || null,
      regular_hours: regularHours,
      overtime_hours: overtimeHours,
      gross_wages: grossWages,
      fringe_benefits: fringeBenefits,
      total_wages: grossWages + fringeBenefits,
      work_location: form.work_location.trim() || null,
      notes: form.notes.trim() || null,
    }

    const result = editingId
      ? await supabase
          .from('certified_payroll')
          .update(payrollData)
          .eq('id', editingId)
      : await supabase.from('certified_payroll').insert(payrollData)

    if (result.error) {
      setError(result.error.message)
    } else {
      setSuccess(
        editingId
          ? 'Certified payroll record updated successfully.'
          : 'Certified payroll record created successfully.',
      )
      resetForm()
      await loadPayroll()
    }

    setSaving(false)
  }

  async function deleteRecord(id: number) {
    if (!window.confirm('Delete this certified payroll record?')) return

    setError('')
    setSuccess('')

    const { error: deleteError } = await supabase
      .from('certified_payroll')
      .delete()
      .eq('id', id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setSuccess('Certified payroll record deleted successfully.')
    await loadPayroll()
  }

  const projects = useMemo(
    () => uniqueValues(records.map((record) => record.project)),
    [records],
  )

  const contractors = useMemo(
    () => uniqueValues(records.map((record) => record.contractor)),
    [records],
  )

  const filteredRecords = useMemo(() => {
    const searchText = search.trim().toLowerCase()

    return records.filter((record) => {
      const matchesSearch =
        !searchText ||
        [
          record.project,
          record.contractor,
          record.report_number,
          record.employee_name,
          record.trade_classification,
          record.apprentice_status,
          record.work_location,
          record.notes,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(searchText),
          )

      return (
        matchesSearch &&
        (!projectFilter || record.project === projectFilter) &&
        (!contractorFilter || record.contractor === contractorFilter) &&
        (!weekFilter || record.week_ending_date === weekFilter)
      )
    })
  }, [records, search, projectFilter, contractorFilter, weekFilter])

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <h1 style={headingStyle}>Certified Payroll</h1>
        <p style={subtitleStyle}>
          Track certified payroll records, workforce hours, and wages.
        </p>
      </header>

      <section style={sectionStyle}>
        <h2 style={sectionHeadingStyle}>
          {editingId ? 'Edit Payroll Record' : 'Add Payroll Record'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={formGridStyle}>
            <FormField label="Project" required>
              <input
                required
                value={form.project}
                onChange={(event) =>
                  updateField('project', event.target.value)
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Contractor" required>
              <input
                required
                value={form.contractor}
                onChange={(event) =>
                  updateField('contractor', event.target.value)
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Week Ending Date" required>
              <input
                required
                type="date"
                value={form.week_ending_date}
                onChange={(event) =>
                  updateField('week_ending_date', event.target.value)
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Report Number">
              <input
                value={form.report_number}
                onChange={(event) =>
                  updateField('report_number', event.target.value)
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Employee Name" required>
              <input
                required
                value={form.employee_name}
                onChange={(event) =>
                  updateField('employee_name', event.target.value)
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Trade Classification">
              <input
                value={form.trade_classification}
                onChange={(event) =>
                  updateField('trade_classification', event.target.value)
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Apprentice Status">
              <select
                value={form.apprentice_status}
                onChange={(event) =>
                  updateField('apprentice_status', event.target.value)
                }
                style={inputStyle}
              >
                <option value="">Select</option>
                {apprenticeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Regular Hours">
              <input
                type="number"
                min="0"
                step="0.25"
                value={form.regular_hours}
                onChange={(event) =>
                  updateField('regular_hours', event.target.value)
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Overtime Hours">
              <input
                type="number"
                min="0"
                step="0.25"
                value={form.overtime_hours}
                onChange={(event) =>
                  updateField('overtime_hours', event.target.value)
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Gross Wages">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.gross_wages}
                onChange={(event) =>
                  updateField('gross_wages', event.target.value)
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Fringe Benefits">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.fringe_benefits}
                onChange={(event) =>
                  updateField('fringe_benefits', event.target.value)
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Work Location">
              <input
                value={form.work_location}
                onChange={(event) =>
                  updateField('work_location', event.target.value)
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Notes">
              <textarea
                rows={3}
                value={form.notes}
                onChange={(event) =>
                  updateField('notes', event.target.value)
                }
                style={textareaStyle}
              />
            </FormField>
          </div>

          {error && <p style={errorStyle}>{error}</p>}
          {success && <p style={successStyle}>{success}</p>}

          <div style={buttonGroupStyle}>
            <button
              type="submit"
              disabled={saving}
              style={primaryButtonStyle}
            >
              {saving
                ? 'Saving...'
                : editingId
                  ? 'Update Record'
                  : 'Add Record'}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                style={secondaryButtonStyle}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section style={sectionStyle}>
        <div style={tableHeaderStyle}>
          <h2 style={sectionHeadingStyle}>Certified Payroll Records</h2>
          <span style={countStyle}>
            {filteredRecords.length} records
          </span>
        </div>

        <div style={filterGridStyle}>
          <input
            placeholder="Search payroll records..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={inputStyle}
          />

          <select
            value={projectFilter}
            onChange={(event) => setProjectFilter(event.target.value)}
            style={inputStyle}
          >
            <option value="">All Projects</option>
            {projects.map((project) => (
              <option key={project} value={project}>
                {project}
              </option>
            ))}
          </select>

          <select
            value={contractorFilter}
            onChange={(event) =>
              setContractorFilter(event.target.value)
            }
            style={inputStyle}
          >
            <option value="">All Contractors</option>
            {contractors.map((contractor) => (
              <option key={contractor} value={contractor}>
                {contractor}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={weekFilter}
            onChange={(event) => setWeekFilter(event.target.value)}
            style={inputStyle}
          />

          <button
            type="button"
            onClick={() => {
              setSearch('')
              setProjectFilter('')
              setContractorFilter('')
              setWeekFilter('')
            }}
            style={secondaryButtonStyle}
          >
            Clear Filters
          </button>
        </div>

        {loading ? (
          <p style={mutedTextStyle}>Loading payroll records...</p>
        ) : filteredRecords.length === 0 ? (
          <p style={mutedTextStyle}>No payroll records found.</p>
        ) : (
          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeaderRowStyle}>
                  <th style={cellStyle}>Project</th>
                  <th style={cellStyle}>Contractor</th>
                  <th style={cellStyle}>Week Ending</th>
                  <th style={cellStyle}>Report Number</th>
                  <th style={cellStyle}>Employee</th>
                  <th style={cellStyle}>Trade</th>
                  <th style={cellStyle}>Apprentice Status</th>
                  <th style={cellStyle}>Regular Hours</th>
                  <th style={cellStyle}>Overtime Hours</th>
                  <th style={cellStyle}>Gross Wages</th>
                  <th style={cellStyle}>Fringe Benefits</th>
                  <th style={cellStyle}>Total Wages</th>
                  <th style={cellStyle}>Location</th>
                  <th style={cellStyle}>Notes</th>
                  <th style={cellStyle}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <td style={cellStyle}>{record.project}</td>
                    <td style={cellStyle}>{record.contractor}</td>
                    <td style={cellStyle}>{record.week_ending_date}</td>
                    <td style={cellStyle}>
                      {record.report_number || '—'}
                    </td>
                    <td style={cellStyle}>{record.employee_name}</td>
                    <td style={cellStyle}>
                      {record.trade_classification || '—'}
                    </td>
                    <td style={cellStyle}>
                      {record.apprentice_status || '—'}
                    </td>
                    <td style={cellStyle}>{record.regular_hours}</td>
                    <td style={cellStyle}>{record.overtime_hours}</td>
                    <td style={cellStyle}>
                      {formatCurrency(record.gross_wages)}
                    </td>
                    <td style={cellStyle}>
                      {formatCurrency(record.fringe_benefits)}
                    </td>
                    <td style={cellStyle}>
                      {formatCurrency(record.total_wages)}
                    </td>
                    <td style={cellStyle}>
                      {record.work_location || '—'}
                    </td>
                    <td style={notesCellStyle}>{record.notes || '—'}</td>
                    <td style={cellStyle}>
                      <div style={actionGroupStyle}>
                        <button
                          type="button"
                          onClick={() => editRecord(record)}
                          style={secondaryButtonStyle}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteRecord(record.id)}
                          style={deleteButtonStyle}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}

function FormField({
  label,
  required = false,
  children,
}: {
  label: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <label style={labelStyle}>
      <span>
        {label}
        {required && <span style={requiredStyle}> *</span>}
      </span>
      {children}
    </label>
  )
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value ?? 0)
}

const pageStyle = {
  padding: '20px',
  maxWidth: '1900px',
  margin: '0 auto',
}

const headerStyle = {
  marginBottom: '24px',
}

const headingStyle = {
  margin: 0,
  fontSize: '28px',
  fontWeight: 700,
  color: '#111827',
}

const subtitleStyle = {
  margin: '6px 0 0',
  color: '#6b7280',
}

const sectionStyle = {
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '24px',
  backgroundColor: '#ffffff',
}

const sectionHeadingStyle = {
  margin: '0 0 16px',
  fontSize: '18px',
  fontWeight: 600,
  color: '#111827',
}

const formGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '16px',
}

const filterGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'minmax(240px, 2fr) repeat(3, minmax(180px, 1fr)) auto',
  gap: '10px',
  marginBottom: '16px',
}

const labelStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '5px',
  color: '#374151',
  fontSize: '14px',
  fontWeight: 500,
}

const requiredStyle = {
  color: '#dc2626',
}

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box' as const,
  padding: '9px 10px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  backgroundColor: '#ffffff',
  color: '#111827',
  fontSize: '14px',
}

const textareaStyle = {
  ...inputStyle,
  resize: 'vertical' as const,
}

const buttonGroupStyle = {
  display: 'flex',
  gap: '10px',
  marginTop: '18px',
}

const primaryButtonStyle = {
  padding: '10px 20px',
  border: 'none',
  borderRadius: '6px',
  backgroundColor: '#2563eb',
  color: '#ffffff',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 600,
}

const secondaryButtonStyle = {
  padding: '8px 12px',
  border: '1px solid #9ca3af',
  borderRadius: '6px',
  backgroundColor: '#ffffff',
  color: '#374151',
  cursor: 'pointer',
  fontSize: '14px',
}

const deleteButtonStyle = {
  padding: '8px 12px',
  border: 'none',
  borderRadius: '6px',
  backgroundColor: '#dc2626',
  color: '#ffffff',
  cursor: 'pointer',
  fontSize: '14px',
}

const actionGroupStyle = {
  display: 'flex',
  gap: '6px',
}

const errorStyle = {
  margin: '14px 0 0',
  color: '#dc2626',
  fontSize: '14px',
}

const successStyle = {
  margin: '14px 0 0',
  color: '#16a34a',
  fontSize: '14px',
}

const tableHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
}

const countStyle = {
  color: '#6b7280',
  fontSize: '14px',
}

const mutedTextStyle = {
  color: '#6b7280',
}

const tableWrapperStyle = {
  overflowX: 'auto' as const,
}

const tableStyle = {
  width: '100%',
  minWidth: '1900px',
  borderCollapse: 'collapse' as const,
}

const tableHeaderRowStyle = {
  backgroundColor: '#f3f4f6',
}

const cellStyle = {
  padding: '12px 10px',
  border: '1px solid #d1d5db',
  textAlign: 'left' as const,
  verticalAlign: 'middle' as const,
  fontSize: '14px',
  color: '#374151',
}

const notesCellStyle = {
  ...cellStyle,
  maxWidth: '240px',
  whiteSpace: 'normal' as const,
}