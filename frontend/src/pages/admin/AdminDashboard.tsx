import { Link } from 'react-router-dom'
import { Utensils, Users, TrendingUp, Settings, ArrowRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage all aspects of CampusBite</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Menu Management</CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="text-xs mt-2 text-muted-foreground">
              Add, edit, and organize categories and menu items. Upload food images.
            </CardDescription>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full text-xs h-8" asChild>
              <Link to="/admin/menu">
                Go to Menu <ArrowRight className="w-3 h-3 ml-2" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">User Management</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="text-xs mt-2 text-muted-foreground">
              View registered students and staff. Suspend accounts if necessary.
            </CardDescription>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full text-xs h-8" asChild>
              <Link to="/admin/users">
                Go to Users <ArrowRight className="w-3 h-3 ml-2" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Analytics</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="text-xs mt-2 text-muted-foreground">
              Track orders, revenue, popular items, and peak canteen hours.
            </CardDescription>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full text-xs h-8" asChild>
              <Link to="/admin/analytics">
                View Reports <ArrowRight className="w-3 h-3 ml-2" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Settings</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="text-xs mt-2 text-muted-foreground">
              Toggle canteen open/close status, set business hours, configure limits.
            </CardDescription>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full text-xs h-8" asChild>
              <Link to="/admin/settings">
                Open Settings <ArrowRight className="w-3 h-3 ml-2" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
