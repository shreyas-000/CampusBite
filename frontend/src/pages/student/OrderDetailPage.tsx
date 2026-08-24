import { useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@supabase/supabase-js'
import { ArrowLeft, Clock, CheckCircle2, ChefHat, Package, Check, Coffee } from 'lucide-react'
import api from '@/lib/api'
import type { Order, OrderStatus } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { formatPrice, formatOrderStatus } from '@/lib/utils'
import { toast } from 'sonner'

// Note: For production, these should come from your env, but for this step we will load them dynamically 
// if they exist, or fail gracefully. You must configure these in Vercel.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

const STATUS_STEPS: OrderStatus[] = ['placed', 'confirmed', 'preparing', 'ready', 'picked_up']

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data } = await api.get(`/orders/${id}`)
      return data
    }
  })

  // Supabase Realtime Subscription
  useEffect(() => {
    if (!supabase || !id) return

    const channel = supabase
      .channel(`order-${id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${id}`,
      }, (payload) => {
        const newStatus = payload.new.status as OrderStatus
        queryClient.setQueryData(['order', id], (old: Order | undefined) => {
          if (!old) return old
          return { ...old, status: newStatus }
        })
        
        if (newStatus === 'ready') {
          toast.success('Your order is ready for pickup!', { duration: 10000 })
        }
      })
      .subscribe()
      
    return () => { supabase.removeChannel(channel) }
  }, [id, queryClient])

  const currentStepIndex = useMemo(() => {
    if (!order) return -1
    return STATUS_STEPS.indexOf(order.status)
  }, [order?.status])

  if (isLoading) return <div className="p-8 text-center animate-pulse">Loading order details...</div>
  if (!order) return <div className="p-8 text-center text-destructive">Order not found.</div>

  const isCancelled = order.status === 'cancelled'

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link to="/orders"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Order Details</h1>
          <p className="text-muted-foreground text-sm">Placed on {new Date(order.created_at).toLocaleString()}</p>
        </div>
      </div>

      {!isCancelled && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="text-center pb-4">
            <CardDescription className="uppercase tracking-widest font-semibold text-primary">Pickup Token</CardDescription>
            <CardTitle className="text-6xl font-black tracking-tighter text-foreground">{order.pickup_token}</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">Show this code at the counter when your order is ready</p>
          </CardHeader>
        </Card>
      )}

      {/* Status Progress Bar */}
      <Card>
        <CardContent className="p-6">
          {isCancelled ? (
            <div className="text-center text-destructive font-semibold text-lg flex items-center justify-center gap-2">
              <CheckCircle2 className="w-6 h-6" /> Order Cancelled
            </div>
          ) : (
            <div className="relative">
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-muted -translate-y-1/2 z-0 hidden sm:block"></div>
              <div 
                className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 z-0 hidden sm:block transition-all duration-500 ease-in-out" 
                style={{ width: `${Math.max(0, (currentStepIndex / (STATUS_STEPS.length - 1)) * 100)}%` }}
              ></div>
              
              <div className="relative z-10 flex flex-col sm:flex-row justify-between gap-4 sm:gap-0">
                {STATUS_STEPS.map((step, index) => {
                  const isCompleted = currentStepIndex >= index
                  const isCurrent = currentStepIndex === index
                  
                  const icons = {
                    placed: <Clock className="w-5 h-5" />,
                    confirmed: <CheckCircle2 className="w-5 h-5" />,
                    preparing: <ChefHat className="w-5 h-5" />,
                    ready: <Package className="w-5 h-5" />,
                    picked_up: <Check className="w-5 h-5" />
                  }
                  
                  return (
                    <div key={step} className="flex sm:flex-col items-center gap-4 sm:gap-2 bg-card">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${
                        isCurrent ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' : 
                        isCompleted ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        {icons[step as keyof typeof icons]}
                      </div>
                      <span className={`text-sm font-medium ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {formatOrderStatus(step)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xl font-bold">Order Items</h2>
          <div className="space-y-4">
            {order.items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4 flex gap-4">
                  <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                    <Coffee className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <p className="font-bold text-primary">{formatPrice(item.unit_price * item.quantity)}</p>
                    </div>
                    <p className="text-muted-foreground text-sm">{formatPrice(item.unit_price)} × {item.quantity}</p>
                    {item.special_instructions && (
                      <p className="text-xs italic text-muted-foreground mt-1 border-l-2 pl-2 bg-muted/50 py-1">
                        Note: {item.special_instructions}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment Status</span>
                <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'} className="uppercase text-[10px]">
                  {order.payment_status}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Items Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxes & Fees</span>
                <span>₹0.00</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">{formatPrice(order.total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
