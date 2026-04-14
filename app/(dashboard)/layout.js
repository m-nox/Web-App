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

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        // Check role - redirect karyawan to their own dashboard
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
    
    // // Add popstate listener for "Back to Dashboard" requirement
    // const handlePopState = (event) => {
    //   setTimeout(() => {
    //     const path = window.location.pathname;
    //     if (path !== '/' && !path.startsWith('/login')) {
    //       router.replace('/');
    //     }
    //   }, 0);
    // };

    // if (typeof window !== 'undefined') {
    //   window.addEventListener('popstate', handlePopState);
    // }

    init();

    // return () => {
    //   if (typeof window !== 'undefined') {
    //     window.removeEventListener('popstate', handlePopState);
    //   }
    // };
  }, [router]);

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
      {/* Sidebar */}
      <aside style={{
        width: '240px',
        backgroundColor: 'var(--bg-card)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '1.25rem', margin: 0 }}>Lini HRIS</h2>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Enterprise Edition</p>
        </div>
        
        <nav style={{ flex: 1, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
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
            <p style={{ fontSize: '0.8rem', fontWeight: '600', margin: 0 }}>{user?.email || 'Loading...'}</p>
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
            onMouseOver={(e) => { e.target.style.backgroundColor = 'var(--danger)'; e.target.style.color = '#fff' }}
            onMouseOut={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = 'var(--danger)' }}
          >
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, marginLeft: '240px', padding: '1.25rem' }}>
        {children}
      </main>
    </div>
  )
}
