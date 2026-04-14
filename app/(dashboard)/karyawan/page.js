'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function KaryawanPage() {
  const [karyawanData, setKaryawanData] = useState([])
  const [jabatanList, setJabatanList] = useState([])
  const [departemenList, setDepartemenList] = useState([])
  const [loading, setLoading] = useState(true)

  // Modal States
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('add') // 'add', 'edit', 'delete'
  const [selectedKaryawan, setSelectedKaryawan] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [visiblePasswords, setVisiblePasswords] = useState({})

  // Form State
  const [formData, setFormData] = useState({
    nama_depan: '',
    nama_belakang: '',
    email: '',
    no_telepon: '',
    alamat: '',
    jabatan_id: '',
    departemen_id: '',
    role: 'karyawan',
    password: '',
    nama_bank: '',
    nomor_rekening: ''
  })
  const [processLoading, setProcessLoading] = useState(false)
  
  // Feedback Popup State
  const [popupMessage, setPopupMessage] = useState(null)
  const [popupType, setPopupType] = useState('success') // 'success' | 'error'

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setLoading(true)
    await Promise.all([
      fetchKaryawan(),
      fetchJabatan(),
      fetchDepartemen()
    ])
    setLoading(false)
  }

  const fetchKaryawan = async () => {
    try {
      const res = await fetch('/api/karyawan')
      const result = await res.json()
      if (res.ok) setKaryawanData(result.data || [])
    } catch (error) {
      console.error('Error fetching karyawan:', error)
    }
  }

  const fetchJabatan = async () => {
    try {
      const res = await fetch('/api/jabatan')
      const result = await res.json()
      if (res.ok) setJabatanList(result.data || [])
    } catch (error) {
      console.error('Error fetching jabatan:', error)
    }
  }

  const fetchDepartemen = async () => {
    try {
      const res = await fetch('/api/departemen')
      const result = await res.json()
      if (res.ok) setDepartemenList(result.data || [])
    } catch (error) {
      console.error('Error fetching departemen:', error)
    }
  }

  const handleOpenModal = (mode, karyawan = null) => {
    setModalMode(mode)
    setSelectedKaryawan(karyawan)
    if (mode === 'edit' && karyawan) {
      setFormData({
        nama_depan: karyawan.nama_depan || '',
        nama_belakang: karyawan.nama_belakang || '',
        email: karyawan.email || '',
        no_telepon: karyawan.no_telepon || '',
        alamat: karyawan.alamat || '',
        jabatan_id: karyawan.jabatan_id || '',
        departemen_id: karyawan.departemen_id || '',
        role: karyawan.role || 'karyawan',
        password: karyawan.password || 'Hris123!',
        nama_bank: karyawan.nama_bank || '',
        nomor_rekening: karyawan.nomor_rekening || ''
      })
    } else {
      setFormData({ 
        nama_depan: '', 
        nama_belakang: '', 
        email: '', 
        no_telepon: '', 
        alamat: '',
        jabatan_id: '',
        departemen_id: '',
        role: 'karyawan',
        nama_bank: '',
        nomor_rekening: ''
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedKaryawan(null)
    setFormData({ 
      nama_depan: '', 
      nama_belakang: '', 
      email: '', 
      no_telepon: '', 
      alamat: '',
      jabatan_id: '',
      departemen_id: '',
      role: 'karyawan',
      password: '',
      nama_bank: '',
      nomor_rekening: ''
    })
  }

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === karyawanData.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(karyawanData.map(k => k.id))
    }
  }

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return
    const firstSelected = karyawanData.find(k => k.id === selectedIds[0])
    setSelectedKaryawan(firstSelected) // Fallback for modal display if needed
    setModalMode('delete')
    setShowModal(true)
  }

  const showPopup = (msg, type = 'success') => {
    setPopupMessage(msg)
    setPopupType(type)
    setTimeout(() => {
      setPopupMessage(null)
    }, 3000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setProcessLoading(true)

    try {
      let url = '/api/karyawan'
      let method = 'POST'

      if (modalMode === 'edit') {
        url = `/api/karyawan/${selectedKaryawan.id}`
        method = 'PUT'
      }

      // Prepare payload - convert empty selects to null for DB consistency
      const payload = { ...formData }
      if (!payload.jabatan_id) payload.jabatan_id = null
      if (!payload.departemen_id) payload.departemen_id = null

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        handleCloseModal()
        fetchKaryawan()
        showPopup(modalMode === 'edit' ? 'Perubahan berhasil disimpan!' : 'Karyawan berhasil ditambahkan!')
      } else {
        const err = await res.json()
        showPopup('Gagal: ' + (err.error || 'Terjadi kesalahan sistem'), 'error')
      }
    } catch (error) {
      console.error(error)
      showPopup('Gagal terhubung ke server', 'error')
    } finally {
      setProcessLoading(false)
    }
  }

  const handleDelete = async () => {
    setProcessLoading(true)
    try {
      const res = await fetch('/api/karyawan', { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      })
      if (res.ok) {
        handleCloseModal()
        setSelectedIds([])
        fetchKaryawan()
        showPopup(`${selectedIds.length} Karyawan berhasil dihapus`)
      } else {
        const err = await res.json()
        alert('Gagal: ' + err.error)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setProcessLoading(false)
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Global Feedback Popup */}
      {popupMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          background: popupType === 'success' ? 'rgba(34, 197, 94, 0.95)' : 'rgba(239, 68, 68, 0.95)',
          color: 'white',
          padding: '1rem 1.5rem',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          backdropFilter: 'blur(8px)',
          animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}>
          <div style={{ fontSize: '1.25rem' }}>
            {popupType === 'success' ? '✓' : '⚠'}
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700' }}>
              {popupType === 'success' ? 'Berhasil' : 'Peringatan'}
            </h4>
            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.9 }}>{popupMessage}</p>
          </div>
          <style dangerouslySetInnerHTML={{
            __html: `
            @keyframes slideInRight { 
              from { transform: translateX(100%); opacity: 0; } 
              to { transform: translateX(0); opacity: 1; } 
            }
          `}} />
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontWeight: '700', marginBottom: '0.15rem' }}>Manajemen Karyawan</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Kelola profil, jabatan, dan struktur departemen.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }} className="mobile-full">
          <button onClick={() => handleOpenModal('add')} className="btn btn-primary mobile-full">
            + Tambah Karyawan
          </button>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          alignItems: 'center', 
          gap: '0.5rem', 
          marginBottom: '0.75rem',
          flexWrap: 'wrap',
          animation: 'fadeInUp 0.3s ease-out'
        }} className="mobile-full">
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginRight: '0.5rem' }}>{selectedIds.length} terpilih</span>
          {selectedIds.length === 1 && (
            <button 
              onClick={() => {
                const k = karyawanData.find(item => item.id === selectedIds[0])
                handleOpenModal('edit', k)
              }} 
              className="btn mobile-full" 
              style={{ backgroundColor: 'var(--secondary)', padding: '0.4rem 1rem' }}
            >
              Edit
            </button>
          )}
          <button 
            onClick={handleDeleteSelected} 
            className="btn mobile-full" 
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '0.4rem 1rem' }}
          >
            Hapus ({selectedIds.length})
          </button>
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes fadeInUp {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}} />
        </div>
      )}

      <div className="card glass">
        <div className="responsive-table">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '0.875rem 1rem', width: '40px' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length === karyawanData.length && karyawanData.length > 0} 
                    onChange={toggleSelectAll}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                </th>
                <th style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>Nama Karyawan</th>
                <th style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>Departemen</th>
                <th style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>Jabatan</th>
                <th style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>Informasi Kontak</th>
                <th style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>Password</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Memproses data...</td></tr>
              ) : karyawanData.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada data karyawan terdaftar.</td></tr>
              ) : (
                karyawanData.map((k) => (
                  <tr key={k.id} style={{ 
                    borderBottom: '1px solid var(--border-color)', 
                    transition: 'var(--transition)',
                    backgroundColor: selectedIds.includes(k.id) ? 'rgba(0, 174, 239, 0.05)' : 'transparent' 
                  }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(k.id)} 
                        onChange={() => toggleSelect(k.id)}
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      />
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <p style={{ fontWeight: '600', color: 'var(--text-dark)', margin: 0, fontSize: '0.875rem' }}>{k.nama_depan} {k.nama_belakang}</p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>ID: {k.id.substring(0, 8)}</p>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', fontSize: '0.7rem', fontWeight: '700' }}>
                        {k.departemen?.nama_departemen || 'N/A'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <p style={{ margin: 0, fontSize: '0.8125rem' }}>{k.jabatan?.nama_jabatan || '-'}</p>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-dark)' }}>{k.email}</p>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>{k.no_telepon || '-'}</p>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <p style={{ margin: 0, fontSize: '0.8125rem' }}>
                          {visiblePasswords[k.id] ? k.password || 'Hris123!' : '••••••••'}
                        </p>
                        <button 
                          onClick={() => togglePasswordVisibility(k.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '0.2rem', display: 'flex', alignItems: 'center' }}
                        >
                          {visiblePasswords[k.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL SYSTEM */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div className="card glass" style={{ width: '100%', maxWidth: '540px', padding: '1.5rem', maxHeight: '95vh', overflowY: 'auto', borderRadius: '1rem' }}>
            {modalMode === 'delete' ? (
              <>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--danger)', fontWeight: '700' }}>Konfirmasi Penghapusan Massal</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', lineHeight: '1.6' }}>
                  Apakah Anda yakin ingin menghapus <strong>{selectedIds.length} karyawan</strong> yang dipilih secara permanen? Tindakan ini tidak dapat dibatalkan.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={handleCloseModal} className="btn" style={{ backgroundColor: 'var(--secondary)', minWidth: '100px' }}>Batal</button>
                  <button onClick={handleDelete} className="btn btn-primary" style={{ backgroundColor: 'var(--danger)', minWidth: '100px' }} disabled={processLoading}>
                    {processLoading ? 'Proses...' : 'Hapus Sekarang'}
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleSubmit}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', fontWeight: '700', color: 'var(--primary)' }}>
                  {modalMode === 'add' ? 'Tambah Karyawan Baru' : 'Perbarui Data Karyawan'}
                </h2>
                
                <div className="grid-stack" style={{ marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Nama Depan *</label>
                    <input type="text" required value={formData.nama_depan} onChange={(e) => setFormData({...formData, nama_depan: e.target.value})} placeholder="John" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', background: 'white' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Nama Belakang</label>
                    <input type="text" value={formData.nama_belakang} onChange={(e) => setFormData({...formData, nama_belakang: e.target.value})} placeholder="Doe" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', background: 'white' }} />
                  </div>
                </div>

                <div className="grid-stack" style={{ marginBottom: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Email Perusahaan *</label>
                    <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="john.doe@company.com" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', background: 'white' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>No. Telepon</label>
                    <input type="text" value={formData.no_telepon} onChange={(e) => setFormData({...formData, no_telepon: e.target.value})} placeholder="+62..." style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', background: 'white' }} />
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginBottom: '1.25rem' }}>
                  <p style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-dark)' }}>Informasi Perbankan (Payroll)</p>
                  <div className="grid-stack">
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Nama Bank</label>
                      <input 
                        type="text" 
                        value={formData.nama_bank} 
                        onChange={(e) => setFormData({...formData, nama_bank: e.target.value})} 
                        placeholder="Contoh: BCA, Mandiri, BNI" 
                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', background: 'white' }} 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Nomor Rekening</label>
                      <input 
                        type="text" 
                        value={formData.nomor_rekening} 
                        onChange={(e) => setFormData({...formData, nomor_rekening: e.target.value})} 
                        placeholder="000123456789" 
                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', background: 'white' }} 
                      />
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginBottom: '1.25rem' }}>
                  <p style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-dark)' }}>Detail Pekerjaan</p>
                  <div className="grid-stack">
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Departemen</label>
                      <select 
                        value={formData.departemen_id} 
                        onChange={(e) => {
                          setFormData({ ...formData, departemen_id: e.target.value, jabatan_id: '' })
                        }} 
                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', background: 'white', appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
                      >
                        <option value="">Pilih Departemen</option>
                        {departemenList.map(d => <option key={d.id} value={d.id}>{d.nama_departemen}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Jabatan</label>
                      <select 
                        value={formData.jabatan_id} 
                        onChange={(e) => setFormData({...formData, jabatan_id: e.target.value})} 
                        disabled={!formData.departemen_id}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', background: formData.departemen_id ? 'white' : 'var(--secondary)', appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
                      >
                        <option value="">{formData.departemen_id ? 'Pilih Jabatan' : 'Pilih Departemen Dahulu'}</option>
                        {jabatanList
                          .filter(j => j.departemen_id === formData.departemen_id)
                          .map(j => <option key={j.id} value={j.id}>{j.nama_jabatan} ({j.level})</option>)
                        }
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid-stack" style={{ marginBottom: '2.5rem' }}>
                  <div style={{ gridColumn: 'span 1' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Alamat Domisili</label>
                    <textarea rows="3" value={formData.alamat} onChange={(e) => setFormData({...formData, alamat: e.target.value})} placeholder="Jl. Raya Utama No. 123..." style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', resize: 'vertical', background: 'white' }}></textarea>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Role Akses</label>
                      <select 
                        value={formData.role} 
                        onChange={(e) => setFormData({...formData, role: e.target.value})} 
                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', background: 'white' }}
                      >
                        <option value="karyawan">Karyawan (Hanya Absen)</option>
                        <option value="admin">Administrator (Akses Penuh)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Password Akun *</label>
                      <div style={{ position: 'relative' }}>
                        <input 
                          type={visiblePasswords['form'] ? 'text' : 'password'} 
                          required 
                          value={formData.password} 
                          onChange={(e) => setFormData({...formData, password: e.target.value})} 
                          placeholder={modalMode === 'add' ? 'Hris123!' : 'Ganti password'} 
                          style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', background: 'white' }} 
                        />
                        <button 
                          type="button"
                          onClick={() => togglePasswordVisibility('form')}
                          style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                        >
                          {visiblePasswords['form'] ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={handleCloseModal} className="btn" style={{ backgroundColor: 'var(--secondary)', minWidth: '100px' }}>Batal</button>
                  <button type="submit" className="btn btn-primary" style={{ minWidth: '150px' }} disabled={processLoading}>
                    {processLoading ? 'Menyimpan...' : (modalMode === 'add' ? 'Daftarkan Karyawan' : 'Simpan Perubahan')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}


