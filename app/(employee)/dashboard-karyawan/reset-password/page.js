'use client';

import { createClient } from '@/utils/supabase/client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Lock, ShieldCheck, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Feedback States
  const [message, setMessage] = useState(null);
  const [type, setType] = useState('success');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showFeedback('Password tidak cocok!', 'error');
      return;
    }
    if (password.length < 6) {
      showFeedback('Password minimal 6 karakter!', 'error');
      return;
    }

    setLoading(true);
    try {
      // 1. Update Password in Supabase Auth
      const { data: userData, error: authError } = await supabase.auth.updateUser({
        password: password
      });

      if (authError) throw authError;

      // 2. Sync to Karyawan Table
      const user = userData.user;
      if (user) {
        const { error: dbError } = await supabase
          .from('karyawan')
          .update({ password: password })
          .eq('id', user.id);
        
        if (dbError) console.error('Gagal sync ke database:', dbError.message);
      }

      showFeedback('Password berhasil diperbarui! Mengalihkan...', 'success');
      
      setTimeout(async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
      }, 3000);

    } catch (error) {
      console.error(error);
      showFeedback(error.message || 'Terjadi kesalahan sistem', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (msg, t = 'success') => {
    setMessage(msg);
    setType(t);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', padding: '1rem' }}>
      {/* SUCCESS POPUP */}
      {message && (
        <div style={{ 
          position: 'fixed', top: '2.5rem', right: '2.5rem', zIndex: 100, 
          padding: '1rem', borderRadius: '1rem', boxShadow: 'var(--shadow-lg)',
          backgroundColor: type === 'success' ? 'var(--success)' : 'var(--danger)',
          color: 'white', display: 'flex', alignItems: 'center', gap: '1rem',
          animation: 'slideIn 0.5s ease-out'
        }}>
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', padding: '0.5rem', borderRadius: '0.75rem' }}>
             {type === 'success' ? <ShieldCheck /> : <AlertCircle />}
          </div>
          <div>
            <p style={{ fontWeight: '700', fontSize: '0.875rem', margin: 0 }}>{type === 'success' ? 'Berhasil!' : 'Gagal'}</p>
            <p style={{ fontSize: '0.75rem', opacity: 0.9, margin: 0 }}>{message}</p>
          </div>
          <style dangerouslySetInnerHTML={{ __html: '@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }' }} />
        </div>
      )}

      <div className="card" style={{ width: '100%', maxWidth: '32rem', padding: '2.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, padding: '2.5rem', opacity: 0.05, pointerEvents: 'none' }}>
          <Lock style={{ height: '10rem', width: '10rem' }} />
        </div>

        <div style={{ position: 'relative', zIndex: 10, marginBottom: '2.5rem', textAlign: 'center' }}>
          <div style={{ 
            width: '4rem', height: '4rem', backgroundColor: 'var(--primary-light)', 
            borderRadius: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', 
            margin: '0 auto 1.5rem auto' 
          }}>
            <Lock style={{ height: '2rem', width: '2rem', color: 'var(--primary)' }} />
          </div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '900', color: 'var(--text-dark)', tracking: '-0.02em', margin: 0 }}>Atur Password Baru</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', margin: 0 }}>Pastikan password Anda aman dan tidak mudah ditebak.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-dark)', marginLeft: '0.25rem' }}>Password Baru</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ 
                  width: '100%', padding: '1rem 1.25rem', backgroundColor: 'var(--bg-color)', 
                  border: '1px solid var(--border-color)', borderRadius: '1rem', 
                  fontSize: '1rem', outline: 'none', paddingRight: '3rem'
                }}
                placeholder="••••••••"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ 
                  position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', 
                  background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' 
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-dark)', marginLeft: '0.25rem' }}>Konfirmasi Password</label>
            <input 
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ 
                width: '100%', padding: '1rem 1.25rem', backgroundColor: 'var(--bg-color)', 
                border: '1px solid var(--border-color)', borderRadius: '1rem', 
                fontSize: '1rem', outline: 'none'
              }}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '1rem', borderRadius: '1rem', fontSize: '1rem', gap: '0.75rem' }}
          >
            {loading && <Loader2 style={{ animation: 'spin 1s linear infinite', height: '1.25rem', width: '1.25rem' }} />}
            {loading ? 'Memproses...' : 'Simpan Password Baru'}
            <style dangerouslySetInnerHTML={{ __html: '@keyframes spin { to { transform: rotate(360deg); } }' }} />
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            <ShieldCheck style={{ display: 'inline-block', height: '0.75rem', width: '0.75rem', marginRight: '0.25rem' }} /> 
            Keamanan akun Anda adalah prioritas kami.
          </p>
        </form>
      </div>
    </div>
  );
}
