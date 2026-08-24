import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Search, Plus, Clock, Star } from 'lucide-react'
import api from '@/lib/api'
import { useCartStore } from '@/store/cart'
import type { Category, MenuItem } from '@/types'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

function formatPrice(paise: number) {
  return `₹${(paise / 100).toFixed(2)}`
}

export default function MenuPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [search, setSearch] = useState('')
  const { setCart } = useCartStore()

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/menu/categories')
      return data
    }
  })

  const { data: items, isLoading } = useQuery<MenuItem[]>({
    queryKey: ['items', selectedCategory, search],
    queryFn: async () => {
      const params: any = {}
      if (selectedCategory !== 'all') params.category_id = selectedCategory
      if (search) params.search = search
      const { data } = await api.get('/menu/items', { params })
      return data
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

  const handleAddToCart = (item: MenuItem) => {
    if (!item.is_available) return
    addToCart.mutate(item.id)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Canteen Menu</h1>
          <p className="text-muted-foreground mt-1">Browse and order your favorite campus food</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search for dishes..." 
            className="pl-8 bg-background"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="all" value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
        <div className="overflow-x-auto pb-2 scrollbar-none">
          <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
            <TabsTrigger value="all" className="px-4">All Items</TabsTrigger>
            {categories?.map(category => (
              <TabsTrigger key={category.id} value={category.id} className="px-4">
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value={selectedCategory} className="mt-6 border-none p-0 outline-none">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="animate-pulse h-80 bg-muted/50" />
              ))}
            </div>
          ) : items?.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-lg border border-dashed">
              <h3 className="text-lg font-medium text-foreground">No items found</h3>
              <p className="text-muted-foreground text-sm mt-1">Try adjusting your search or category filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {items?.map(item => (
                <Card key={item.id} className="overflow-hidden flex flex-col hover:shadow-md transition-shadow group">
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
                      <div className="absolute top-2 right-2 bg-background/90 backdrop-blur text-foreground px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 shadow-sm">
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
                      onClick={() => handleAddToCart(item)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
