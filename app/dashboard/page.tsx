'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Project = {
  id: number
  project_number: string
  project_name: string
  status: string
  created_at: string
}

type Contractor = {
  id: number
  contractor_name: string
  trade: string | null
  status: string
  created_at: string
}

type InsuranceCertificate = {
  id: number
  contractor: string
  insurance_company: string | null
  policy_number: string | null
  general_liability_expiration_date: string | null
  workers_compensation_expiration_date: string | null
  auto_liability_expiration_date: string | null
  umbrella_liability_expiration_date: string | null
  status: string
}

type AA202Report = {
  id: number
  project: string
  contractor: string
  week_ending_date: string
  employee_name: string
  created_at: string
}

type DashboardData = {
  totalProjects: number
  activeProjects: number
  totalContractors: number
  activeContractors: number
  expiringInsurance: InsuranceCertificate[]
  expiredInsurance: InsuranceCertificate[]
  recentContractors: Contractor[]
  recentProjects: Project[]
  reportsThisWeek: number
  missingReportsThisWeek: number
}

const emptyDashboard: DashboardData = {
  totalProjects: 0,
  activeProjects: 0,
  totalContractors: 0,
  activeContractors: 0,
  expiringInsurance: [],
  expiredInsurance: [],
  recentContractors: [],
  recentProjects: [],
  reportsThisWeek: 0,
  missingReportsThisWeek: 0,
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData>(emptyDashboard)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    void loadDashboard()
  }, [])

  async function loadDashboard() {
    setLoading(true)
    setError('')

    const [
      projectsResult,
      contractorsResult,
      insuranceResult,
      reportsResult,
    ] = await Promise.all([
      supabase
        .from('projects')
        .select(
          'id, project_number, project_name, status, created_at',
        )
        .order('created_at', { ascending: false }),

      supabase
        .from('contractors')
        .select('id, contractor_name, trade, status, created_at')
        .order('created_at', { ascending: false }),

      supabase
        .from('insurance_certificates')
        .select(
          'id, contractor, insurance_company, policy_number, general_liability_expiration_date, workers_compensation_expiration_date, auto_liability_expiration_date, umbrella_liability_expiration_date, status',
        ),

      supabase
        .from('aa202_reports')
        .select(
          'id, project, contractor, week_ending_date, employee_name, created_at',
        )
        .gte('week_ending_date', getStartOfWeek())
        .lte('week_ending_date', getEndOfWeek()),
    ])

    const queryError =
      projectsResult.error ||
      contractorsResult.error ||
      insuranceResult.error ||
      reportsResult.error

    if (queryError) {
      setError(queryError.message)
      setLoading(false)
      return
    }

    const projects = (projectsResult.data ?? []) as Project[]
    const contractors = (contractorsResult.data ?? []) as Contractor[]
    const certificates = (insuranceResult.data ??
      []) as InsuranceCertificate[]
    const reports = (reportsResult.data ?? []) as AA202Report[]

    const activeProjects = projects.filter((project) =>
      isActiveStatus(project.status),
    )

    const activeContractors = contractors.filter((contractor) =>
      isActiveStatus(contractor.status),
    )

    const expiringInsurance = certificates
      .filter((certificate) =>
        hasExpirationWithin30Days(certificate),
      )
      .sort((first, second) =>
        getEarliestExpiration(first).localeCompare(
          getEarliestExpiration(second),
        ),
      )

    const expiredInsurance = certificates.filter((certificate) =>
      hasExpiredCoverage(certificate),
    )

    const reportedProjects = new Set(
      reports.map((report) => report.project.trim().toLowerCase()),
    )

    const missingReportsThisWeek = activeProjects.filter((project) => {
      const projectNames = [
        project.project_name,
        project.project_number,
      ].map((value) => value.trim().toLowerCase())

      return !projectNames.some((name) => reportedProjects.has(name))
    }).length

    setDashboard({
      totalProjects: projects.length,
      activeProjects: activeProjects.length,
      totalContractors: contractors.length,
      activeContractors: activeContractors.length,
      expiringInsurance,
      expiredInsurance,
      recentContractors: contractors.slice(0, 5),
      recentProjects: projects.slice(0, 5),
      reportsThisWeek: reports.length,
      missingReportsThisWeek,
    })

    setLoading(false)
  }

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <h1 style={headingStyle}>Compliance Dashboard</h1>
        <p style={subtitleStyle}>
          Monitor project, contractor, insurance, and workforce compliance.
        </p>
      </header>

      {error && <div style={errorBannerStyle}>{error}</div>}

      {loading ? (
        <p style={mutedTextStyle}>Loading dashboard...</p>
      ) : (
        <>
          <section style={metricsGridStyle}>
            <MetricCard
              label="Total Projects"
              value={dashboard.totalProjects}
              color="#2563eb"
            />
            <MetricCard
              label="Active Projects"
              value={dashboard.activeProjects}
              color="#16a34a"
            />
            <MetricCard
              label="Total Contractors"
              value={dashboard.totalContractors}
              color="#7c3aed"
            />
            <MetricCard
              label="Active Contractors"
              value={dashboard.activeContractors}
              color="#0891b2"
            />
            <MetricCard
              label="Insurance Expiring in 30 Days"
              value={dashboard.expiringInsurance.length}
              color="#d97706"
            />
            <MetricCard
              label="Insurance Certificates Expired"
              value={dashboard.expiredInsurance.length}
              color="#dc2626"
            />
            <MetricCard
              label="AA202 Reports This Week"
              value={dashboard.reportsThisWeek}
              color="#059669"
            />
            <MetricCard
              label="AA202 Reports Missing This Week"
              value={dashboard.missingReportsThisWeek}
              color="#b91c1c"
            />
          </section>

          <section style={tablesGridStyle}>
            <DashboardTable
              title="Expiring Insurance Certificates"
              emptyMessage="No certificates are expiring within 30 days."
            >
              {dashboard.expiringInsurance.map((certificate) => (
                <tr key={certificate.id}>
                  <td style={cellStyle}>{certificate.contractor}</td>
                  <td style={cellStyle}>
                    {certificate.insurance_company || '—'}
                  </td>
                  <td style={cellStyle}>
                    {getEarliestExpiration(certificate)}
                  </td>
                  <td style={cellStyle}>
                    <span style={warningBadgeStyle}>Expiring Soon</span>
                  </td>
                </tr>
              ))}
            </DashboardTable>

            <DashboardTable
              title="Recently Added Contractors"
              emptyMessage="No contractors have been added."
            >
              {dashboard.recentContractors.map((contractor) => (
                <tr key={contractor.id}>
                  <td style={cellStyle}>{contractor.contractor_name}</td>
                  <td style={cellStyle}>{contractor.trade || '—'}</td>
                  <td style={cellStyle}>{contractor.status}</td>
                  <td style={cellStyle}>
                    {formatDate(contractor.created_at)}
                  </td>
                </tr>
              ))}
            </DashboardTable>

            <DashboardTable
              title="Recently Added Projects"
              emptyMessage="No projects have been added."
            >
              {dashboard.recentProjects.map((project) => (
                <tr key={project.id}>
                  <td style={cellStyle}>{project.project_number}</td>
                  <td style={cellStyle}>{project.project_name}</td>
                  <td style={cellStyle}>{project.status}</td>
                  <td style={cellStyle}>
                    {formatDate(project.created_at)}
                  </td>
                </tr>
              ))}
            </DashboardTable>
          </section>
        </>
      )}
    </main>
  )
}

function MetricCard({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <article style={{ ...metricCardStyle, borderTopColor: color }}>
      <p style={metricLabelStyle}>{label}</p>
      <p style={{ ...metricValueStyle, color }}>{value}</p>
    </article>
  )
}

function DashboardTable({
  title,
  emptyMessage,
  children,
}: {
  title: string
  emptyMessage: string
  children: React.ReactNode
}) {
  return (
    <section style={tableCardStyle}>
      <h2 style={sectionHeadingStyle}>{title}</h2>

      <div style={tableWrapperStyle}>
        <table style={tableStyle}>
          <thead>
            <tr style={tableHeaderRowStyle}>
              {title === 'Expiring Insurance Certificates' ? (
                <>
                  <th style={cellStyle}>Contractor</th>
                  <th style={cellStyle}>Insurance Company</th>
                  <th style={cellStyle}>Expiration Date</th>
                  <th style={cellStyle}>Status</th>
                </>
              ) : title === 'Recently Added Contractors' ? (
                <>
                  <th style={cellStyle}>Contractor</th>
                  <th style={cellStyle}>Trade</th>
                  <th style={cellStyle}>Status</th>
                  <th style={cellStyle}>Added</th>
                </>
              ) : (
                <>
                  <th style={cellStyle}>Project Number</th>
                  <th style={cellStyle}>Project Name</th>
                  <th style={cellStyle}>Status</th>
                  <th style={cellStyle}>Added</th>
                </>
              )}
            </tr>
          </thead>

          <tbody>
            {children}
          </tbody>
        </table>
      </div>

      {!children && <p style={mutedTextStyle}>{emptyMessage}</p>}
    </section>
  )
}

function isActiveStatus(status: string) {
  return status.toLowerCase() === 'active'
}

function getExpirationDates(certificate: InsuranceCertificate) {
  return [
    certificate.general_liability_expiration_date,
    certificate.workers_compensation_expiration_date,
    certificate.auto_liability_expiration_date,
    certificate.umbrella_liability_expiration_date,
  ].filter((date): date is string => Boolean(date))
}

function getEarliestExpiration(certificate: InsuranceCertificate) {
  return getExpirationDates(certificate).sort()[0] ?? '—'
}

function hasExpirationWithin30Days(certificate: InsuranceCertificate) {
  return getExpirationDates(certificate).some((date) => {
    const days = getDaysUntil(date)
    return days >= 0 && days <= 30
  })
}

function hasExpiredCoverage(certificate: InsuranceCertificate) {
  return getExpirationDates(certificate).some(
    (date) => getDaysUntil(date) < 0,
  )
}

function getDaysUntil(dateValue: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const expiration = new Date(`${dateValue}T00:00:00`)
  return Math.ceil(
    (expiration.getTime() - today.getTime()) / 86400000,
  )
}

function getStartOfWeek() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)

  const day = date.getDay()
  const difference = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + difference)

  return toDateString(date)
}

function getEndOfWeek() {
  const date = new Date(`${getStartOfWeek()}T00:00:00`)
  date.setDate(date.getDate() + 6)
  return toDateString(date)
}

function toDateString(date: Date) {
  return date.toISOString().slice(0, 10)
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString()
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

const metricsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
  gap: '16px',
  marginBottom: '24px',
}

const metricCardStyle = {
  minHeight: '120px',
  padding: '18px',
  border: '1px solid #d1d5db',
  borderTop: '4px solid',
  borderRadius: '8px',
  backgroundColor: '#ffffff',
  boxSizing: 'border-box' as const,
}

const metricLabelStyle = {
  margin: 0,
  color: '#6b7280',
  fontSize: '14px',
  fontWeight: 500,
}

const metricValueStyle = {
  margin: '16px 0 0',
  fontSize: '32px',
  fontWeight: 700,
}

const tablesGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
  gap: '24px',
}

const tableCardStyle = {
  minWidth: 0,
  padding: '20px',
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  backgroundColor: '#ffffff',
}

const sectionHeadingStyle = {
  margin: '0 0 16px',
  color: '#111827',
  fontSize: '18px',
  fontWeight: 600,
}

const tableWrapperStyle = {
  overflowX: 'auto' as const,
}

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse' as const,
}

const tableHeaderRowStyle = {
  backgroundColor: '#f3f4f6',
}

const cellStyle = {
  padding: '10px',
  border: '1px solid #d1d5db',
  color: '#374151',
  fontSize: '14px',
  textAlign: 'left' as const,
  verticalAlign: 'middle' as const,
}

const warningBadgeStyle = {
  display: 'inline-block',
  padding: '4px 8px',
  borderRadius: '999px',
  backgroundColor: '#fef3c7',
  color: '#b45309',
  fontSize: '12px',
  fontWeight: 600,
  whiteSpace: 'nowrap' as const,
}

const errorBannerStyle = {
  marginBottom: '20px',
  padding: '12px 16px',
  border: '1px solid #fecaca',
  borderRadius: '6px',
  backgroundColor: '#fef2f2',
  color: '#b91c1c',
}

const mutedTextStyle = {
  color: '#6b7280',
}