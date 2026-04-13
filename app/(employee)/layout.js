'use client';

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

export default function EmployeeLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const res = await fetch('/api/profile')
        const data = await res.json()
        if (res.ok) {
          if (data.profile?.role === 'admin' || data.profile?.role === 'hr') {
            router.replace('/')
            return
          }
          setProfile(data.profile)
        }
      }
      setLoading(false)
    }
    init()
  }, [router])

  // Close menu when navigating
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navItems = [
    { name: 'Dashboard', path: '/dashboard-karyawan' },
    { name: 'Slip Gaji Saya', path: '/dashboard-karyawan/slip-gaji' },
    { name: 'Pengajuan Cuti', path: '/dashboard-karyawan/cuti' },
    { name: 'Reset Password', path: '/dashboard-karyawan/reset-password' },
  ]

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Loading...
      </div>
    )
  }

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .employee-sidebar {
            transform: translateX(-100%);
            transition: transform 0.3s ease;
          }
          .employee-sidebar.open {
            transform: translateX(0);
          }
          .employee-main {
            margin-left: 0 !important;
          }
          .sidebar-overlay {
            display: block !important;
          }
          .mobile-topbar {
            display: flex !important;
          }
          .employee-main-content {
            padding: 1rem !important;
          }
        }
        @media (min-width: 769px) {
          .employee-sidebar {
            transform: translateX(0) !important;
          }
          .mobile-topbar {
            display: none !important;
          }
        }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-color)', color: 'var(--text-dark)', fontFamily: 'sans-serif' }}>

        {/* Mobile Overlay */}
        {menuOpen && (
          <div
            className="sidebar-overlay"
            onClick={() => setMenuOpen(false)}
            style={{
              display: 'none',
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 40
            }}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`employee-sidebar${menuOpen ? ' open' : ''}`}
          style={{
            width: '260px',
            backgroundColor: 'var(--bg-card)',
            borderRight: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed',
            height: '100vh',
            zIndex: 50,
            transition: 'transform 0.3s ease'
          }}
        >
          {/* Brand */}
          <div style={{ padding: '2rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: 'var(--primary)' }}>
              Lini HRIS
            </h1>
          </div>

          {/* Navigation */}
          <nav style={{ flex: 1, padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {navItems.map((item) => {
              const isActive = pathname === item.path
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  style={{
                    padding: '0.875rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    textDecoration: 'none',
                    fontWeight: isActive ? 'bold' : 'normal',
                    backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                    color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                    display: 'block',
                    fontSize: '0.9rem'
                  }}
                >
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Bottom Actions */}
          <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
            {profile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>
                  {profile.nama_depan[0]}{profile.nama_belakang?.[0] || ''}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.nama_depan}</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{profile.jabatan?.nama_jabatan || 'Karyawan'}</p>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'transparent',
                border: '1px solid var(--danger)',
                color: 'var(--danger)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Keluar
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="employee-main" style={{ flex: 1, marginLeft: '260px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* Mobile Top Bar */}
          <header
            className="mobile-topbar"
            style={{
              display: 'none',
              position: 'sticky', top: 0,
              zIndex: 30,
              backgroundColor: 'var(--bg-card)',
              borderBottom: '1px solid var(--border-color)',
              padding: '1rem 1.25rem',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '1.1rem' }}>Lini HRIS</span>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '0.25rem', display: 'flex', flexDirection: 'column', gap: '5px'
              }}
              aria-label="Toggle menu"
            >
              <span style={{ display: 'block', width: '22px', height: '2px', backgroundColor: menuOpen ? 'var(--primary)' : 'var(--text-dark)', transition: 'all 0.3s', transform: menuOpen ? 'translateY(7px) rotate(45deg)' : 'none' }} />
              <span style={{ display: 'block', width: '22px', height: '2px', backgroundColor: 'var(--text-dark)', opacity: menuOpen ? 0 : 1, transition: 'all 0.3s' }} />
              <span style={{ display: 'block', width: '22px', height: '2px', backgroundColor: menuOpen ? 'var(--primary)' : 'var(--text-dark)', transition: 'all 0.3s', transform: menuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none' }} />
            </button>
          </header>

          <main className="employee-main-content" style={{ padding: '2rem', flex: 1 }}>
            {children}
          </main>
        </div>
      </div>
    </>
  )
}
