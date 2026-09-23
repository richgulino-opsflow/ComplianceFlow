'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

type InsuranceCertificate = {
  id: number
  contractor: string
  insurance_company: string | null
  policy_number: string | null
  general_liability_expiration_date: string | null
  workers_compensation_expiration_date: string | null
  auto_liability_expiration_date: string | null
  umbrella_liability_expiration_date: string | null
  certificate_received_date: string | null
  status: string
  notes: string | null
  created_at: string
}

type CertificateForm = {
  contractor: string
  insurance_company: string
  policy_number: string
  general_liability_expiration_date: string
  workers_compensation_expiration_date: string
  auto_liability_expiration_date: string
  umbrella_liability_expiration_date: string
  certificate_received_date: string
  status: string
  notes: string
}

const statuses = ['Active', 'Expiring Soon', 'Expired', 'Pending', 'Rejected']

const initialForm: CertificateForm = {
  contractor: '',
  insurance_company: '',
  policy_number: '',
  general_liability_expiration_date: '',
  workers_compensation_expiration_date: '',
  auto_liability_expiration_date: '',
  umbrella_liability_expiration_date: '',
  certificate_received_date: '',
  status: 'Active',
  notes: '',
}

const expirationFields = [
  'general_liability_expiration_date',
  'workers_compensation_expiration_date',
  'auto_liability_expiration_date',
  'umbrella_liability_expiration_date',
] as const

export default function InsurancePage() {
  const [certificates, setCertificates] = useState<InsuranceCertificate[]>([])
  const [form, setForm] = useState<CertificateForm>(initialForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    void loadCertificates()
  }, [])

  async function loadCertificates() {
    setLoading(true)
    setError('')

    const { data, error: queryError } = await supabase
      .from('insurance_certificates')
      .select('*')
      .order('created_at', { ascending: false })

    if (queryError) {
      setError(queryError.message)
      setCertificates([])
    } else {
      setCertificates((data ?? []) as InsuranceCertificate[])
    }

    setLoading(false)
  }

  function updateField(field: keyof CertificateForm, value: string) {
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

  function editCertificate(certificate: InsuranceCertificate) {
    setEditingId(certificate.id)
    setForm({
      contractor: certificate.contractor,
      insurance_company: certificate.insurance_company ?? '',
      policy_number: certificate.policy_number ?? '',
      general_liability_expiration_date:
        certificate.general_liability_expiration_date ?? '',
      workers_compensation_expiration_date:
        certificate.workers_compensation_expiration_date ?? '',
      auto_liability_expiration_date:
        certificate.auto_liability_expiration_date ?? '',
      umbrella_liability_expiration_date:
        certificate.umbrella_liability_expiration_date ?? '',
      certificate_received_date:
        certificate.certificate_received_date ?? '',
      status: certificate.status,
      notes: certificate.notes ?? '',
    })

    setError('')
    setSuccess('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!form.contractor.trim()) {
      setError('Contractor is required.')
      return
    }

    setSaving(true)

    const certificateData = {
      contractor: form.contractor.trim(),
      insurance_company: form.insurance_company.trim() || null,
      policy_number: form.policy_number.trim() || null,
      general_liability_expiration_date:
        form.general_liability_expiration_date || null,
      workers_compensation_expiration_date:
        form.workers_compensation_expiration_date || null,
      auto_liability_expiration_date:
        form.auto_liability_expiration_date || null,
      umbrella_liability_expiration_date:
        form.umbrella_liability_expiration_date || null,
      certificate_received_date: form.certificate_received_date || null,
      status: form.status,
      notes: form.notes.trim() || null,
    }

    const result = editingId
      ? await supabase
          .from('insurance_certificates')
          .update(certificateData)
          .eq('id', editingId)
      : await supabase
          .from('insurance_certificates')
          .insert(certificateData)

    if (result.error) {
      setError(result.error.message)
    } else {
      setSuccess(
        editingId
          ? 'Insurance certificate updated successfully.'
          : 'Insurance certificate created successfully.',
      )
      resetForm()
      await loadCertificates()
    }

    setSaving(false)
  }

  async function deleteCertificate(id: number) {
    if (!window.confirm('Delete this insurance certificate?')) {
      return
    }

    setError('')
    setSuccess('')

    const { error: deleteError } = await supabase
      .from('insurance_certificates')
      .delete()
      .eq('id', id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setSuccess('Insurance certificate deleted successfully.')
    await loadCertificates()
  }

  const filteredCertificates = useMemo(() => {
    const searchText = search.trim().toLowerCase()

    return certificates
      .filter((certificate) => {
        if (!searchText) return true

        return [
          certificate.contractor,
          certificate.insurance_company,
          certificate.policy_number,
          certificate.status,
          certificate.notes,
        ]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(searchText))
      })
      .sort((first, second) => {
        const firstDate = getEarliestExpiration(first)
        const secondDate = getEarliestExpiration(second)

        if (!firstDate && !secondDate) return 0
        if (!firstDate) return 1
        if (!secondDate) return -1

        const comparison = firstDate.localeCompare(secondDate)
        return sortDirection === 'asc' ? comparison : -comparison
      })
  }, [certificates, search, sortDirection])

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <h1 style={headingStyle}>Insurance Certificates</h1>
        <p style={subtitleStyle}>
          Track contractor insurance coverage and certificate expirations.
        </p>
      </header>

      <section style={sectionStyle}>
        <h2 style={sectionHeadingStyle}>
          {editingId ? 'Edit Insurance Certificate' : 'Add Insurance Certificate'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={formGridStyle}>
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

            <FormField label="Insurance Company">
              <input
                value={form.insurance_company}
                onChange={(event) =>
                  updateField('insurance_company', event.target.value)
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Policy Number">
              <input
                value={form.policy_number}
                onChange={(event) =>
                  updateField('policy_number', event.target.value)
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="General Liability Expiration Date">
              <input
                type="date"
                value={form.general_liability_expiration_date}
                onChange={(event) =>
                  updateField(
                    'general_liability_expiration_date',
                    event.target.value,
                  )
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Workers Compensation Expiration Date">
              <input
                type="date"
                value={form.workers_compensation_expiration_date}
                onChange={(event) =>
                  updateField(
                    'workers_compensation_expiration_date',
                    event.target.value,
                  )
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Auto Liability Expiration Date">
              <input
                type="date"
                value={form.auto_liability_expiration_date}
                onChange={(event) =>
                  updateField(
                    'auto_liability_expiration_date',
                    event.target.value,
                  )
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Umbrella Liability Expiration Date">
              <input
                type="date"
                value={form.umbrella_liability_expiration_date}
                onChange={(event) =>
                  updateField(
                    'umbrella_liability_expiration_date',
                    event.target.value,
                  )
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Certificate Received Date">
              <input
                type="date"
                value={form.certificate_received_date}
                onChange={(event) =>
                  updateField(
                    'certificate_received_date',
                    event.target.value,
                  )
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Status">
              <select
                value={form.status}
                onChange={(event) =>
                  updateField('status', event.target.value)
                }
                style={inputStyle}
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Notes">
              <textarea
                value={form.notes}
                onChange={(event) =>
                  updateField('notes', event.target.value)
                }
                rows={3}
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
                  ? 'Update Certificate'
                  : 'Add Certificate'}
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
          <h2 style={sectionHeadingStyle}>All Insurance Certificates</h2>
          <span style={countStyle}>
            {filteredCertificates.length} certificates
          </span>
        </div>

        <div style={filterBarStyle}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search contractor, insurer, policy, status..."
            style={searchInputStyle}
          />

          <button
            type="button"
            onClick={() =>
              setSortDirection((current) =>
                current === 'asc' ? 'desc' : 'asc',
              )
            }
            style={secondaryButtonStyle}
          >
            Expiration: {sortDirection === 'asc' ? 'Earliest' : 'Latest'}
          </button>
        </div>

        {loading ? (
          <p style={mutedTextStyle}>Loading insurance certificates...</p>
        ) : filteredCertificates.length === 0 ? (
          <p style={mutedTextStyle}>No insurance certificates found.</p>
        ) : (
          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeaderRowStyle}>
                  <th style={cellStyle}>Contractor</th>
                  <th style={cellStyle}>Insurance Company</th>
                  <th style={cellStyle}>Policy Number</th>
                  <th style={cellStyle}>General Liability</th>
                  <th style={cellStyle}>Workers Compensation</th>
                  <th style={cellStyle}>Auto Liability</th>
                  <th style={cellStyle}>Umbrella Liability</th>
                  <th style={cellStyle}>Received Date</th>
                  <th style={cellStyle}>Status</th>
                  <th style={cellStyle}>Notes</th>
                  <th style={cellStyle}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredCertificates.map((certificate) => {
                  const expirationState = getExpirationState(certificate)

                  return (
                    <tr
                      key={certificate.id}
                      style={rowStyle(expirationState)}
                    >
                      <td style={cellStyle}>{certificate.contractor}</td>
                      <td style={cellStyle}>
                        {certificate.insurance_company || '—'}
                      </td>
                      <td style={cellStyle}>
                        {certificate.policy_number || '—'}
                      </td>
                      <td style={cellStyle}>
                        <ExpirationDate
                          value={certificate.general_liability_expiration_date}
                        />
                      </td>
                      <td style={cellStyle}>
                        <ExpirationDate
                          value={
                            certificate.workers_compensation_expiration_date
                          }
                        />
                      </td>
                      <td style={cellStyle}>
                        <ExpirationDate
                          value={certificate.auto_liability_expiration_date}
                        />
                      </td>
                      <td style={cellStyle}>
                        <ExpirationDate
                          value={
                            certificate.umbrella_liability_expiration_date
                          }
                        />
                      </td>
                      <td style={cellStyle}>
                        {certificate.certificate_received_date || '—'}
                      </td>
                      <td style={cellStyle}>
                        <span style={statusStyle(certificate.status)}>
                          {certificate.status}
                        </span>
                      </td>
                      <td style={notesCellStyle}>
                        {certificate.notes || '—'}
                      </td>
                      <td style={cellStyle}>
                        <div style={actionGroupStyle}>
                          <button
                            type="button"
                            onClick={() => editCertificate(certificate)}
                            style={secondaryButtonStyle}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteCertificate(certificate.id)}
                            style={deleteButtonStyle}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
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
  children: React.ReactNode
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

function ExpirationDate({ value }: { value: string | null }) {
  if (!value) {
    return <span>—</span>
  }

  const state = getDateState(value)

  return (
    <span style={dateStyle(state)}>
      {value}
      {state === 'expired' && ' (Expired)'}
      {state === 'soon' && ' (Within 30 Days)'}
    </span>
  )
}

function getEarliestExpiration(
  certificate: InsuranceCertificate,
): string | null {
  const dates = expirationFields
    .map((field) => certificate[field])
    .filter((date): date is string => Boolean(date))
    .sort()

  return dates[0] ?? null
}

function getDateState(value: string): 'expired' | 'soon' | 'normal' {
  const today = startOfToday()
  const expirationDate = parseDate(value)
  const daysUntilExpiration = Math.ceil(
    (expirationDate.getTime() - today.getTime()) / 86400000,
  )

  if (daysUntilExpiration < 0) return 'expired'
  if (daysUntilExpiration <= 30) return 'soon'
  return 'normal'
}

function getExpirationState(
  certificate: InsuranceCertificate,
): 'expired' | 'soon' | 'normal' {
  const earliestExpiration = getEarliestExpiration(certificate)

  if (!earliestExpiration) return 'normal'
  return getDateState(earliestExpiration)
}

function parseDate(value: string) {
  return new Date(`${value}T00:00:00`)
}

function startOfToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

function dateStyle(state: 'expired' | 'soon' | 'normal') {
  if (state === 'expired') {
    return {
      color: '#b91c1c',
      fontWeight: 700,
    }
  }

  if (state === 'soon') {
    return {
      color: '#b45309',
      fontWeight: 700,
    }
  }

  return {}
}

function rowStyle(state: 'expired' | 'soon' | 'normal') {
  if (state === 'expired') {
    return {
      backgroundColor: '#fef2f2',
    }
  }

  if (state === 'soon') {
    return {
      backgroundColor: '#fffbeb',
    }
  }

  return {
    backgroundColor: '#ffffff',
  }
}

function statusStyle(status: string) {
  const colors: Record<string, { background: string; color: string }> = {
    Active: { background: '#dcfce7', color: '#15803d' },
    'Expiring Soon': { background: '#fef3c7', color: '#b45309' },
    Expired: { background: '#fee2e2', color: '#b91c1c' },
    Pending: { background: '#dbeafe', color: '#1d4ed8' },
    Rejected: { background: '#f3f4f6', color: '#374151' },
  }

  const selected = colors[status] ?? {
    background: '#f3f4f6',
    color: '#374151',
  }

  return {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '999px',
    backgroundColor: selected.background,
    color: selected.color,
    fontSize: '12px',
    fontWeight: 600,
    whiteSpace: 'nowrap' as const,
  }
}

const pageStyle = {
  padding: '20px',
  maxWidth: '1600px',
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
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '16px',
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

const filterBarStyle = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: '10px',
  marginBottom: '16px',
}

const searchInputStyle = {
  ...inputStyle,
  maxWidth: '420px',
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
  minWidth: '1500px',
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
  maxWidth: '220px',
  whiteSpace: 'normal' as const,
}