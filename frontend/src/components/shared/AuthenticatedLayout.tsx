import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function AuthenticatedLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-white selection:text-black">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
        <Outlet />
      </main>
    </div>
  )
}
