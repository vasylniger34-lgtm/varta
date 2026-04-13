'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password.length < 6) {
      setError('KEY TOO SHORT — MINIMUM 6 CHARS')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'REGISTRATION FAILED')
      } else {
        router.push('/life')
        router.refresh()
      }
    } catch {
      setError('CONNECTION ERROR')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-name">
            V<span>A</span>RT<span>A</span>
          </div>
          <div className="auth-logo-sub">System Access // New Operator</div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div className="auth-error">
              ⚠ {error}
            </div>
          )}

          <div className="auth-form-group">
            <label className="input-label" htmlFor="name">
              // Operator Name
            </label>
            <input
              id="name"
              type="text"
              className="input-field"
              placeholder="Operator"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>

          <div className="auth-form-group">
            <label className="input-label" htmlFor="email">
              // Identifier
            </label>
            <input
              id="email"
              type="email"
              className="input-field"
              placeholder="operator@varta.sys"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-form-group">
            <label className="input-label" htmlFor="password">
              // Access Key
            </label>
            <input
              id="password"
              type="password"
              className="input-field"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? '[ REGISTERING... ]' : '[ REQUEST ACCESS ]'}
          </button>
        </form>

        <div className="auth-link">
          Already have credentials?{' '}
          <Link href="/auth/login">
            Enter System
          </Link>
        </div>
      </div>
    </div>
  )
}
