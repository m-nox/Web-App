'use client'

import { useState, useEffect } from 'react'

export default function AdminCutiPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null) // ID of request being updated
  const [catatan, setCatatan] = useState('')

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/cuti/admin')
      const data = await res.json()
      if (res.ok) setRequests(data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (id, status) => {
    setUpdating(id)
    try {
      const res = await fetch('/api/cuti/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, catatan_admin: catatan })
      })
      if (res.ok) {
        fetchRequests()
        setCatatan('')
      } else {
        const data = await res.json()
        alert(data.error || 'Gagal update status.')
      }
    } catch (err) {
      alert('Terjadi kesalahan server.')
    } finally {
      setUpdating(null)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Disetujui': return '#166534'
      case 'Ditolak': return '#991b1b'
      default: return '#854d0e'
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }}></div>
          <p style={{ color: 'var(--text-muted)' }}>Memuat data pengajuan...</p>
          <style dangerouslySetInnerHTML={{ __html: '@keyframes spin { to { transform: rotate(360deg); } }' }} />
        </div>
      </div>
    )
  }

  const pendingRequests = requests.filter(r => r.status === 'Pending')
  const historyRequests = requests.filter(r => r.status !== 'Pending')

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontWeight: '800', marginBottom: '0.15rem', color: 'var(--text-dark)' }}>
          Manajemen Cuti
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>Review dan kelola pengajuan izin/cuti karyawan.</p>
      </div>

      {/* Pending Section */}
      <div className="card glass" style={{ padding: '1.25rem', marginBottom: '1.5rem', borderTop: '4px solid var(--warning)' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          ⏳ Menunggu Persetujuan ({pendingRequests.length})
        </h3>
        {pendingRequests.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius-md)' }}>
            🎉 Tidak ada pengajuan tertunda.
          </p>
        ) : (
          <div className="grid-stack" style={{ gap: '1rem' }}>
            {pendingRequests.map((req) => (
              <div key={req.id} className="card" style={{ padding: '1rem', border: '1px solid var(--border-color)', backgroundColor: 'white', marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800' }}>{req.karyawan?.nama_depan} {req.karyawan?.nama_belakang}</h4>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>{req.karyawan?.email}</p>
                  </div>
                  <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', height: 'fit-content', borderRadius: '4px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', fontWeight: '800', textTransform: 'uppercase' }}>
                    {req.jenis_cuti}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>
                  <p style={{ margin: '0 0 0.25rem 0' }}>📅 <strong>{req.tanggal_mulai}</strong> s/d <strong>{req.tanggal_selesai}</strong></p>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontStyle: 'italic' }}>"{req.alasan || 'Tidak ada alasan'}"</p>
                </div>
                <div style={{ marginTop: '0.75rem' }}>
                  <textarea
                    placeholder="Catatan..."
                    value={updating === req.id ? catatan : ''}
                    onChange={(e) => setCatatan(e.target.value)}
                    style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.75rem', marginBottom: '0.5rem', outline: 'none' }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      disabled={updating === req.id}
                      onClick={() => { setCatatan(''); handleUpdate(req.id, 'Ditolak') }}
                      style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--danger)', color: 'var(--danger)', fontWeight: '800', fontSize: '0.8rem', backgroundColor: 'transparent', cursor: 'pointer' }}
                    >
                      {updating === req.id ? '...' : 'Tolak'}
                    </button>
                    <button
                      disabled={updating === req.id}
                      onClick={() => handleUpdate(req.id, 'Disetujui')}
                      style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-md)', border: 'none', backgroundColor: 'var(--success)', color: 'white', fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      {updating === req.id ? '...' : 'Setujui'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card glass" style={{ padding: 0 }}>
        <h3 style={{ padding: '1rem', margin: 0, fontSize: '0.85rem', fontWeight: '800' }}>Riwayat Keputusan</h3>
        <div className="responsive-table">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>Karyawan</th>
                <th style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>Jenis Cuti</th>
                <th style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>Periode</th>
                <th style={{ padding: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>Catatan Admin</th>
              </tr>
            </thead>
            <tbody>
              {historyRequests.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada riwayat keputusan.</td>
                </tr>
              ) : (
                historyRequests.map((req) => (
                  <tr key={req.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <p style={{ margin: 0, fontWeight: '600' }}>{req.karyawan?.nama_depan} {req.karyawan?.nama_belakang}</p>
                    </td>
                    <td style={{ padding: '0.75rem' }}>{req.jenis_cuti}</td>
                    <td style={{ padding: '0.75rem' }}>{req.tanggal_mulai} s/d {req.tanggal_selesai}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <span style={{
                        padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', fontSize: '0.7rem', fontWeight: '800',
                        backgroundColor: req.status === 'Disetujui' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: getStatusColor(req.status)
                      }}>
                        {req.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#6b7280' }}>
                      {req.catatan_admin || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
