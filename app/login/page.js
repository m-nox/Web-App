'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Tampilkan popup sukses
    setShowSuccess(true)

    try {
      // Cek role user melalui API (menggunakan service_role) untuk menghindari blokir RLS
      const res = await fetch('/api/profile')
      const data = await res.json()
      
      let userRole = 'karyawan'
      if (res.ok && data.profile) {
        userRole = data.profile.role
      } else if (email === 'admin@hris.com' || email === 'dewa.bagusalif@gmail.com') {
        userRole = 'admin'; // Failsafe untuk superadmin
      }

      const destination = (userRole === 'admin' || userRole === 'hr') ? '/' : '/dashboard-karyawan'

      // Tunggu 2 detik, lalu redirect ke dashboard sesuai role
      setTimeout(() => {
        router.push(destination)
        router.refresh()
      }, 2000)
    } catch (err) {
      console.error('Error fetching role on login:', err)
      setTimeout(() => {
        router.push('/')
        router.refresh()
      }, 2000)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--bg-color) 0%, var(--primary-light) 100%)',
      padding: '1rem',
      position: 'relative'
    }}>
      {/* Success Popup Toggle */}
      {showSuccess && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          animation: 'fadeIn 0.3s ease-out forwards'
        }}>
          <div className="card glass" style={{ textAlign: 'center', padding: 'var(--page-padding)', maxWidth: '90%', animation: 'slideDown 0.4s ease-out forwards' }}>
            <div style={{
              width: '50px', height: '50px', borderRadius: '50%', background: 'var(--success)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', margin: '0 auto 1.25rem'
            }}>
              ✓
            </div>
            <h2 style={{ marginBottom: '0.25rem', color: 'var(--text-dark)' }}>Login Berhasil!</h2>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Mempersiapkan dasboard HRIS Anda...</p>
          </div>

          <style dangerouslySetInnerHTML={{
            __html: `
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideDown { from { transform: translateY(-50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          `}} />
        </div>
      )}

      <div className="card glass mobile-full" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ color: 'var(--primary)', marginBottom: '0.25rem' }}>HRIS Web</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Sign in to manage your workspace</p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--danger)',
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                outline: 'none',
                background: 'rgba(255, 255, 255, 0.5)',
                transition: 'var(--transition)'
              }}
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                outline: 'none',
                background: 'rgba(255, 255, 255, 0.5)',
                transition: 'var(--transition)'
              }}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.875rem', marginTop: '0.5rem', opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

