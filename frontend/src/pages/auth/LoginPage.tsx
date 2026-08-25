import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { ArrowRight, Utensils } from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { setTokens, setUser } = useAuthStore()
  const navigate = useNavigate()

  const login = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/auth/login', { email, password })
      return data
    },
    onSuccess: async (data) => {
      setTokens(data.access_token, data.refresh_token)
      const { data: user } = await api.get('/auth/me')
      setUser(user)
      if (user.role === 'student') navigate('/')
      else if (user.role === 'staff') navigate('/staff')
      else navigate('/admin')
    },
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-4 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-black to-black opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />

      <div className="w-full max-w-md relative z-10 p-8 sm:p-10 bg-white/[0.02] border border-white/[0.05] rounded-3xl backdrop-blur-2xl shadow-[0_0_80px_rgba(255,255,255,0.05)]">
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4 border border-white/20">
            <Utensils className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-medium tracking-tight">Sign in</h1>
          <p className="text-white/50 mt-2 text-center text-sm">
            Welcome back to CampusBite
          </p>
        </div>

        <div className="space-y-5">
          {login.isError && (
            <div className="text-sm font-medium text-red-400 bg-red-400/10 p-3 rounded-xl text-center border border-red-400/20">
              {/* @ts-ignore */}
              {login.error?.response?.data?.detail || "Invalid credentials. Please try again."}
            </div>
          )}
          
          <div className="space-y-2.5">
            <Label htmlFor="email" className="text-white/60 text-xs font-medium uppercase tracking-wider">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="name@college.edu" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              disabled={login.isPending}
              className="h-12 bg-black/50 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-1 focus-visible:ring-white/50 focus-visible:border-white/50 transition-all rounded-xl shadow-inner"
            />
          </div>
          
          <div className="space-y-2.5">
            <Label htmlFor="password" className="text-white/60 text-xs font-medium uppercase tracking-wider">Password</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••"
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              disabled={login.isPending}
              className="h-12 bg-black/50 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-1 focus-visible:ring-white/50 focus-visible:border-white/50 transition-all rounded-xl shadow-inner"
            />
          </div>

          <Button 
            className="w-full h-12 bg-white text-black hover:bg-neutral-200 font-medium transition-all rounded-xl mt-4 flex items-center justify-center gap-2 group" 
            onClick={() => login.mutate()} 
            disabled={login.isPending || !email || !password}
          >
            {login.isPending ? 'Signing in...' : 'Sign in'}
            {!login.isPending && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
          </Button>

          <div className="text-center pt-4">
            <span className="text-white/40 text-sm">Don't have an account? </span>
            <Link to="/register" className="text-white hover:text-white/80 font-medium text-sm transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
