import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { ArrowRight, Utensils } from 'lucide-react'
import api from '@/lib/api'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [studentId, setStudentId] = useState('')
  const [department, setDepartment] = useState('')
  

  const navigate = useNavigate()

  const register = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        email,
        password,
        student_id: studentId || undefined,
        department: department || undefined
      }
      const { data } = await api.post('/auth/register', payload)
      return data
    },
    onSuccess: async () => {
      alert("Registration successful! Please check your email to verify your account.");
      navigate('/login')
    },
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-4 relative overflow-hidden py-12">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-black to-black opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />

      <div className="w-full max-w-lg relative z-10 p-8 sm:p-10 bg-white/[0.02] border border-white/[0.05] rounded-3xl backdrop-blur-2xl shadow-[0_0_80px_rgba(255,255,255,0.05)]">
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4 border border-white/20">
            <Utensils className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-medium tracking-tight">Sign up</h1>
          <p className="text-white/50 mt-2 text-center text-sm">
            Create your CampusBite account
          </p>
        </div>

        <div className="space-y-5">
          {register.isError && (
            <div className="text-sm font-medium text-red-400 bg-red-400/10 p-3 rounded-xl text-center border border-red-400/20">
              {/* @ts-ignore */}
              {register.error?.response?.data?.detail || "Registration failed. Please try again."}
            </div>
          )}
          
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2.5 sm:col-span-2">
              <Label htmlFor="name" className="text-white/60 text-xs font-medium uppercase tracking-wider">Full Name *</Label>
              <Input 
                id="name" 
                placeholder="John Doe" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                disabled={register.isPending}
                className="h-12 bg-black/50 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-1 focus-visible:ring-white/50 focus-visible:border-white/50 transition-all rounded-xl shadow-inner"
              />
            </div>
            
            <div className="space-y-2.5 sm:col-span-2">
              <Label htmlFor="email" className="text-white/60 text-xs font-medium uppercase tracking-wider">College Email *</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@college.edu" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                disabled={register.isPending}
                className="h-12 bg-black/50 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-1 focus-visible:ring-white/50 focus-visible:border-white/50 transition-all rounded-xl shadow-inner"
              />
            </div>
            
            <div className="space-y-2.5">
              <Label htmlFor="studentId" className="text-white/60 text-xs font-medium uppercase tracking-wider">Student ID</Label>
              <Input 
                id="studentId" 
                placeholder="Optional" 
                value={studentId} 
                onChange={e => setStudentId(e.target.value)} 
                disabled={register.isPending}
                className="h-12 bg-black/50 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-1 focus-visible:ring-white/50 focus-visible:border-white/50 transition-all rounded-xl shadow-inner"
              />
            </div>
            
            <div className="space-y-2.5">
              <Label htmlFor="department" className="text-white/60 text-xs font-medium uppercase tracking-wider">Department</Label>
              <Input 
                id="department" 
                placeholder="Optional" 
                value={department} 
                onChange={e => setDepartment(e.target.value)} 
                disabled={register.isPending}
                className="h-12 bg-black/50 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-1 focus-visible:ring-white/50 focus-visible:border-white/50 transition-all rounded-xl shadow-inner"
              />
            </div>
            
            <div className="space-y-2.5 sm:col-span-2">
              <Label htmlFor="password" className="text-white/60 text-xs font-medium uppercase tracking-wider">Password *</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••"
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                disabled={register.isPending}
                className="h-12 bg-black/50 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-1 focus-visible:ring-white/50 focus-visible:border-white/50 transition-all rounded-xl shadow-inner"
              />
            </div>
          </div>

          <Button 
            className="w-full h-12 bg-white text-black hover:bg-neutral-200 font-medium transition-all rounded-xl mt-4 flex items-center justify-center gap-2 group" 
            onClick={() => register.mutate()} 
            disabled={register.isPending || !email || !password || !name}
          >
            {register.isPending ? 'Creating account...' : 'Sign up'}
            {!register.isPending && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
          </Button>

          <div className="text-center pt-4">
            <span className="text-white/40 text-sm">Already have an account? </span>
            <Link to="/login" className="text-white hover:text-white/80 font-medium text-sm transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
