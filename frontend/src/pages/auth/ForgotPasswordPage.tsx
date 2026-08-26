import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { ArrowRight, Utensils, Mail } from 'lucide-react'
import api from '@/lib/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const navigate = useNavigate()

  const forgotPassword = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/auth/forgot-password', { email })
      return data
    },
    onSuccess: () => {
      toast.success("If that email is in our database, we will send a password reset link.")
      setIsSuccess(true)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Something went wrong. Please try again.")
    }
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-black to-black opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />

      <div className="w-full max-w-md relative z-10 p-8 sm:p-10 bg-white/[0.02] border border-white/[0.05] rounded-3xl backdrop-blur-2xl shadow-[0_0_80px_rgba(255,255,255,0.05)]">
        
        {isSuccess ? (
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-medium tracking-tight mb-2">Check your email</h2>
              <p className="text-white/60 text-sm">
                If <span className="text-white font-medium">{email}</span> is registered, you will receive a password reset link shortly.
              </p>
            </div>
            
            <div className="flex flex-col w-full gap-3 mt-4">
              <Button 
                className="w-full h-12 bg-white text-black hover:bg-neutral-200 font-medium transition-all rounded-xl"
                onClick={() => navigate('/login')}
              >
                Return to Sign in
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center mb-8">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4 border border-white/20">
                <Utensils className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-medium tracking-tight">Reset Password</h1>
              <p className="text-white/50 mt-2 text-center text-sm">
                Enter your email and we'll send you a link to reset your password.
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2.5">
                <Label htmlFor="email" className="text-white/60 text-xs font-medium uppercase tracking-wider">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@college.edu" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  disabled={forgotPassword.isPending}
                  className="h-12 bg-black/50 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-1 focus-visible:ring-white/50 focus-visible:border-white/50 transition-all rounded-xl shadow-inner"
                />
              </div>

              <Button 
                className="w-full h-12 bg-white text-black hover:bg-neutral-200 font-medium transition-all rounded-xl mt-4 flex items-center justify-center gap-2 group" 
                onClick={() => forgotPassword.mutate()} 
                disabled={forgotPassword.isPending || !email}
              >
                {forgotPassword.isPending ? 'Sending...' : 'Send Reset Link'}
                {!forgotPassword.isPending && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
              </Button>

              <div className="text-center pt-4">
                <Link to="/login" className="text-white/50 hover:text-white font-medium text-sm transition-colors flex items-center justify-center gap-1">
                  &larr; Back to Sign in
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
