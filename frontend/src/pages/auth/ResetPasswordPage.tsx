import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { ArrowRight, Utensils } from 'lucide-react'
import api from '@/lib/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (!token) {
      toast.error('Invalid or missing reset token.')
      navigate('/login')
    }
  }, [token, navigate])

  const resetPassword = useMutation({
    mutationFn: async () => {
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match")
      }
      const { data } = await api.post('/auth/reset-password', { token, new_password: password })
      return data
    },
    onSuccess: () => {
      toast.success("Password successfully reset! You can now log in.")
      navigate('/login')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || error.message || "Failed to reset password. The link might be expired.")
    }
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-black to-black opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />

      <div className="w-full max-w-md relative z-10 p-8 sm:p-10 bg-white/[0.02] border border-white/[0.05] rounded-3xl backdrop-blur-2xl shadow-[0_0_80px_rgba(255,255,255,0.05)]">
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4 border border-white/20">
            <Utensils className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-medium tracking-tight">New Password</h1>
          <p className="text-white/50 mt-2 text-center text-sm">
            Enter your new password below.
          </p>
        </div>

        <div className="space-y-5">
          <div className="space-y-2.5">
            <Label htmlFor="password" className="text-white/60 text-xs font-medium uppercase tracking-wider">New Password</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••"
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              disabled={resetPassword.isPending}
              className="h-12 bg-black/50 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-1 focus-visible:ring-white/50 focus-visible:border-white/50 transition-all rounded-xl shadow-inner"
            />
          </div>
          
          <div className="space-y-2.5">
            <Label htmlFor="confirmPassword" className="text-white/60 text-xs font-medium uppercase tracking-wider">Confirm Password</Label>
            <Input 
              id="confirmPassword" 
              type="password" 
              placeholder="••••••••"
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
              disabled={resetPassword.isPending}
              className="h-12 bg-black/50 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-1 focus-visible:ring-white/50 focus-visible:border-white/50 transition-all rounded-xl shadow-inner"
            />
          </div>

          <Button 
            className="w-full h-12 bg-white text-black hover:bg-neutral-200 font-medium transition-all rounded-xl mt-4 flex items-center justify-center gap-2 group" 
            onClick={() => resetPassword.mutate()} 
            disabled={resetPassword.isPending || !password || !confirmPassword}
          >
            {resetPassword.isPending ? 'Resetting...' : 'Reset Password'}
            {!resetPassword.isPending && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
          </Button>

          <div className="text-center pt-4">
            <Link to="/login" className="text-white/50 hover:text-white font-medium text-sm transition-colors flex items-center justify-center gap-1">
              &larr; Back to Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
