export type Role = 'student' | 'staff' | 'admin'

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'cancelled'

export type User = {
  id: string
  name: string
  email: string
  role: Role
  student_id?: string
  department?: string
  is_active: boolean
}

export type Category = {
  id: string
  name: string
  description?: string
  sort_order: number
}

export type MenuItem = {
  id: string
  category_id: string
  category?: Category
  name: string
  description?: string
  price: number // in paise (₹ × 100)
  image_url?: string
  is_available: boolean
  available_from?: string // "08:00"
  available_until?: string // "22:00"
  rating_avg?: number
  rating_count?: number
}

export type CartItem = {
  id: string
  menu_item_id: string
  menu_item?: MenuItem
  quantity: number
  special_instructions?: string
}

export type Cart = {
  id: string
  items: CartItem[]
  total: number
}

export type OrderItem = {
  id: string
  menu_item_id: string
  menu_item?: MenuItem
  quantity: number
  unit_price: number
  special_instructions?: string
}

export type Order = {
  id: string
  user_id: string
  user?: User
  pickup_token: string
  status: OrderStatus
  total: number
  scheduled_pickup_at?: string
  items: OrderItem[]
  created_at: string
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
}

export type Notification = {
  id: string
  title: string
  body: string
  is_read: boolean
  created_at: string
}
