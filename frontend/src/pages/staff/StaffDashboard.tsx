import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@supabase/supabase-js'
import { Clock, CheckCircle2, ChefHat, Package, ArrowRight } from 'lucide-react'
import api from '@/lib/api'
import type { Order, OrderStatus } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { formatOrderStatus } from '@/lib/utils'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  placed: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'picked_up',
  picked_up: null,
  cancelled: null
}

export default function StaffDashboard() {
  const queryClient = useQueryClient()

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ['staff-orders'],
    queryFn: async () => {
      const { data } = await api.get('/orders')
      return data
    }
  })

  // Supabase Realtime Subscription for new orders or updates
  useEffect(() => {
    if (!supabase) return

    const channel = supabase
      .channel('all-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          toast('New order received!', {
            description: `Order #${payload.new.id.split('-')[0].toUpperCase()} was placed.`,
            action: { label: 'Refresh', onClick: () => queryClient.invalidateQueries({ queryKey: ['staff-orders'] }) }
          })
        }
        // Always invalidate to get fresh data (items, etc.)
        queryClient.invalidateQueries({ queryKey: ['staff-orders'] })
      })
      .subscribe()
      
    return () => { supabase.removeChannel(channel) }
  }, [queryClient])

  const updateStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string, status: OrderStatus }) => {
      const { data } = await api.patch(`/orders/${orderId}/status`, { status })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-orders'] })
    }
  })

  if (isLoading) return <div className="p-8 text-center animate-pulse">Loading active orders...</div>

  const activeOrders = orders?.filter(o => o.status !== 'picked_up' && o.status !== 'cancelled') || []
  
  // Group orders by status
  const groupedOrders = {
    placed: activeOrders.filter(o => o.status === 'placed'),
    confirmed: activeOrders.filter(o => o.status === 'confirmed'),
    preparing: activeOrders.filter(o => o.status === 'preparing'),
    ready: activeOrders.filter(o => o.status === 'ready'),
  }

  const OrderColumn = ({ title, status, icon: Icon, orders: columnOrders }: { title: string, status: OrderStatus, icon: any, orders: Order[] }) => (
    <div className="flex flex-col h-full bg-muted/30 rounded-xl p-4 border border-border/50">
      <div className="flex items-center justify-between mb-4 pb-2 border-b">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Icon className="w-5 h-5" />
          {title}
        </h3>
        <Badge variant="secondary">{columnOrders.length}</Badge>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
        {columnOrders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">No orders</div>
        ) : (
          columnOrders.map(order => (
            <Card key={order.id} className="shadow-sm border-l-4 border-l-primary/60">
              <CardHeader className="p-3 pb-2 flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-sm font-mono text-muted-foreground">
                    #{order.id.split('-')[0].toUpperCase()}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg leading-none">{order.pickup_token}</div>
                  <div className="text-[10px] text-muted-foreground uppercase mt-1 tracking-wider">Token</div>
                </div>
              </CardHeader>
              <Separator className="my-1" />
              <CardContent className="p-3 pt-2">
                <ul className="text-sm space-y-1">
                  {order.items.map(item => (
                    <li key={item.id} className="flex items-start justify-between">
                      <span className="font-medium">{item.quantity}× {item.name}</span>
                      {item.special_instructions && (
                        <span className="text-[10px] italic text-muted-foreground max-w-[50%] text-right line-clamp-2">
                          Note: {item.special_instructions}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
              {NEXT_STATUS[status] && (
                <CardFooter className="p-3 pt-0">
                  <Button 
                    className="w-full text-xs h-8" 
                    variant={status === 'ready' ? 'default' : 'secondary'}
                    onClick={() => updateStatus.mutate({ orderId: order.id, status: NEXT_STATUS[status]! })}
                    disabled={updateStatus.isPending}
                  >
                    Move to {formatOrderStatus(NEXT_STATUS[status]!)}
                    <ArrowRight className="w-3 h-3 ml-2" />
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-6 h-[calc(100vh-6rem)] flex flex-col">
      <div className="flex justify-between items-end flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage live orders in real-time</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 flex-1 overflow-hidden min-h-0">
        <OrderColumn title="New Orders" status="placed" icon={Clock} orders={groupedOrders.placed} />
        <OrderColumn title="Confirmed" status="confirmed" icon={CheckCircle2} orders={groupedOrders.confirmed} />
        <OrderColumn title="Preparing" status="preparing" icon={ChefHat} orders={groupedOrders.preparing} />
        <OrderColumn title="Ready for Pickup" status="ready" icon={Package} orders={groupedOrders.ready} />
      </div>
    </div>
  )
}
