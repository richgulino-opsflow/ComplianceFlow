'use client'

import { FormEvent, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '../../lib/supabase'

type AA202Report = {
  id: number
  project: string
  contractor: string
  week_ending_date: string
  report_number: string | null
  trade_classification: string | null
  employee_name: string
  gender: string | null
  ethnicity: string | null
  resident_status: string | null
  apprentice_status: string | null
  hours_worked: number
  regular_hours: number
  overtime_hours: number
  work_location: string | null
  notes: string | null
  created_at: string
}

type ReportForm = {
  project: string
  contractor: string
  week_ending_date: string
  report_number: string
  trade_classification: string
  employee_name: string
  gender: string
  ethnicity: string
  resident_status: string
  apprentice_status: string
  hours_worked: string
  regular_hours: string
  overtime_hours: string
  work_location: string
  notes: string
}

const initialForm: ReportForm = {
  project: '',
  contractor: '',
  week_ending_date: '',
  report_number: '',
  trade_classification: '',
  employee_name: '',
  gender: '',
  ethnicity: '',
  resident_status: '',
  apprentice_status: '',
  hours_worked: '0',
  regular_hours: '0',
  overtime_hours: '0',
  work_location: '',
  notes: '',
}

const genderOptions = ['Male', 'Female', 'Non-Binary', 'Not Disclosed']
const residentOptions = ['Resident', 'Non-Resident', 'Not Disclosed']
const apprenticeOptions = ['Apprentice', 'Journeyworker', 'Not Applicable']

export default function AA202Page() {
  const [reports, setReports] = useState<AA202Report[]>([])
  const [form, setForm] = useState<ReportForm>(initialForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [contractorFilter, setContractorFilter] = useState('')
  const [weekEndingFilter, setWeekEndingFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    void loadReports()
  }, [])

  async function loadReports() {
    setLoading(true)
    setError('')

    const { data, error: queryError } = await supabase
      .from('aa202_reports')
      .select('*')
      .order('week_ending_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (queryError) {
      setError(queryError.message)
      setReports([])
    } else {
      setReports((data ?? []) as AA202Report[])
    }

    setLoading(false)
  }

  function updateField(field: keyof ReportForm, value: string) {
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

  function editReport(report: AA202Report) {
    setEditingId(report.id)
    setForm({
      project: report.project,
      contractor: report.contractor,
      week_ending_date: report.week_ending_date,
      report_number: report.report_number ?? '',
      trade_classification: report.trade_classification ?? '',
      employee_name: report.employee_name,
      gender: report.gender ?? '',
      ethnicity: report.ethnicity ?? '',
      resident_status: report.resident_status ?? '',
      apprentice_status: report.apprentice_status ?? '',
      hours_worked: String(report.hours_worked ?? 0),
      regular_hours: String(report.regular_hours ?? 0),
      overtime_hours: String(report.overtime_hours ?? 0),
      work_location: report.work_location ?? '',
      notes: report.notes ?? '',
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

    const hoursWorked = Number(form.hours_worked)
    const regularHours = Number(form.regular_hours)
    const overtimeHours = Number(form.overtime_hours)

    if (
      [hoursWorked, regularHours, overtimeHours].some(
        (value) => !Number.isFinite(value) || value < 0,
      )
    ) {
      setError('Hours must be valid non-negative numbers.')
      return
    }

    setSaving(true)

    const reportData = {
      project: form.project.trim(),
      contractor: form.contractor.trim(),
      week_ending_date: form.week_ending_date,
      report_number: form.report_number.trim() || null,
      trade_classification: form.trade_classification.trim() || null,
      employee_name: form.employee_name.trim(),
      gender: form.gender || null,
      ethnicity: form.ethnicity.trim() || null,
      resident_status: form.resident_status || null,
      apprentice_status: form.apprentice_status || null,
      hours_worked: hoursWorked,
      regular_hours: regularHours,
      overtime_hours: overtimeHours,
      work_location: form.work_location.trim() || null,
      notes: form.notes.trim() || null,
    }

    const result = editingId
      ? await supabase
          .from('aa202_reports')
          .update(reportData)
          .eq('id', editingId)
      : await supabase.from('aa202_reports').insert(reportData)

    if (result.error) {
      setError(result.error.message)
    } else {
      setSuccess(
        editingId
          ? 'AA202 report updated successfully.'
          : 'AA202 report created successfully.',
      )
      resetForm()
      await loadReports()
    }

    setSaving(false)
  }

  async function deleteReport(id: number) {
    if (!window.confirm('Delete this AA202 report?')) return

    setError('')
    setSuccess('')

    const { error: deleteError } = await supabase
      .from('aa202_reports')
      .delete()
      .eq('id', id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setSuccess('AA202 report deleted successfully.')
    await loadReports()
  }

  const projects = useMemo(
    () => uniqueValues(reports.map((report) => report.project)),
    [reports],
  )

  const contractors = useMemo(
    () => uniqueValues(reports.map((report) => report.contractor)),
    [reports],
  )

  const filteredReports = useMemo(() => {
    const searchText = search.trim().toLowerCase()

    return reports.filter((report) => {
      const matchesSearch =
        !searchText ||
        [
          report.project,
          report.contractor,
          report.report_number,
          report.trade_classification,
          report.employee_name,
          report.gender,
          report.ethnicity,
          report.resident_status,
          report.apprentice_status,
          report.work_location,
          report.notes,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(searchText))

      const matchesProject =
        !projectFilter || report.project === projectFilter

      const matchesContractor =
        !contractorFilter || report.contractor === contractorFilter

      const matchesWeek =
        !weekEndingFilter || report.week_ending_date === weekEndingFilter

      return (
        matchesSearch &&
        matchesProject &&
        matchesContractor &&
        matchesWeek
      )
    })
  }, [
    reports,
    search,
    projectFilter,
    contractorFilter,
    weekEndingFilter,
  ])

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <h1 style={headingStyle}>AA202 Workforce Reporting</h1>
        <p style={subtitleStyle}>
          Track workforce participation and certified workforce reporting.
        </p>
      </header>

      <section style={sectionStyle}>
        <h2 style={sectionHeadingStyle}>
          {editingId ? 'Edit AA202 Report' : 'Add AA202 Report'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={formGridStyle}>
            <FormField label="Project" required>
              <input
                required
                value={form.project}
                onChange={(event) => updateField('project', event.target.value)}
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

            <FormField label="Trade Classification">
              <input
                value={form.trade_classification}
                onChange={(event) =>
                  updateField('trade_classification', event.target.value)
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

            <FormField label="Gender">
              <select
                value={form.gender}
                onChange={(event) => updateField('gender', event.target.value)}
                style={inputStyle}
              >
                <option value="">Select</option>
                {genderOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Ethnicity">
              <input
                value={form.ethnicity}
                onChange={(event) =>
                  updateField('ethnicity', event.target.value)
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Resident Status">
              <select
                value={form.resident_status}
                onChange={(event) =>
                  updateField('resident_status', event.target.value)
                }
                style={inputStyle}
              >
                <option value="">Select</option>
                {residentOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
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

            <FormField label="Hours Worked">
              <input
                type="number"
                min="0"
                step="0.25"
                value={form.hours_worked}
                onChange={(event) =>
                  updateField('hours_worked', event.target.value)
                }
                style={inputStyle}
              />
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
                onChange={(event) => updateField('notes', event.target.value)}
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
                  ? 'Update Report'
                  : 'Add Report'}
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
          <h2 style={sectionHeadingStyle}>AA202 Reports</h2>
          <span style={countStyle}>
            {filteredReports.length} reports
          </span>
        </div>

        <div style={filterGridStyle}>
          <input
            placeholder="Search reports..."
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
            onChange={(event) => setContractorFilter(event.target.value)}
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
            value={weekEndingFilter}
            onChange={(event) => setWeekEndingFilter(event.target.value)}
            style={inputStyle}
          />

          <button
            type="button"
            onClick={() => {
              setSearch('')
              setProjectFilter('')
              setContractorFilter('')
              setWeekEndingFilter('')
            }}
            style={secondaryButtonStyle}
          >
            Clear Filters
          </button>
        </div>

        {loading ? (
          <p style={mutedTextStyle}>Loading AA202 reports...</p>
        ) : filteredReports.length === 0 ? (
          <p style={mutedTextStyle}>No AA202 reports found.</p>
        ) : (
          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeaderRowStyle}>
                  <th style={cellStyle}>Project</th>
                  <th style={cellStyle}>Contractor</th>
                  <th style={cellStyle}>Week Ending</th>
                  <th style={cellStyle}>Report Number</th>
                  <th style={cellStyle}>Trade</th>
                  <th style={cellStyle}>Employee</th>
                  <th style={cellStyle}>Gender</th>
                  <th style={cellStyle}>Ethnicity</th>
                  <th style={cellStyle}>Resident</th>
                  <th style={cellStyle}>Apprentice</th>
                  <th style={cellStyle}>Hours</th>
                  <th style={cellStyle}>Regular</th>
                  <th style={cellStyle}>Overtime</th>
                  <th style={cellStyle}>Location</th>
                  <th style={cellStyle}>Notes</th>
                  <th style={cellStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => (
                  <tr key={report.id}>
                    <td style={cellStyle}>{report.project}</td>
                    <td style={cellStyle}>{report.contractor}</td>
                    <td style={cellStyle}>{report.week_ending_date}</td>
                    <td style={cellStyle}>{report.report_number || '—'}</td>
                    <td style={cellStyle}>
                      {report.trade_classification || '—'}
                    </td>
                    <td style={cellStyle}>{report.employee_name}</td>
                    <td style={cellStyle}>{report.gender || '—'}</td>
                    <td style={cellStyle}>{report.ethnicity || '—'}</td>
                    <td style={cellStyle}>
                      {report.resident_status || '—'}
                    </td>
                    <td style={cellStyle}>
                      {report.apprentice_status || '—'}
                    </td>
                    <td style={cellStyle}>{report.hours_worked}</td>
                    <td style={cellStyle}>{report.regular_hours}</td>
                    <td style={cellStyle}>{report.overtime_hours}</td>
                    <td style={cellStyle}>{report.work_location || '—'}</td>
                    <td style={notesCellStyle}>{report.notes || '—'}</td>
                    <td style={cellStyle}>
                      <div style={actionGroupStyle}>
                        <button
                          type="button"
                          onClick={() => editReport(report)}
                          style={secondaryButtonStyle}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteReport(report.id)}
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

const pageStyle = {
  padding: '20px',
  maxWidth: '1800px',
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
  minWidth: '1800px',
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