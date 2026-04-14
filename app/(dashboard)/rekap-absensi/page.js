'use client'

import { useState, useEffect } from 'react'

export default function RecapPage() {
  const [recapData, setRecapData] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('month') // 'day' | 'month' | 'year'
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    month: (new Date().getMonth() + 1).toString(),
    year: new Date().getFullYear().toString()
  })

  useEffect(() => {
    fetchRecap()
  }, [filters, filterType])

  const fetchRecap = async () => {
    try {
      setLoading(true)
      let url = `/api/absensi/recap?`
      if (filterType === 'day') {
        url += `date=${filters.date}`
      } else if (filterType === 'month') {
        url += `month=${filters.month}&year=${filters.year}`
      } else {
        url += `year=${filters.year}`
      }

      const res = await fetch(url)
      const result = await res.json()
      if (res.ok) {
        setRecapData(result.data)
      }
    } catch (error) {
      console.error('Error fetching recap:', error)
    } finally {
      setLoading(false)
    }
  }

  const months = [
    { v: '1', n: 'Januari' }, { v: '2', n: 'Februari' }, { v: '3', n: 'Maret' },
    { v: '4', n: 'April' }, { v: '5', n: 'Mei' }, { v: '6', n: 'Juni' },
    { v: '7', n: 'Juli' }, { v: '8', n: 'Agustus' }, { v: '9', n: 'September' },
    { v: '10', n: 'Oktober' }, { v: '11', n: 'November' }, { v: '12', n: 'Desember' }
  ]

  const years = ['2024', '2025', '2026']

  return (
    <main>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontWeight: '800', color: 'var(--text-dark)' }}>Rekap Absensi Karyawan</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Laporan ringkasan kehadiran seluruh staf secara periodik.</p>
      </header>

      {/* Filters */}
      <div className="card glass" style={{ marginBottom: '1.25rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="mobile-full" style={{ flex: '1 1 150px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.25rem' }}>Tipe Laporan</label>
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="glass"
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none' }}
            >
              <option value="day">Harian</option>
              <option value="month">Bulanan</option>
              <option value="year">Tahunan</option>
            </select>
          </div>

          {filterType === 'day' && (
            <div className="mobile-full" style={{ flex: '1 1 150px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.25rem' }}>Pilih Tanggal</label>
              <input 
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({...filters, date: e.target.value})}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
              />
            </div>
          )}

          {filterType === 'month' && (
            <div className="mobile-full" style={{ flex: '1 1 150px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.25rem' }}>Pilih Bulan</label>
              <select 
                value={filters.month}
                onChange={(e) => setFilters({...filters, month: e.target.value})}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
              >
                {months.map(m => <option key={m.v} value={m.v}>{m.n}</option>)}
              </select>
            </div>
          )}

          {(filterType === 'month' || filterType === 'year') && (
            <div className="mobile-full" style={{ flex: '1 1 120px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.25rem' }}>Pilih Tahun</label>
              <select 
                value={filters.year}
                onChange={(e) => setFilters({...filters, year: e.target.value})}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}

          <button className="btn btn-primary mobile-full" onClick={fetchRecap} style={{ height: '38px', padding: '0 1rem' }}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Recap Table */}
      <div className="card glass" style={{ padding: 0 }}>
        <div className="responsive-table">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(30, 144, 255, 0.05)', textAlign: 'left' }}>
              <th style={{ padding: '1.25rem' }}>Nama Karyawan</th>
              <th style={{ padding: '1.25rem' }}>Hadir</th>
              <th style={{ padding: '1.25rem' }}>Terlambat</th>
              <th style={{ padding: '1.25rem' }}>Izin</th>
              <th style={{ padding: '1.25rem' }}>Sakit</th>
              <th style={{ padding: '1.25rem' }}>Alpa</th>
              <th style={{ padding: '1.25rem' }}>Total Log</th>
              <th style={{ padding: '1.25rem' }}>Persentase</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat data rekapitulasi...</td></tr>
            ) : recapData.length === 0 ? (
              <tr><td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada data pada periode ini.</td></tr>
            ) : (
              recapData.map((item) => {
                const percentage = item.stats.total > 0 
                  ? Math.round((item.stats.hadir / item.stats.total) * 100) 
                  : 0
                
                return (
                  <tr key={item.id} style={{ borderTop: '1px solid var(--border-color)', transition: 'var(--transition)' }}>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: '600' }}>{item.nama}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.email}</div>
                    </td>
                    <td style={{ padding: '1.25rem' }}><span className="badge" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>{item.stats.hadir}</span></td>
                    <td style={{ padding: '1.25rem' }}><span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>{item.stats.terlambat}</span></td>
                    <td style={{ padding: '1.25rem' }}><span className="badge" style={{ backgroundColor: 'var(--warning-light)', color: 'var(--warning)' }}>{item.stats.izin}</span></td>
                    <td style={{ padding: '1.25rem' }}><span className="badge" style={{ backgroundColor: 'rgba(156, 163, 175, 0.1)', color: '#6B7280' }}>{item.stats.sakit}</span></td>
                    <td style={{ padding: '1.25rem' }}><span className="badge" style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}>{item.stats.alpa}</span></td>
                    <td style={{ padding: '1.25rem', fontWeight: '500' }}>{item.stats.total}</td>
                    <td style={{ padding: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: percentage > 80 ? 'var(--success)' : 'var(--warning)' }} />
                        </div>
                        <span style={{ fontSize: '0.875rem', fontWeight: '700' }}>{percentage}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        </div>
      </div>
    </main>
  )
}
