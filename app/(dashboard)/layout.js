'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

export default function DashboardLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState(null)
  const [roleChecked, setRoleChecked] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        try {
          const res = await fetch('/api/profile')
          const data = await res.json()
          if (res.ok && data.profile) {
            const role = data.profile.role
            if (role !== 'admin' && role !== 'hr') {
              setRoleChecked(true)
              router.replace('/dashboard-karyawan')
              return
            }
          }
        } catch (err) {
          console.error('Error checking role:', err)
        }
      }
      setRoleChecked(true)
    }
    init();
  }, [router]);

  // Close menu on navigation
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const navItems = [
    { name: 'Dashboard', path: '/' },
    { name: 'Karyawan', path: '/karyawan' },
    { name: 'Absensi', path: '/absensi' },
    { name: 'Rekap Absensi', path: '/rekap-absensi' },
    { name: 'Cuti', path: '/cuti' },
    { name: 'Payroll', path: '/payroll' },
    { name: 'Laporan', path: '/laporan' },
  ]

  if (!roleChecked) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }}></div>
          <p style={{ color: 'var(--text-muted)' }}>Memverifikasi akses...</p>
          <style dangerouslySetInnerHTML={{ __html: '@keyframes spin { to { transform: rotate(360deg); } }' }} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
      <style>{`
        @media (max-width: 1023px) {
          .admin-sidebar {
            transform: translateX(-100%);
            left: 0;
            z-index: 100;
          }
          .admin-sidebar.open {
            transform: translateX(0);
          }
          .admin-main {
            margin-left: 0 !important;
            padding-top: 60px !important;
          }
          .mobile-header {
            display: flex !important;
          }
        }
        @media (min-width: 1024px) {
          .admin-sidebar {
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
      <aside className={`admin-sidebar ${menuOpen ? 'open' : ''}`} style={{
        width: '240px',
        backgroundColor: 'var(--bg-card)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        boxShadow: 'var(--shadow-sm)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '1.25rem', margin: 0 }}>Lini HRIS</h2>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Enterprise Edition</p>
          </div>
          <button className="mobile-header" onClick={() => setMenuOpen(false)} style={{ display: 'none', background: 'none', border: 'none', fontSize: '1.5rem', color: 'var(--text-muted)' }}>&times;</button>
        </div>
        
        <nav style={{ flex: 1, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.path
            return (
              <Link key={item.path} href={item.path} style={{
                padding: '0.6rem 0.875rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: isActive ? '600' : '500',
                transition: 'var(--transition)',
                display: 'block',
                fontSize: '0.875rem'
              }}>
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ marginBottom: '0.75rem', padding: '0.5rem', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: '600', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email || 'Loading...'}</p>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: 0 }}>Administrator</p>
          </div>
          <button 
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '0.6rem',
              backgroundColor: 'transparent',
              border: '1px solid var(--danger)',
              color: 'var(--danger)',
              borderRadius: 'var(--radius-md)',
              fontWeight: '500',
              cursor: 'pointer',
              fontSize: '0.8rem',
              transition: 'var(--transition)'
            }}
          >
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main" style={{ flex: 1, marginLeft: '240px', padding: 'var(--page-padding)', transition: 'margin-left 0.3s ease' }}>
        {children}
      </main>
    </div>
  )
}

