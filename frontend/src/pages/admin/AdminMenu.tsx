import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@supabase/supabase-js'
import { Plus, Edit2, Trash2, Image as ImageIcon } from 'lucide-react'
import api from '@/lib/api'
import type { Category, MenuItem } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/utils'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

export default function AdminMenu() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('items')
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)

  // Form State
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('') // rupees
  const [categoryId, setCategoryId] = useState('')
  const [isAvailable, setIsAvailable] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data } = await api.get('/menu/categories')
      return data
    }
  })

  const { data: items, isLoading: itemsLoading } = useQuery<MenuItem[]>({
    queryKey: ['admin-items'],
    queryFn: async () => {
      const { data } = await api.get('/menu/items')
      return data
    }
  })

  const resetForm = () => {
    setName('')
    setDescription('')
    setPrice('')
    setCategoryId('')
    setIsAvailable(true)
    setEditingItem(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const openEditDialog = (item: MenuItem) => {
    setEditingItem(item)
    setName(item.name)
    setDescription(item.description || '')
    setPrice((item.price / 100).toString())
    setCategoryId(item.category_id || '')
    setIsAvailable(item.is_available)
    setIsItemDialogOpen(true)
  }

  const saveItem = useMutation({
    mutationFn: async () => {
      const payload: any = {
        name,
        description: description || undefined,
        price: Math.round(parseFloat(price) * 100),
        category_id: categoryId || undefined,
        is_available: isAvailable
      }
      
      let imageUrl = editingItem?.image_url

      // Handle Image Upload if file selected
      if (fileInputRef.current?.files?.length && supabase) {
        setUploadingImage(true)
        const file = fileInputRef.current.files[0]
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
        const filePath = `items/${fileName}`
        
        const { error: uploadError } = await supabase.storage.from('menu-images').upload(filePath, file)
        if (uploadError) {
          setUploadingImage(false)
          throw new Error('Image upload failed: ' + uploadError.message)
        }
        
        const { data: publicUrlData } = supabase.storage.from('menu-images').getPublicUrl(filePath)
        imageUrl = publicUrlData.publicUrl
        payload.image_url = imageUrl
        setUploadingImage(false)
      }

      if (editingItem) {
        await api.patch(`/menu/items/${editingItem.id}`, payload)
      } else {
        await api.post('/menu/items', payload)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-items'] })
      setIsItemDialogOpen(false)
      resetForm()
      toast.success(editingItem ? 'Item updated' : 'Item created')
    },
    onError: (err: any) => {
      setUploadingImage(false)
      toast.error(err.message || 'Failed to save item')
    }
  })

  const toggleAvailability = useMutation({
    mutationFn: async ({ id, is_available }: { id: string, is_available: boolean }) => {
      await api.patch(`/menu/items/${id}`, { is_available })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-items'] })
    }
  })

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/menu/items/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-items'] })
      toast.success('Item deleted')
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Menu Management</h1>
          <p className="text-muted-foreground mt-1">Manage categories and menu items</p>
        </div>
        
        <Dialog open={isItemDialogOpen} onOpenChange={(open) => {
          setIsItemDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Add Menu Item</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Item' : 'Create New Item'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input id="price" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="image">Image</Label>
                <div className="flex items-center gap-2">
                  <Input id="image" type="file" accept="image/*" ref={fileInputRef} className="cursor-pointer" />
                </div>
                {editingItem?.image_url && !fileInputRef.current?.value && (
                  <p className="text-xs text-muted-foreground">Current image: <a href={editingItem.image_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">View</a></p>
                )}
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Switch id="available" checked={isAvailable} onCheckedChange={setIsAvailable} />
                <Label htmlFor="available">Available for ordering</Label>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => saveItem.mutate()} disabled={saveItem.isPending || uploadingImage || !name || !price}>
                {saveItem.isPending || uploadingImage ? 'Saving...' : 'Save changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="items">Menu Items</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>
        
        <TabsContent value="items" className="mt-6 border rounded-md bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-center">Available</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itemsLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell>
                </TableRow>
              ) : items?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No menu items found.</TableCell>
                </TableRow>
              ) : (
                items?.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-10 h-10 rounded object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-muted-foreground">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category?.name || 'Uncategorized'}</TableCell>
                    <TableCell>{formatPrice(item.price)}</TableCell>
                    <TableCell className="text-center">
                      <Switch 
                        checked={item.is_available} 
                        onCheckedChange={(c) => toggleAvailability.mutate({ id: item.id, is_available: c })} 
                        disabled={toggleAvailability.isPending}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this item?')) {
                            deleteItem.mutate(item.id)
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>
        
        <TabsContent value="categories" className="mt-6 border rounded-md bg-card p-8 text-center text-muted-foreground">
          Category management CRUD goes here. (Placeholder for demo).
        </TabsContent>
      </Tabs>
    </div>
  )
}
