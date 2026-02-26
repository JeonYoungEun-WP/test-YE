import { useState } from 'react'

const SITE_PASSWORD = import.meta.env.VITE_SITE_PASSWORD

export default function PasswordGate({ children }) {
  const [authenticated, setAuthenticated] = useState(
    () => sessionStorage.getItem('authenticated') === 'true'
  )
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input === SITE_PASSWORD) {
      sessionStorage.setItem('authenticated', 'true')
      setAuthenticated(true)
      setError(false)
    } else {
      setError(true)
    }
  }

  if (authenticated) return children

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-bold text-center">비밀번호를 입력하세요</h1>
        <input
          type="password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="비밀번호"
          autoFocus
          className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
        {error && (
          <p className="text-sm text-destructive">비밀번호가 올바르지 않습니다.</p>
        )}
        <button
          type="submit"
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white hover:opacity-90"
        >
          접속
        </button>
      </form>
    </div>
  )
}
