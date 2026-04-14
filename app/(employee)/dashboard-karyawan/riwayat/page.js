'use client'

import { useState, useEffect } from 'react'

export default function EmployeeRiwayatPage() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/absensi/history')
      const data = await res.json()
      if (res.ok) setHistory(data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Filter history by selected month
  const filteredHistory = history.filter(h => {
    return h.tanggal.startsWith(filterMonth)
  })

  // Stats for selected month
  const totalHadir = filteredHistory.filter(h => h.status === 'Hadir').length
  const totalTerlambat = filteredHistory.filter(h => h.terlambat).length
  const totalOnTime = totalHadir - totalTerlambat

  // Generate month options from history
  const monthOptions = [...new Set(history.map(h => h.tanggal.substring(0, 7)))].sort().reverse()
  if (!monthOptions.includes(filterMonth)) {
    monthOptions.unshift(filterMonth)
  }

  const formatMonthLabel = (ym) => {
    const [y, m] = ym.split('-')
    const date = new Date(Number(y), Number(m) - 1)
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }}></div>
          <p style={{ color: 'var(--text-muted)' }}>Memuat riwayat...</p>
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
            Riwayat Presensi
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>Log kehadiran bulanan Anda.</p>
        </div>
        <select
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="mobile-full"
          style={{
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-dark)',
            fontWeight: '700',
            fontSize: '0.8rem',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          {monthOptions.map(m => (
            <option key={m} value={m}>{formatMonthLabel(m)}</option>
          ))}
        </select>
      </div>

      {/* Month Stats */}
      <div className="grid-stack" style={{ gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div className="card" style={{ borderLeft: '4px solid var(--success)', padding: '1rem', marginBottom: 0 }}>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '800', marginBottom: '0.25rem', textTransform: 'uppercase' }}>On Time</p>
          <p style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--success)', margin: 0 }}>{totalOnTime}</p>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--danger)', padding: '1rem', marginBottom: 0 }}>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '800', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Late</p>
          <p style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--danger)', margin: 0 }}>{totalTerlambat}</p>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--primary)', padding: '1rem', marginBottom: 0 }}>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '800', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Total</p>
          <p style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--primary)', margin: 0 }}>{totalHadir}</p>
        </div>
      </div>

      {/* History Table */}
      <div className="card glass" style={{ padding: 0 }}>
        <h3 style={{ padding: '1rem', margin: 0, fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
          Log {formatMonthLabel(filterMonth)} ({filteredHistory.length})
        </h3>
        <div className="responsive-table">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>No</th>
                <th style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Hari / Tanggal</th>
                <th style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Jam Masuk</th>
                <th style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Jam Keluar</th>
                <th style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                <th style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
                    Tidak ada data presensi untuk bulan ini.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((h, i) => (
                  <tr key={h.id} style={{
                    borderBottom: '1px solid var(--border-color)',
                    transition: 'var(--transition)',
                    backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)'
                  }}>
                    <td style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)', fontWeight: '500' }}>{i + 1}</td>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: '600' }}>
                      {new Date(h.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontFamily: 'monospace', fontWeight: '600' }}>
                      {h.jam_masuk?.substring(0, 5) || '--:--'}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontFamily: 'monospace', fontWeight: '600' }}>
                      {h.jam_keluar?.substring(0, 5) || '--:--'}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)',
                        fontSize: '0.75rem', fontWeight: '700',
                        backgroundColor: h.status === 'Hadir' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(0,0,0,0.05)',
                        color: h.status === 'Hadir' ? '#166534' : 'var(--text-muted)'
                      }}>
                        {h.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      {h.terlambat ? (
                        <span style={{ padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: '700', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#991b1b' }}>
                          Terlambat
                        </span>
                      ) : h.status === 'Hadir' ? (
                        <span style={{ padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: '700', backgroundColor: 'rgba(34, 197, 94, 0.08)', color: '#166534' }}>
                          Tepat Waktu
                        </span>
                      ) : '-'}
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
