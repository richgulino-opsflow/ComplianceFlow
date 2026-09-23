'use client'

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '../../lib/supabase'

type DocumentRecord = {
  id: number
  project: string
  contractor: string | null
  document_type: string
  document_name: string
  upload_date: string
  expiration_date: string | null
  status: string
  notes: string | null
  file_url: string | null
  created_at: string
}

type DocumentForm = {
  project: string
  contractor: string
  document_type: string
  document_name: string
  upload_date: string
  expiration_date: string
  status: string
  notes: string
  file_url: string
}

const documentTypes = [
  'Insurance Certificate',
  'Certified Payroll',
  'AA202 Report',
  'W9',
  'Contract',
  'Safety Plan',
  'Other',
]

const statuses = ['Active', 'Pending', 'Expired', 'Archived']

const initialForm: DocumentForm = {
  project: '',
  contractor: '',
  document_type: 'Insurance Certificate',
  document_name: '',
  upload_date: new Date().toISOString().slice(0, 10),
  expiration_date: '',
  status: 'Active',
  notes: '',
  file_url: '',
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [form, setForm] = useState<DocumentForm>(initialForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [search, setSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [contractorFilter, setContractorFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    void loadDocuments()
  }, [])

  async function loadDocuments() {
    setLoading(true)
    setError('')

    const { data, error: queryError } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })

    if (queryError) {
      setDocuments([])
      setError(queryError.message)
    } else {
      setDocuments((data ?? []) as DocumentRecord[])
    }

    setLoading(false)
  }

  function updateField(field: keyof DocumentForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function resetForm() {
    setForm(initialForm)
    setSelectedFile(null)
    setEditingId(null)
    setError('')
    setSuccess('')
  }

  function editDocument(document: DocumentRecord) {
    setEditingId(document.id)
    setSelectedFile(null)
    setForm({
      project: document.project,
      contractor: document.contractor ?? '',
      document_type: document.document_type,
      document_name: document.document_name,
      upload_date: document.upload_date,
      expiration_date: document.expiration_date ?? '',
      status: document.status,
      notes: document.notes ?? '',
      file_url: document.file_url ?? '',
    })

    setError('')
    setSuccess('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function uploadFile(file: File) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${Date.now()}-${safeName}`

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      throw uploadError
    }

    const { data } = supabase.storage.from('documents').getPublicUrl(path)
    return data.publicUrl
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!form.project.trim() || !form.document_name.trim()) {
      setError('Project and Document Name are required.')
      return
    }

    if (
      form.upload_date &&
      form.expiration_date &&
      form.expiration_date < form.upload_date
    ) {
      setError('Expiration Date cannot be earlier than Upload Date.')
      return
    }

    setSaving(true)

    try {
      let fileUrl = form.file_url.trim() || null

      if (selectedFile) {
        fileUrl = await uploadFile(selectedFile)
      }

      const documentData = {
        project: form.project.trim(),
        contractor: form.contractor.trim() || null,
        document_type: form.document_type,
        document_name: form.document_name.trim(),
        upload_date: form.upload_date,
        expiration_date: form.expiration_date || null,
        status: form.status,
        notes: form.notes.trim() || null,
        file_url: fileUrl,
      }

      const result = editingId
        ? await supabase
            .from('documents')
            .update(documentData)
            .eq('id', editingId)
        : await supabase.from('documents').insert(documentData)

      if (result.error) {
        setError(result.error.message)
      } else {
        setSuccess(
          editingId
            ? 'Document updated successfully.'
            : 'Document created successfully.',
        )
        resetForm()
        await loadDocuments()
      }
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Unable to upload the file.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function deleteDocument(document: DocumentRecord) {
    if (!window.confirm('Delete this document?')) return

    setError('')
    setSuccess('')

    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', document.id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setSuccess('Document deleted successfully.')
    await loadDocuments()
  }

  const projects = useMemo(
    () => uniqueValues(documents.map((document) => document.project)),
    [documents],
  )

  const contractors = useMemo(
    () =>
      uniqueValues(
        documents
          .map((document) => document.contractor)
          .filter((value): value is string => Boolean(value)),
      ),
    [documents],
  )

  const filteredDocuments = useMemo(() => {
    const searchText = search.trim().toLowerCase()

    return documents.filter((document) => {
      const matchesSearch =
        !searchText ||
        [
          document.project,
          document.contractor,
          document.document_type,
          document.document_name,
          document.status,
          document.notes,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(searchText),
          )

      return (
        matchesSearch &&
        (!projectFilter || document.project === projectFilter) &&
        (!contractorFilter || document.contractor === contractorFilter) &&
        (!typeFilter || document.document_type === typeFilter)
      )
    })
  }, [documents, search, projectFilter, contractorFilter, typeFilter])

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <h1 style={headingStyle}>Document Management</h1>
        <p style={subtitleStyle}>
          Manage project, contractor, and compliance documents.
        </p>
      </header>

      <section style={sectionStyle}>
        <h2 style={sectionHeadingStyle}>
          {editingId ? 'Edit Document' : 'Add Document'}
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

            <FormField label="Contractor">
              <input
                value={form.contractor}
                onChange={(event) =>
                  updateField('contractor', event.target.value)
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Document Type" required>
              <select
                required
                value={form.document_type}
                onChange={(event) =>
                  updateField('document_type', event.target.value)
                }
                style={inputStyle}
              >
                {documentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Document Name" required>
              <input
                required
                value={form.document_name}
                onChange={(event) =>
                  updateField('document_name', event.target.value)
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Upload Date" required>
              <input
                required
                type="date"
                value={form.upload_date}
                onChange={(event) =>
                  updateField('upload_date', event.target.value)
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Expiration Date">
              <input
                type="date"
                value={form.expiration_date}
                onChange={(event) =>
                  updateField('expiration_date', event.target.value)
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Status" required>
              <select
                required
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

            <FormField label="File">
              <input
                type="file"
                onChange={(event) =>
                  setSelectedFile(event.target.files?.[0] ?? null)
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="File URL">
              <input
                type="url"
                value={form.file_url}
                onChange={(event) =>
                  updateField('file_url', event.target.value)
                }
                placeholder="Optional external URL"
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
                  ? 'Update Document'
                  : 'Add Document'}
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
          <h2 style={sectionHeadingStyle}>All Documents</h2>
          <span style={countStyle}>
            {filteredDocuments.length} documents
          </span>
        </div>

        <div style={filterGridStyle}>
          <input
            placeholder="Search documents..."
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

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            style={inputStyle}
          >
            <option value="">All Document Types</option>
            {documentTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              setSearch('')
              setProjectFilter('')
              setContractorFilter('')
              setTypeFilter('')
            }}
            style={secondaryButtonStyle}
          >
            Clear Filters
          </button>
        </div>

        {loading ? (
          <p style={mutedTextStyle}>Loading documents...</p>
        ) : filteredDocuments.length === 0 ? (
          <p style={mutedTextStyle}>No documents found.</p>
        ) : (
          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeaderRowStyle}>
                  <th style={cellStyle}>Project</th>
                  <th style={cellStyle}>Contractor</th>
                  <th style={cellStyle}>Document Type</th>
                  <th style={cellStyle}>Document Name</th>
                  <th style={cellStyle}>Upload Date</th>
                  <th style={cellStyle}>Expiration Date</th>
                  <th style={cellStyle}>Status</th>
                  <th style={cellStyle}>Notes</th>
                  <th style={cellStyle}>File</th>
                  <th style={cellStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((document) => (
                  <tr
                    key={document.id}
                    style={rowStyle(document.expiration_date)}
                  >
                    <td style={cellStyle}>{document.project}</td>
                    <td style={cellStyle}>
                      {document.contractor || '—'}
                    </td>
                    <td style={cellStyle}>{document.document_type}</td>
                    <td style={cellStyle}>{document.document_name}</td>
                    <td style={cellStyle}>{document.upload_date}</td>
                    <td style={cellStyle}>
                      <ExpirationDate value={document.expiration_date} />
                    </td>
                    <td style={cellStyle}>
                      <span style={statusStyle(document.status)}>
                        {document.status}
                      </span>
                    </td>
                    <td style={notesCellStyle}>
                      {document.notes || '—'}
                    </td>
                    <td style={cellStyle}>
                      {document.file_url ? (
                        <a
                          href={document.file_url}
                          target="_blank"
                          rel="noreferrer"
                          style={linkStyle}
                        >
                          View File
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={cellStyle}>
                      <div style={actionGroupStyle}>
                        <button
                          type="button"
                          onClick={() => editDocument(document)}
                          style={secondaryButtonStyle}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteDocument(document)}
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

function ExpirationDate({ value }: { value: string | null }) {
  if (!value) return <span>—</span>

  const days = getDaysUntil(value)

  return (
    <span style={expirationStyle(days)}>
      {value}
      {days < 0 ? ' (Expired)' : days <= 30 ? ' (Within 30 Days)' : ''}
    </span>
  )
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  )
}

function getDaysUntil(value: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const expiration = new Date(`${value}T00:00:00`)

  return Math.ceil(
    (expiration.getTime() - today.getTime()) / 86400000,
  )
}

function expirationStyle(days: number) {
  if (days < 0) {
    return { color: '#b91c1c', fontWeight: 700 }
  }

  if (days <= 30) {
    return { color: '#b45309', fontWeight: 700 }
  }

  return {}
}

function rowStyle(expirationDate: string | null) {
  if (!expirationDate) return { backgroundColor: '#ffffff' }

  const days = getDaysUntil(expirationDate)

  if (days < 0) return { backgroundColor: '#fef2f2' }
  if (days <= 30) return { backgroundColor: '#fffbeb' }

  return { backgroundColor: '#ffffff' }
}

function statusStyle(status: string) {
  const colors: Record<string, { background: string; color: string }> = {
    Active: { background: '#dcfce7', color: '#15803d' },
    Pending: { background: '#dbeafe', color: '#1d4ed8' },
    Expired: { background: '#fee2e2', color: '#b91c1c' },
    Archived: { background: '#f3f4f6', color: '#374151' },
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
  gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
  gap: '16px',
}

const filterGridStyle = {
  display: 'grid',
  gridTemplateColumns:
    'minmax(240px, 2fr) repeat(3, minmax(180px, 1fr)) auto',
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
  maxWidth: '240px',
  whiteSpace: 'normal' as const,
}

const linkStyle = {
  color: '#2563eb',
  textDecoration: 'none',
}