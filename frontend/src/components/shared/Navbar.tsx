import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ShoppingCart, LogOut, Utensils } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { useCartStore } from '@/store/cart'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const { itemCount } = useCartStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!user) return null

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center mx-auto px-4">
        <Link to={user.role === 'student' ? '/' : user.role === 'staff' ? '/staff' : '/admin'} className="flex items-center gap-2 mr-6">
          <Utensils className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl hidden sm:inline-block">CampusBite</span>
        </Link>
        
        <div className="flex flex-1 items-center space-x-4 text-sm font-medium">
          {user.role === 'student' && (
            <>
              <Link to="/" className={`transition-colors hover:text-foreground/80 ${location.pathname === '/' ? 'text-foreground' : 'text-foreground/60'}`}>Menu</Link>
              <Link to="/orders" className={`transition-colors hover:text-foreground/80 ${location.pathname.startsWith('/orders') ? 'text-foreground' : 'text-foreground/60'}`}>Orders</Link>
              <Link to="/favourites" className={`transition-colors hover:text-foreground/80 hidden sm:inline-block ${location.pathname === '/favourites' ? 'text-foreground' : 'text-foreground/60'}`}>Favourites</Link>
            </>
          )}
          {user.role === 'staff' && (
            <Link to="/staff" className={`transition-colors hover:text-foreground/80 ${location.pathname === '/staff' ? 'text-foreground' : 'text-foreground/60'}`}>Dashboard</Link>
          )}
          {user.role === 'admin' && (
            <>
              <Link to="/admin" className={`transition-colors hover:text-foreground/80 ${location.pathname === '/admin' ? 'text-foreground' : 'text-foreground/60'}`}>Dashboard</Link>
              <Link to="/admin/menu" className={`transition-colors hover:text-foreground/80 ${location.pathname === '/admin/menu' ? 'text-foreground' : 'text-foreground/60'}`}>Menu</Link>
              <Link to="/admin/users" className={`transition-colors hover:text-foreground/80 ${location.pathname === '/admin/users' ? 'text-foreground' : 'text-foreground/60'}`}>Users</Link>
              <Link to="/admin/analytics" className={`transition-colors hover:text-foreground/80 hidden sm:inline-block ${location.pathname === '/admin/analytics' ? 'text-foreground' : 'text-foreground/60'}`}>Analytics</Link>
              <Link to="/admin/settings" className={`transition-colors hover:text-foreground/80 hidden lg:inline-block ${location.pathname === '/admin/settings' ? 'text-foreground' : 'text-foreground/60'}`}>Settings</Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user.role === 'student' && (
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {itemCount() > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full p-0 text-[10px]">
                    {itemCount()}
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
          
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Log out">
            <LogOut className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
            <span className="sr-only">Log out</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
