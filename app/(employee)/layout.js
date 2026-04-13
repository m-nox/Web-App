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
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-color)', color: 'var(--text-dark)', fontFamily: 'sans-serif' }}>
      
      {/* Sidebar */}
      <aside style={{ 
        width: '260px', 
        backgroundColor: 'var(--bg-card)', 
        borderRight: '1px solid var(--border-color)', 
        display: 'flex', 
        flexDirection: 'column', 
        position: 'fixed', 
        height: '100vh', 
        zIndex: 50 
      }}>
        
        {/* Brand */}
        <div style={{ padding: '2rem 1.5rem' }}>
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
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none',
                  fontWeight: isActive ? 'bold' : 'normal',
                  backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                  display: 'block'
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {profile.nama_depan[0]}{profile.nama_belakang?.[0] || ''}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 'bold' }}>{profile.nama_depan}</p>
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

      {/* Main Content */}
      <div style={{ flex: 1, marginLeft: '260px', display: 'flex', flexDirection: 'column' }}>
        <main style={{ padding: '2rem' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
