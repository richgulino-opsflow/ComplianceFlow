'use client'

import { FormEvent, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../../lib/supabase'

type Contractor = {
  id: number
  contractor_name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  trade: string | null
  union: string | null
  insurance_expiration_date: string | null
  certified_payroll_required: boolean
  status: string
  created_at: string
}

type ContractorForm = {
  contractor_name: string
  contact_name: string
  email: string
  phone: string
  trade: string
  union: string
  insurance_expiration_date: string
  certified_payroll_required: boolean
  status: string
}

const statuses = ['Active', 'Inactive', 'Suspended', 'Pending']

const initialForm: ContractorForm = {
  contractor_name: '',
  contact_name: '',
  email: '',
  phone: '',
  trade: '',
  union: '',
  insurance_expiration_date: '',
  certified_payroll_required: false,
  status: 'Active',
}

export default function ContractorsPage() {
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [form, setForm] = useState<ContractorForm>(initialForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    void loadContractors()
  }, [])

  async function loadContractors() {
    setLoading(true)
    setError('')

    const { data, error: queryError } = await supabase
      .from('contractors')
      .select('*')
      .order('created_at', { ascending: false })

    if (queryError) {
      setError(queryError.message)
      setContractors([])
    } else {
      setContractors((data ?? []) as Contractor[])
    }

    setLoading(false)
  }

  function updateField(
    field: keyof ContractorForm,
    value: string | boolean,
  ) {
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

  function editContractor(contractor: Contractor) {
    setEditingId(contractor.id)
    setForm({
      contractor_name: contractor.contractor_name,
      contact_name: contractor.contact_name ?? '',
      email: contractor.email ?? '',
      phone: contractor.phone ?? '',
      trade: contractor.trade ?? '',
      union: contractor.union ?? '',
      insurance_expiration_date:
        contractor.insurance_expiration_date ?? '',
      certified_payroll_required: contractor.certified_payroll_required,
      status: contractor.status,
    })
    setError('')
    setSuccess('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!form.contractor_name.trim()) {
      setError('Contractor Name is required.')
      return
    }

    setSaving(true)

    const contractorData = {
      contractor_name: form.contractor_name.trim(),
      contact_name: form.contact_name.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      trade: form.trade.trim() || null,
      union: form.union.trim() || null,
      insurance_expiration_date:
        form.insurance_expiration_date || null,
      certified_payroll_required: form.certified_payroll_required,
      status: form.status,
    }

    const result = editingId
      ? await supabase
          .from('contractors')
          .update(contractorData)
          .eq('id', editingId)
      : await supabase.from('contractors').insert(contractorData)

    if (result.error) {
      setError(result.error.message)
    } else {
      setSuccess(
        editingId
          ? 'Contractor updated successfully.'
          : 'Contractor created successfully.',
      )
      resetForm()
      await loadContractors()
    }

    setSaving(false)
  }

  async function deleteContractor(id: number) {
    if (!window.confirm('Delete this contractor?')) {
      return
    }

    setError('')
    setSuccess('')

    const { error: deleteError } = await supabase
      .from('contractors')
      .delete()
      .eq('id', id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setSuccess('Contractor deleted successfully.')
    await loadContractors()
  }

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <h1 style={headingStyle}>Contractors</h1>
        <p style={subtitleStyle}>
          Manage contractors and construction compliance information.
        </p>
      </header>

      <section style={sectionStyle}>
        <h2 style={sectionHeadingStyle}>
          {editingId ? 'Edit Contractor' : 'Add Contractor'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={formGridStyle}>
            <FormField label="Contractor Name" required>
              <input
                required
                value={form.contractor_name}
                onChange={(event) =>
                  updateField('contractor_name', event.target.value)
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Contact Name">
              <input
                value={form.contact_name}
                onChange={(event) =>
                  updateField('contact_name', event.target.value)
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  updateField('email', event.target.value)
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Phone">
              <input
                value={form.phone}
                onChange={(event) =>
                  updateField('phone', event.target.value)
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Trade">
              <input
                value={form.trade}
                onChange={(event) =>
                  updateField('trade', event.target.value)
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Union">
              <input
                value={form.union}
                onChange={(event) =>
                  updateField('union', event.target.value)
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Insurance Expiration Date">
              <input
                type="date"
                value={form.insurance_expiration_date}
                onChange={(event) =>
                  updateField(
                    'insurance_expiration_date',
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

            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={form.certified_payroll_required}
                onChange={(event) =>
                  updateField(
                    'certified_payroll_required',
                    event.target.checked,
                  )
                }
              />
              Certified Payroll Required
            </label>
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
                  ? 'Update Contractor'
                  : 'Add Contractor'}
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
          <h2 style={sectionHeadingStyle}>All Contractors</h2>
          <span style={countStyle}>
            {contractors.length} contractors
          </span>
        </div>

        {loading ? (
          <p style={mutedTextStyle}>Loading contractors...</p>
        ) : contractors.length === 0 ? (
          <p style={mutedTextStyle}>No contractors found.</p>
        ) : (
          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeaderRowStyle}>
                  <th style={cellStyle}>Contractor Name</th>
                  <th style={cellStyle}>Contact Name</th>
                  <th style={cellStyle}>Email</th>
                  <th style={cellStyle}>Phone</th>
                  <th style={cellStyle}>Trade</th>
                  <th style={cellStyle}>Union</th>
                  <th style={cellStyle}>Insurance Expiration</th>
                  <th style={cellStyle}>Certified Payroll</th>
                  <th style={cellStyle}>Status</th>
                  <th style={cellStyle}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {contractors.map((contractor) => (
                  <tr key={contractor.id}>
                    <td style={cellStyle}>
                      {contractor.contractor_name}
                    </td>
                    <td style={cellStyle}>
                      {contractor.contact_name || '—'}
                    </td>
                    <td style={cellStyle}>{contractor.email || '—'}</td>
                    <td style={cellStyle}>{contractor.phone || '—'}</td>
                    <td style={cellStyle}>{contractor.trade || '—'}</td>
                    <td style={cellStyle}>{contractor.union || '—'}</td>
                    <td style={cellStyle}>
                      {contractor.insurance_expiration_date || '—'}
                    </td>
                    <td style={cellStyle}>
                      {contractor.certified_payroll_required
                        ? 'Yes'
                        : 'No'}
                    </td>
                    <td style={cellStyle}>
                      <span style={statusStyle(contractor.status)}>
                        {contractor.status}
                      </span>
                    </td>
                    <td style={cellStyle}>
                      <div style={actionGroupStyle}>
                        <button
                          type="button"
                          onClick={() => editContractor(contractor)}
                          style={secondaryButtonStyle}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            deleteContractor(contractor.id)
                          }
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

function statusStyle(status: string) {
  const colors: Record<string, { background: string; color: string }> = {
    Active: {
      background: '#dcfce7',
      color: '#15803d',
    },
    Inactive: {
      background: '#f3f4f6',
      color: '#374151',
    },
    Suspended: {
      background: '#fee2e2',
      color: '#b91c1c',
    },
    Pending: {
      background: '#fef3c7',
      color: '#b45309',
    },
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
  maxWidth: '1400px',
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

const labelStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '5px',
  color: '#374151',
  fontSize: '14px',
  fontWeight: 500,
}

const checkboxLabelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  color: '#374151',
  fontSize: '14px',
  fontWeight: 500,
  alignSelf: 'end',
  paddingBottom: '10px',
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
  minWidth: '1250px',
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