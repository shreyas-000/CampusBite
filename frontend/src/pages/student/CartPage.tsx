import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react'
import api from '@/lib/api'
import { useCartStore } from '@/store/cart'
import type { Cart, CartItem } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/utils'

export default function CartPage() {
  const navigate = useNavigate()
  const { setCart, clearCart } = useCartStore()
  const queryClient = useQueryClient()
  
  const { data: cart, isLoading } = useQuery<Cart>({
    queryKey: ['cart'],
    queryFn: async () => {
      const { data } = await api.get('/cart')
      setCart(data)
      return data
    }
  })

  const updateQuantity = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string, quantity: number }) => {
      const { data } = await api.patch(`/cart/items/${itemId}`, { quantity })
      return data
    },
    onSuccess: (data) => {
      setCart(data)
      queryClient.setQueryData(['cart'], data)
    }
  })

  const removeItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { data } = await api.delete(`/cart/items/${itemId}`)
      return data
    },
    onSuccess: (data) => {
      setCart(data)
      queryClient.setQueryData(['cart'], data)
      toast.success('Item removed')
    }
  })

  const checkout = useMutation({
    mutationFn: async () => {
      if (!(window as any).Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://checkout.razorpay.com/v1/checkout.js'
          script.onload = resolve
          script.onerror = () => reject(new Error('Razorpay SDK failed to load'))
          document.body.appendChild(script)
        })
      }
      
      // 1. Create order
      const { data: order } = await api.post('/orders')
      
      // 2. Initiate payment
      const { data: paymentData } = await api.post('/payments/initiate', { order_id: order.id })
      
      return { order, paymentData }
    },
    onSuccess: ({ order, paymentData }) => {
      clearCart()
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      
      // 3. Open Razorpay Widget
      const options = {
        key: paymentData.key_id,
        amount: paymentData.amount,
        currency: 'INR',
        order_id: paymentData.razorpay_order_id,
        name: 'CampusBite',
        description: 'Canteen Order',
        handler: async (response: any) => {
          try {
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            toast.success('Payment successful!')
            navigate(`/orders/${order.id}`)
          } catch (e) {
            toast.error('Payment verification failed.')
            navigate(`/orders/${order.id}`)
          }
        },
        modal: {
          ondismiss: () => {
            toast.error('Payment cancelled')
            navigate(`/orders/${order.id}`)
          }
        }
      }
      const rzp = new (window as any).Razorpay(options)
      rzp.open()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Checkout failed')
    }
  })

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading cart...</div>
  }

  const items = cart?.items || []
  
  // Calculate total locally since it isn't returned natively in the cart schema right now
  const total = items.reduce((sum, item) => sum + (item.menu_item?.price || 0) * item.quantity, 0)

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="bg-muted p-6 rounded-full">
          <ShoppingBag className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold">Your cart is empty</h2>
        <p className="text-muted-foreground max-w-sm text-center">
          Looks like you haven't added anything to your cart yet. Browse the menu to find something delicious!
        </p>
        <Button asChild className="mt-4">
          <Link to="/">Explore Menu</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your Cart</h1>
        <p className="text-muted-foreground mt-1">Review your items before placing the order</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          {items.map((item: CartItem) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="flex flex-col sm:flex-row p-4 gap-4 items-start sm:items-center">
                {item.menu_item?.image_url ? (
                  <img src={item.menu_item.image_url} alt={item.menu_item.name} className="w-20 h-20 rounded-md object-cover flex-shrink-0" />
                ) : (
                  <div className="w-20 h-20 rounded-md bg-secondary flex items-center justify-center text-muted-foreground flex-shrink-0 text-xs">No image</div>
                )}
                
                <div className="flex-1 space-y-1 w-full">
                  <div className="flex justify-between">
                    <h3 className="font-semibold text-lg line-clamp-1">{item.menu_item?.name}</h3>
                    <p className="font-bold text-primary">{formatPrice((item.menu_item?.price || 0) * item.quantity)}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{formatPrice(item.menu_item?.price || 0)} each</p>
                  
                  {item.special_instructions && (
                    <p className="text-xs italic text-muted-foreground mt-2 border-l-2 pl-2">
                      Note: {item.special_instructions}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end mt-4 sm:mt-0">
                  <div className="flex items-center border rounded-md">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-none" 
                      disabled={item.quantity <= 1 || updateQuantity.isPending}
                      onClick={() => updateQuantity.mutate({ itemId: item.id, quantity: item.quantity - 1 })}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-none"
                      disabled={updateQuantity.isPending}
                      onClick={() => updateQuantity.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    disabled={removeItem.isPending}
                    onClick={() => removeItem.mutate(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal ({items.length} items)</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxes</span>
                <span>₹0.00</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">{formatPrice(total)}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full h-12 text-lg font-medium" 
                onClick={() => checkout.mutate()} 
                disabled={checkout.isPending}
              >
                {checkout.isPending ? 'Processing...' : 'Place Order & Pay'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
