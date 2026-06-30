import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const INSTRUCTOR_PASSWORD = 'boots2bytes2026'

export default function InstructorLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  function handleLogin(e) {
    e.preventDefault()
    if (password === INSTRUCTOR_PASSWORD) {
      sessionStorage.setItem('b2b_instructor', 'true')
      navigate('/dashboard')
    } else {
      setError('Incorrect password. Try again.')
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#f0f2f5', padding: '1rem'
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '2.5rem 2rem',
        width: '100%', maxWidth: 380, border: '0.5px solid #e8e8e8'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', background: '#1a2f52',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <span style={{ fontSize: 22, color: '#f26522', fontWeight: 700 }}>B2</span>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: '#1a2f52' }}>Boots2Bytes</h1>
          <p style={{ fontSize: 14, color: '#888', marginTop: 4 }}>Instructor dashboard login</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="password"
            placeholder="Instructor password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            style={{
              padding: '0.75rem 1rem', borderRadius: 8, border: '0.5px solid #e8e8e8',
              fontSize: 14, outline: 'none', width: '100%'
            }}
          />
          {error && <p style={{ fontSize: 13, color: '#b91c1c' }}>{error}</p>}
          <button type="submit" style={{
            background: '#f26522', color: '#fff', border: 'none',
            borderRadius: 8, padding: '0.75rem', fontSize: 14, fontWeight: 500
          }}>
            Sign in
          </button>
        </form>

        <p style={{ fontSize: 12, color: '#aaa', textAlign: 'center', marginTop: '1.5rem' }}>
          Members access their journal via their personal link.
        </p>
      </div>
    </div>
  )
}
