'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'AUTH FAILED')
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
          <div className="auth-logo-sub">System Access // Authentication</div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div className="auth-error">
              ⚠ {error}
            </div>
          )}

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
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? '[ AUTHENTICATING... ]' : '[ ENTER SYSTEM ]'}
          </button>
        </form>

        <div className="auth-link">
          No credentials?{' '}
          <Link href="/auth/register">
            Request Access
          </Link>
        </div>
      </div>
    </div>
  )
}
