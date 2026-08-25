import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const { setTokens, setUser } = useAuthStore()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  const verify = useMutation({
    mutationFn: async (verificationToken: string) => {
      const { data } = await api.post('/auth/verify-email', { token: verificationToken })
      return data
    },
    onSuccess: async (data) => {
      setTokens(data.access_token, data.refresh_token)
      const { data: user } = await api.get('/auth/me')
      setUser(user)
      setStatus('success')
    },
    onError: (error: any) => {
      setStatus('error')
      setErrorMessage(error.response?.data?.detail || 'Verification failed. The link may have expired.')
    }
  })

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setErrorMessage('No verification token provided.')
      return
    }
    verify.mutate(token)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-black to-black opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />

      <div className="w-full max-w-md relative z-10 p-8 sm:p-10 bg-white/[0.02] border border-white/[0.05] rounded-3xl backdrop-blur-2xl shadow-[0_0_80px_rgba(255,255,255,0.05)] text-center">
        
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-white/50 animate-spin mb-4" />
            <h1 className="text-2xl font-medium tracking-tight">Verifying Email...</h1>
            <p className="text-white/50 mt-2 text-sm">Please wait while we verify your account.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-2xl font-medium tracking-tight">Email Verified!</h1>
            <p className="text-white/50 mt-2 text-sm mb-6">Your account has been successfully activated.</p>
            <Button 
              className="w-full h-12 bg-white text-black hover:bg-neutral-200 font-medium transition-all rounded-xl"
              onClick={() => navigate('/')}
            >
              Continue to CampusBite
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-medium tracking-tight">Verification Failed</h1>
            <p className="text-red-400/80 mt-2 text-sm mb-6">{errorMessage}</p>
            <Button 
              className="w-full h-12 bg-white/10 text-white hover:bg-white/20 font-medium transition-all rounded-xl"
              onClick={() => navigate('/login')}
            >
              Back to Login
            </Button>
          </div>
        )}

      </div>
    </div>
  )
}
