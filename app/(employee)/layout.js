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
        @media (max-width: 1023px) {
          .employee-sidebar {
            transform: translateX(-100%);
            left: 0;
            z-index: 100;
          }
          .employee-sidebar.open {
            transform: translateX(0);
          }
          .employee-main {
            margin-left: 0 !important;
            padding-top: 60px !important;
          }
          .mobile-header {
            display: flex !important;
          }
        }
        @media (min-width: 1024px) {
          .employee-sidebar {
            transform: translateX(0) !important;
          }
          .mobile-header {
            display: none !important;
          }
          .sidebar-overlay {
            display: none !important;
          }
        }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>

        {/* Mobile Backdrop */}
        {menuOpen && (
          <div
            className="sidebar-overlay"
            onClick={() => setMenuOpen(false)}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 90,
              backdropFilter: 'blur(2px)'
            }}
          />
        )}

        {/* Mobile Header */}
        <header className="mobile-header" style={{
          display: 'none',
          position: 'fixed', top: 0, left: 0, right: 0,
          height: '60px',
          backgroundColor: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-color)',
          zIndex: 80,
          padding: '0 1.25rem',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '1.15rem', margin: 0 }}>Lini HRIS</h2>
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
          >
            <div style={{ width: '24px', height: '2px', backgroundColor: 'var(--text-dark)', marginBottom: '5px', borderRadius: '2px' }}></div>
            <div style={{ width: '24px', height: '2px', backgroundColor: 'var(--text-dark)', marginBottom: '5px', borderRadius: '2px' }}></div>
            <div style={{ width: '24px', height: '2px', backgroundColor: 'var(--text-dark)', borderRadius: '2px' }}></div>
          </button>
        </header>

        {/* Sidebar */}
        <aside
          className={`employee-sidebar ${menuOpen ? 'open' : ''}`}
          style={{
            width: '240px',
            backgroundColor: 'var(--bg-card)',
            borderRight: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed',
            height: '100dvh',
            zIndex: 100,
            boxShadow: 'var(--shadow-sm)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {/* Brand */}
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '1.25rem', margin: 0 }}>Lini HRIS</h2>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Employee Self Service</p>
            </div>
            <button className="mobile-header" onClick={() => setMenuOpen(false)} style={{ display: 'none', background: 'none', border: 'none', fontSize: '1.5rem', color: 'var(--text-muted)' }}>&times;</button>
          </div>

          {/* Navigation */}
          <nav style={{ flex: 1, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto' }}>
            {navItems.map((item) => {
              const isActive = pathname === item.path
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  style={{
                    padding: '0.45rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    textDecoration: 'none',
                    fontWeight: isActive ? '600' : '500',
                    backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                    color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                    display: 'block',
                    fontSize: '0.85rem',
                    transition: 'var(--transition)'
                  }}
                >
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Bottom Actions */}
          <div style={{ padding: '0.5rem', borderTop: '1px solid var(--border-color)', marginTop: 'auto' }}>
            {profile && (
              <div style={{ marginBottom: '0.5rem', padding: '0.4rem', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0, fontSize: '0.7rem' }}>
                  {profile.nama_depan[0]}{profile.nama_belakang?.[0] || ''}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.nama_depan}</p>
                  <p style={{ margin: 0, fontSize: '0.6rem', color: 'var(--text-muted)' }}>{profile.jabatan?.nama_jabatan || 'Karyawan'}</p>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '0.5rem',
                backgroundColor: 'transparent',
                border: '1px solid var(--danger)',
                color: 'var(--danger)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.75rem',
                transition: 'var(--transition)'
              }}
            >
              Keluar
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="employee-main" style={{ flex: 1, marginLeft: '240px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <main style={{ padding: 'var(--page-padding)', flex: 1, transition: 'padding 0.3s ease' }}>
            {children}
          </main>
        </div>
      </div>
    </>

  )
}
