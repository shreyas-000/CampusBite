import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ShoppingCart, LogOut, Utensils } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { useCartStore } from '@/store/cart'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const cart = useCartStore((state) => state.cart)
  const itemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!user) return null

  return (
    <header className="sticky top-4 z-50 w-full px-4 sm:px-6 lg:px-8 mb-8">
      <div className="container flex h-14 items-center justify-between mx-auto px-6 bg-black/40 border border-white/10 rounded-full backdrop-blur-md shadow-2xl">
        <Link to={user.role === 'student' ? '/' : user.role === 'staff' ? '/staff' : '/admin'} className="flex items-center gap-2 mr-6">
          <Utensils className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl hidden sm:inline-block">CampusBite</span>
        </Link>
        
        <div className="flex flex-1 items-center justify-center space-x-6 text-sm font-medium">
          {user.role === 'student' && (
            <>
              <Link to="/" className={`transition-colors duration-200 hover:text-white ${location.pathname === '/' ? 'text-white drop-shadow-md' : 'text-white/50'}`}>Menu</Link>
              <Link to="/orders" className={`transition-colors duration-200 hover:text-white ${location.pathname.startsWith('/orders') ? 'text-white drop-shadow-md' : 'text-white/50'}`}>Orders</Link>
              <Link to="/favourites" className={`transition-colors duration-200 hover:text-white hidden sm:inline-block ${location.pathname === '/favourites' ? 'text-white drop-shadow-md' : 'text-white/50'}`}>Favourites</Link>
            </>
          )}
          {user.role === 'staff' && (
            <Link to="/staff" className={`transition-colors duration-200 hover:text-white ${location.pathname === '/staff' ? 'text-white drop-shadow-md' : 'text-white/50'}`}>Dashboard</Link>
          )}
          {user.role === 'admin' && (
            <>
              <Link to="/admin" className={`transition-colors duration-200 hover:text-white ${location.pathname === '/admin' ? 'text-white drop-shadow-md' : 'text-white/50'}`}>Dashboard</Link>
              <Link to="/admin/menu" className={`transition-colors duration-200 hover:text-white ${location.pathname === '/admin/menu' ? 'text-white drop-shadow-md' : 'text-white/50'}`}>Menu</Link>
              <Link to="/admin/users" className={`transition-colors duration-200 hover:text-white ${location.pathname === '/admin/users' ? 'text-white drop-shadow-md' : 'text-white/50'}`}>Users</Link>
              <Link to="/admin/analytics" className={`transition-colors duration-200 hover:text-white hidden sm:inline-block ${location.pathname === '/admin/analytics' ? 'text-white drop-shadow-md' : 'text-white/50'}`}>Analytics</Link>
              <Link to="/admin/settings" className={`transition-colors duration-200 hover:text-white hidden lg:inline-block ${location.pathname === '/admin/settings' ? 'text-white drop-shadow-md' : 'text-white/50'}`}>Settings</Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user.role === 'student' && (
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-white/10 hover:text-white transition-colors">
                <ShoppingCart className="h-4 w-4 text-white/70" />
                {itemCount > 0 && (
                  <Badge variant="default" className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center rounded-full p-0 text-[9px] bg-white text-black font-bold border-none">
                    {itemCount}
                  </Badge>
                )}
                <span className="sr-only">Cart</span>
              </Button>
            </Link>
          )}
          
          <div className="hidden md:flex items-center gap-2 mr-2">
            <span className="text-sm font-medium">{user.name}</span>
            <Badge variant="secondary" className="capitalize text-xs">{user.role}</Badge>
          </div>
          
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Log out" className="rounded-full hover:bg-white/10 hover:text-white transition-colors">
            <LogOut className="h-4 w-4 text-white/70" />
            <span className="sr-only">Log out</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
