'use client'

import { useState, useEffect } from 'react'

export default function EmployeeCutiPage() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    jenis_cuti: 'Cuti Tahunan',
    tanggal_mulai: '',
    tanggal_selesai: '',
    alasan: ''
  })

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/cuti')
      const data = await res.json()
      if (res.ok) setHistory(data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/cuti', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (res.ok) {
        setShowModal(false)
        setFormData({ jenis_cuti: 'Cuti Tahunan', tanggal_mulai: '', tanggal_selesai: '', alasan: '' })
        fetchHistory()
      } else {
        alert(data.error || 'Gagal mengajukan cuti.')
      }
    } catch (err) {
      alert('Terjadi kesalahan server.')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Disetujui': return { bg: 'rgba(34, 197, 94, 0.1)', color: '#166534' }
      case 'Ditolak': return { bg: 'rgba(239, 68, 68, 0.1)', color: '#991b1b' }
      default: return { bg: 'rgba(234, 179, 8, 0.1)', color: '#854d0e' }
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }}></div>
          <p style={{ color: 'var(--text-muted)' }}>Memuat data cuti...</p>
          <style dangerouslySetInnerHTML={{ __html: '@keyframes spin { to { transform: rotate(360deg); } }' }} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="mobile-full">
          <h1 style={{ fontWeight: '800', margin: 0, background: 'linear-gradient(45deg, var(--primary), #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '1.5rem' }}>
            Pengajuan Cuti
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>Kelola izin dan cuti kerja Anda.</p>
        </div>
        <button className="btn btn-primary mobile-full" onClick={() => setShowModal(true)} style={{ padding: '0.6rem 1rem', fontWeight: '800', fontSize: '0.8rem' }}>
          + Pengajuan Baru
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid-stack" style={{ gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div className="card glass" style={{ padding: '1rem', marginBottom: 0 }}>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Pending</p>
          <p style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--warning)', margin: 0 }}>
            {history.filter(h => h.status === 'Pending').length}
          </p>
        </div>
        <div className="card glass" style={{ padding: '1rem', marginBottom: 0 }}>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Approve</p>
          <p style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--success)', margin: 0 }}>
            {history.filter(h => h.status === 'Disetujui').length}
          </p>
        </div>
        <div className="card glass" style={{ padding: '1rem', marginBottom: 0 }}>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Total</p>
          <p style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--primary)', margin: 0 }}>
            {history.length}
          </p>
        </div>
      </div>

      {/* History Table */}
      <div className="card glass" style={{ padding: 0 }}>
        <h3 style={{ padding: '1rem', margin: 0, fontSize: '0.85rem', fontWeight: '800', borderBottom: '1px solid var(--border-color)' }}>Log Pengajuan</h3>
        <div className="responsive-table">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600' }}>Jenis Cuti</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600' }}>Mulai</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600' }}>Selesai</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600' }}>Alasan</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada pengajuan cuti.</td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem', fontWeight: '600' }}>{item.jenis_cuti}</td>
                    <td style={{ padding: '1rem' }}>{item.tanggal_mulai}</td>
                    <td style={{ padding: '1rem' }}>{item.tanggal_selesai}</td>
                    <td style={{ padding: '1rem', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.alasan || '-'}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)',
                        fontSize: '0.75rem', fontWeight: '700',
                        ...getStatusStyle(item.status)
                      }}>
                        {item.status}
                      </span>
                      {item.catatan_admin && (
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>📝 {item.catatan_admin}</p>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div className="card glass" style={{ width: '100%', maxWidth: '500px', padding: '2rem', animation: 'scaleUp 0.3s ease-out' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>Ajukan Cuti Baru</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Jenis Cuti</label>
                <select
                  value={formData.jenis_cuti}
                  onChange={(e) => setFormData({...formData, jenis_cuti: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none' }}
                >
                  <option>Cuti Tahunan</option>
                  <option>Sakit</option>
                  <option>Izin</option>
                  <option>Cuti Melahirkan</option>
                </select>
              </div>
              <div className="grid-stack" style={{ gap: '1rem' }}>
                <div className="mobile-full">
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '700' }}>Tgl. Mulai</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal_mulai}
                    onChange={(e) => setFormData({...formData, tanggal_mulai: e.target.value})}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.875rem' }}
                  />
                </div>
                <div className="mobile-full">
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '700' }}>Tgl. Selesai</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal_selesai}
                    onChange={(e) => setFormData({...formData, tanggal_selesai: e.target.value})}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.875rem' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Alasan</label>
                <textarea
                  rows="3"
                  value={formData.alasan}
                  onChange={(e) => setFormData({...formData, alasan: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', resize: 'none' }}
                  placeholder="Opsional"
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn" onClick={() => setShowModal(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.05)' }}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ flex: 1 }}>
                  {submitting ? 'Mengirim...' : 'Ajukan Sekarang'}
                </button>
              </div>
            </form>
          </div>
          <style dangerouslySetInnerHTML={{ __html: '@keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }' }} />
        </div>
      )}
    </div>
  )
}
