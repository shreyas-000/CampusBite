import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth'
import AuthenticatedLayout from '@/components/shared/AuthenticatedLayout'
import { Toaster } from '@/components/ui/sonner'

// Auth
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'

// Student
import MenuPage from '@/pages/student/MenuPage'
import CartPage from '@/pages/student/CartPage'
import OrdersPage from '@/pages/student/OrdersPage'
import OrderDetailPage from '@/pages/student/OrderDetailPage'
import FavouritesPage from '@/pages/student/FavouritesPage'

// Staff
import StaffDashboard from '@/pages/staff/StaffDashboard'

// Admin
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminMenu from '@/pages/admin/AdminMenu'
import AdminUsers from '@/pages/admin/AdminUsers'
import AdminAnalytics from '@/pages/admin/AdminAnalytics'
import AdminSettings from '@/pages/admin/AdminSettings'

const queryClient = new QueryClient()

function RoleGuard({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<AuthenticatedLayout />}>
            <Route path="/" element={<RoleGuard roles={["student"]}><MenuPage /></RoleGuard>} />
            <Route path="/cart" element={<RoleGuard roles={["student"]}><CartPage /></RoleGuard>} />
            <Route path="/orders" element={<RoleGuard roles={["student"]}><OrdersPage /></RoleGuard>} />
            <Route path="/orders/:id" element={<RoleGuard roles={["student"]}><OrderDetailPage /></RoleGuard>} />
            <Route path="/favourites" element={<RoleGuard roles={["student"]}><FavouritesPage /></RoleGuard>} />

            <Route path="/staff" element={<RoleGuard roles={["staff", "admin"]}><StaffDashboard /></RoleGuard>} />
            
            <Route path="/admin" element={<RoleGuard roles={["admin"]}><AdminDashboard /></RoleGuard>} />
            <Route path="/admin/menu" element={<RoleGuard roles={["admin"]}><AdminMenu /></RoleGuard>} />
            <Route path="/admin/users" element={<RoleGuard roles={["admin"]}><AdminUsers /></RoleGuard>} />
            <Route path="/admin/analytics" element={<RoleGuard roles={["admin"]}><AdminAnalytics /></RoleGuard>} />
            <Route path="/admin/settings" element={<RoleGuard roles={["admin"]}><AdminSettings /></RoleGuard>} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  )
}
