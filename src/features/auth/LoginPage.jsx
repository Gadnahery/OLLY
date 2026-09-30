import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // login | signup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [info, setInfo] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)
    try {
      if (mode === 'signup') {
        const data = await signUp(email, password, name)
        if (data.session) {
          navigate('/')
        } else {
          setInfo('Account created. Check your email to confirm, or sign in if confirmation is disabled.')
          setMode('login')
        }
      } else {
        await signIn(email, password)
        navigate('/')
      }
    } catch (err) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">OLLY</h1>
          <p className="text-sm text-[#707070] mt-2">Food-processing business system</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white border border-[#E8E8E5] rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-lg">{mode === 'login' ? 'Sign in' : 'Create account'}</h2>
          {mode === 'signup' && (
            <Input label="Your name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Owner name" required />
          )}
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" required />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
          {error && <p className="text-sm text-[#B4534A]">{error}</p>}
          {info && <p className="text-sm text-[#3F8065]">{info}</p>}
          <Button type="submit" className="w-full" size="lg" loading={loading}>
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </Button>
          <p className="text-center text-sm text-[#707070]">
            {mode === 'login' ? (
              <>No account?{' '}
                <button type="button" className="text-[#181818] font-medium underline" onClick={() => setMode('signup')}>
                  Sign up
                </button>
              </>
            ) : (
              <>Have an account?{' '}
                <button type="button" className="text-[#181818] font-medium underline" onClick={() => setMode('login')}>
                  Sign in
                </button>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  )
}
