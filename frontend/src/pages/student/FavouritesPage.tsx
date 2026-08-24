import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Heart, Plus, Star, Clock } from 'lucide-react'
import api from '@/lib/api'
import { useCartStore } from '@/store/cart'
import type { MenuItem } from '@/types'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/utils'

export default function FavouritesPage() {
  const queryClient = useQueryClient()
  const { setCart } = useCartStore()

  const { data: favourites, isLoading } = useQuery<{id: string, menu_item_id: string, menu_item: MenuItem}[]>({
    queryKey: ['favourites'],
    queryFn: async () => {
      const { data } = await api.get('/favourites')
      return data
    }
  })

  const removeFavourite = useMutation({
    mutationFn: async (itemId: string) => {
      await api.delete(`/favourites/${itemId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favourites'] })
      toast.success('Removed from favourites')
    }
  })

  const addToCart = useMutation({
    mutationFn: async (menuItemId: string) => {
      const { data } = await api.post('/cart/items', { menu_item_id: menuItemId, quantity: 1 })
      return data
    },
    onSuccess: (data) => {
      setCart(data)
      toast.success('Added to cart')
    },
    onError: () => {
      toast.error('Failed to add item to cart')
    }
  })

  if (isLoading) return <div className="p-8 text-center animate-pulse">Loading favourites...</div>

  if (!favourites || favourites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="bg-muted p-6 rounded-full">
          <Heart className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold">No favourites yet</h2>
        <p className="text-muted-foreground max-w-sm text-center">
          You haven't added any items to your favourites. Look for the heart icon on the menu!
        </p>
        <Button asChild className="mt-4">
          <Link to="/">Browse Menu</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your Favourites</h1>
        <p className="text-muted-foreground mt-1">Quick access to your most loved dishes</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {favourites.map(({ id: favId, menu_item: item }) => (
          <Card key={favId} className="overflow-hidden flex flex-col hover:shadow-md transition-shadow group relative">
            <Button 
              variant="destructive" 
              size="icon" 
              className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => removeFavourite.mutate(item.id)}
              disabled={removeFavourite.isPending}
              title="Remove from favourites"
            >
              <Heart className="w-4 h-4 fill-current" />
            </Button>

            <div className="aspect-[4/3] bg-muted relative overflow-hidden">
              {item.image_url ? (
                <img 
                  src={item.image_url} 
                  alt={item.name} 
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-secondary/50 text-muted-foreground">
                  <span className="text-sm">No image</span>
                </div>
              )}
              {!item.is_available && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                  <Badge variant="destructive" className="text-sm px-3 py-1">Sold Out</Badge>
                </div>
              )}
              {item.rating_avg && item.rating_avg > 0 && (
                <div className="absolute top-2 left-2 bg-background/90 backdrop-blur text-foreground px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 shadow-sm">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  {item.rating_avg.toFixed(1)}
                </div>
              )}
            </div>
            
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-start gap-2">
                <CardTitle className="text-lg line-clamp-1">{item.name}</CardTitle>
                <span className="font-semibold text-primary whitespace-nowrap">{formatPrice(item.price)}</span>
              </div>
              {item.description && (
                <CardDescription className="line-clamp-2 text-xs mt-1">
                  {item.description}
                </CardDescription>
              )}
            </CardHeader>
            
            <CardContent className="p-4 pt-0 flex-1 flex items-end">
              {item.available_from && item.available_until && (
                <div className="flex items-center text-xs text-muted-foreground gap-1 mt-2">
                  <Clock className="w-3 h-3" />
                  <span>{item.available_from.substring(0,5)} - {item.available_until.substring(0,5)}</span>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="p-4 pt-0">
              <Button 
                className="w-full" 
                disabled={!item.is_available || addToCart.isPending}
                onClick={() => addToCart.mutate(item.id)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add to Cart
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
