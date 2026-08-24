import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [studentId, setStudentId] = useState('')
  const [department, setDepartment] = useState('')
  
  const { setTokens, setUser } = useAuthStore()
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
    onSuccess: async (data) => {
      setTokens(data.access_token, data.refresh_token)
      const { data: user } = await api.get('/auth/me')
      setUser(user)
      navigate('/')
    },
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Create an Account</CardTitle>
          <CardDescription>
            Enter your details below to create your CampusBite account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {register.isError && (
            <div className="text-sm font-medium text-destructive text-center">
              Registration failed. Email or Student ID may already be in use.
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input 
                id="name" 
                placeholder="John Doe" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                disabled={register.isPending}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email">College Email *</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="j.doe@college.edu" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                disabled={register.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentId">Student ID</Label>
              <Input 
                id="studentId" 
                placeholder="Optional" 
                value={studentId} 
                onChange={e => setStudentId(e.target.value)} 
                disabled={register.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input 
                id="department" 
                placeholder="Optional" 
                value={department} 
                onChange={e => setDepartment(e.target.value)} 
                disabled={register.isPending}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="password">Password *</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                disabled={register.isPending}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            className="w-full" 
            onClick={() => register.mutate()} 
            disabled={register.isPending || !email || !password || !name}
          >
            {register.isPending ? 'Creating account...' : 'Create Account'}
          </Button>
          <div className="text-sm text-center text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
