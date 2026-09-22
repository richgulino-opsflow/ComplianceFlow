
'use client'

import { FormEvent, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../../lib/supabase'

type Project = {
  id: number
  project_number: string
  project_name: string
  owner: string | null
  construction_manager: string | null
  start_date: string | null
  end_date: string | null
  status: string
  created_at: string
}

type ProjectForm = {
  project_number: string
  project_name: string
  owner: string
  construction_manager: string
  start_date: string
  end_date: string
  status: string
}

const statuses = [
  'Planning',
  'Active',
  'On Hold',
  'Completed',
  'Cancelled',
]

const initialForm: ProjectForm = {
  project_number: '',
  project_name: '',
  owner: '',
  construction_manager: '',
  start_date: '',
  end_date: '',
  status: 'Planning',
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [form, setForm] = useState<ProjectForm>(initialForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    void loadProjects()
  }, [])

  async function loadProjects() {
    setLoading(true)
    setError('')

    const { data, error: queryError } = await supabase
      .from('projects')
      .select(
        'id, project_number, project_name, owner, construction_manager, start_date, end_date, status, created_at',
      )
      .order('created_at', { ascending: false })

    if (queryError) {
      setError(queryError.message)
      setProjects([])
    } else {
      setProjects((data ?? []) as Project[])
    }

    setLoading(false)
  }

  function updateForm(field: keyof ProjectForm, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!form.project_number.trim() || !form.project_name.trim()) {
      setError('Project Number and Project Name are required.')
      return
    }

    if (
      form.start_date &&
      form.end_date &&
      form.end_date < form.start_date
    ) {
      setError('End Date cannot be earlier than Start Date.')
      return
    }

    setSaving(true)

    const { error: insertError } = await supabase.from('projects').insert({
      project_number: form.project_number.trim(),
      project_name: form.project_name.trim(),
      owner: form.owner.trim() || null,
      construction_manager: form.construction_manager.trim() || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      status: form.status,
    })

    if (insertError) {
      setError(insertError.message)
    } else {
      setForm(initialForm)
      setSuccess('Project created successfully.')
      await loadProjects()
    }

    setSaving(false)
  }

  return (
    <main style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={headingStyle}>Projects</h1>
          <p style={subtitleStyle}>
            Track construction projects and compliance requirements.
          </p>
        </div>
      </div>

      <section style={sectionStyle}>
        <h2 style={sectionHeadingStyle}>Add Project</h2>

        <form onSubmit={handleSubmit}>
          <div style={formGridStyle}>
            <FormField label="Project Number" required>
              <input
                required
                value={form.project_number}
                onChange={(event) =>
                  updateForm('project_number', event.target.value)
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Project Name" required>
              <input
                required
                value={form.project_name}
                onChange={(event) =>
                  updateForm('project_name', event.target.value)
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Owner">
              <input
                value={form.owner}
                onChange={(event) => updateForm('owner', event.target.value)}
                style={inputStyle}
              />
            </FormField>

            <FormField label="Construction Manager">
              <input
                value={form.construction_manager}
                onChange={(event) =>
                  updateForm('construction_manager', event.target.value)
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Start Date">
              <input
                type="date"
                value={form.start_date}
                onChange={(event) =>
                  updateForm('start_date', event.target.value)
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="End Date">
              <input
                type="date"
                value={form.end_date}
                onChange={(event) =>
                  updateForm('end_date', event.target.value)
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Status">
              <select
                value={form.status}
                onChange={(event) => updateForm('status', event.target.value)}
                style={inputStyle}
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          {error && <p style={errorStyle}>{error}</p>}
          {success && <p style={successStyle}>{success}</p>}

          <button type="submit" disabled={saving} style={primaryButtonStyle}>
            {saving ? 'Saving...' : 'Add Project'}
          </button>
        </form>
      </section>

      <section style={sectionStyle}>
        <div style={tableHeaderStyle}>
          <h2 style={sectionHeadingStyle}>All Projects</h2>
          <span style={countStyle}>{projects.length} projects</span>
        </div>

        {loading ? (
          <p style={mutedTextStyle}>Loading projects...</p>
        ) : projects.length === 0 ? (
          <p style={mutedTextStyle}>No projects found.</p>
        ) : (
          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeaderRowStyle}>
                  <th style={cellStyle}>Project Number</th>
                  <th style={cellStyle}>Project Name</th>
                  <th style={cellStyle}>Owner</th>
                  <th style={cellStyle}>Construction Manager</th>
                  <th style={cellStyle}>Start Date</th>
                  <th style={cellStyle}>End Date</th>
                  <th style={cellStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id} style={tableRowStyle}>
                    <td style={cellStyle}>{project.project_number}</td>
                    <td style={cellStyle}>{project.project_name}</td>
                    <td style={cellStyle}>{project.owner || '—'}</td>
                    <td style={cellStyle}>
                      {project.construction_manager || '—'}
                    </td>
                    <td style={cellStyle}>{project.start_date || '—'}</td>
                    <td style={cellStyle}>{project.end_date || '—'}</td>
                    <td style={cellStyle}>
                      <span style={statusStyle(project.status)}>
                        {project.status}
                      </span>
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
    Planning: {
      background: '#dbeafe',
      color: '#1d4ed8',
    },
    Active: {
      background: '#dcfce7',
      color: '#15803d',
    },
    'On Hold': {
      background: '#fef3c7',
      color: '#b45309',
    },
    Completed: {
      background: '#e0e7ff',
      color: '#4338ca',
    },
    Cancelled: {
      background: '#fee2e2',
      color: '#b91c1c',
    },
  }

  const selectedColors = colors[status] ?? {
    background: '#f3f4f6',
    color: '#374151',
  }

  return {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '999px',
    backgroundColor: selectedColors.background,
    color: selectedColors.color,
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

const primaryButtonStyle = {
  marginTop: '18px',
  padding: '10px 20px',
  border: 'none',
  borderRadius: '6px',
  backgroundColor: '#2563eb',
  color: '#ffffff',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 600,
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
  minWidth: '950px',
  borderCollapse: 'collapse' as const,
}

const tableHeaderRowStyle = {
  backgroundColor: '#f3f4f6',
}

const tableRowStyle = {
  backgroundColor: '#ffffff',
}

const cellStyle = {
  padding: '12px 10px',
  border: '1px solid #d1d5db',
  textAlign: 'left' as const,
  verticalAlign: 'middle' as const,
  fontSize: '14px',
  color: '#374151',
}