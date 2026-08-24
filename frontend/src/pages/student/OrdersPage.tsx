import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowRight, PackageOpen } from 'lucide-react'
import api from '@/lib/api'
import type { Order } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatOrderStatus } from '@/lib/utils'

export default function OrdersPage() {
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data } = await api.get('/orders')
      return data
    }
  })

  if (isLoading) return <div className="p-8 text-center animate-pulse">Loading orders...</div>

  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="bg-muted p-6 rounded-full">
          <PackageOpen className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold">No orders yet</h2>
        <p className="text-muted-foreground max-w-sm text-center">
          You haven't placed any orders. Head over to the menu to order your first meal!
        </p>
        <Button asChild className="mt-4">
          <Link to="/">Browse Menu</Link>
        </Button>
      </div>
    )
  }

  // Separate active and past orders
  const activeOrders = orders.filter(o => o.status !== 'picked_up' && o.status !== 'cancelled')
  const pastOrders = orders.filter(o => o.status === 'picked_up' || o.status === 'cancelled')

  const OrderCard = ({ order }: { order: Order }) => {
    const isCancelled = order.status === 'cancelled'
    const isCompleted = order.status === 'picked_up'
    
    return (
      <Card className={`overflow-hidden transition-all hover:shadow-md ${isCancelled ? 'opacity-70 grayscale' : ''}`}>
        <CardHeader className="p-4 pb-2 border-b bg-muted/20">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-sm text-muted-foreground font-medium">
                Order #{order.id.split('-')[0].toUpperCase()}
              </CardTitle>
              <CardDescription className="text-xs">
                {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </CardDescription>
            </div>
            <Badge 
              variant={isCancelled ? 'destructive' : isCompleted ? 'secondary' : 'default'}
              className="capitalize"
            >
              {formatOrderStatus(order.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div className="space-y-1 text-sm text-muted-foreground">
              {order.items.slice(0, 2).map(item => (
                <div key={item.id} className="line-clamp-1">{item.quantity}× {item.name}</div>
              ))}
              {order.items.length > 2 && (
                <div className="text-xs italic">+ {order.items.length - 2} more items</div>
              )}
            </div>
            <div className="text-right flex flex-col items-end">
              <span className="font-bold text-lg text-foreground">{formatPrice(order.total)}</span>
              <Button variant="ghost" size="sm" asChild className="-mr-2 mt-2 group">
                <Link to={`/orders/${order.id}`}>
                  View Details <ArrowRight className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your Orders</h1>
        <p className="text-muted-foreground mt-1">Track active orders and view your history</p>
      </div>

      {activeOrders.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            Active Orders
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {activeOrders.map(order => <OrderCard key={order.id} order={order} />)}
          </div>
        </div>
      )}

      {pastOrders.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Past Orders</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {pastOrders.map(order => <OrderCard key={order.id} order={order} />)}
          </div>
        </div>
      )}
    </div>
  )
}
