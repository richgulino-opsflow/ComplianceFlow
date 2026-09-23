'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navigationItems = [
  { label: 'Home', href: '/' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Projects', href: '/projects' },
  { label: 'Contractors', href: '/contractors' },
  { label: 'Insurance', href: '/insurance' },
  { label: 'Payroll', href: '/payroll' },
  { label: 'AA202', href: '/aa202' },
  { label: 'Documents', href: '/documents' },
]

export default function MainNavigation() {
  const pathname = usePathname()

  return (
    <aside style={sidebarStyle}>
      <div style={brandStyle}>ComplianceFlow</div>

      <nav aria-label="Main navigation" style={navStyle}>
        {navigationItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname === item.href ||
                pathname.startsWith(`${item.href}/`)

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                ...linkStyle,
                ...(isActive ? activeLinkStyle : {}),
              }}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

const sidebarStyle = {
  position: 'fixed' as const,
  top: 0,
  left: 0,
  zIndex: 1000,
  width: '240px',
  height: '100vh',
  boxSizing: 'border-box' as const,
  padding: '24px 16px',
  borderRight: '1px solid #d1d5db',
  backgroundColor: '#ffffff',
}

const brandStyle = {
  marginBottom: '28px',
  padding: '0 12px',
  color: '#2563eb',
  fontSize: '21px',
  fontWeight: 700,
}

const navStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '6px',
}

const linkStyle = {
  display: 'block',
  padding: '11px 12px',
  borderRadius: '6px',
  color: '#4b5563',
  fontSize: '14px',
  fontWeight: 500,
  textDecoration: 'none',
}

const activeLinkStyle = {
  backgroundColor: '#dbeafe',
  color: '#1d4ed8',
  fontWeight: 600,
}