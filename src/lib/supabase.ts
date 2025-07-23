import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export interface FishType {
  id: number
  name: string
  water_type: 'saltwater' | 'freshwater' | 'other'
  price_per_kg: number
  image_url?: string
  description?: string
  available_kg: number
  is_active: boolean
  created_at: string
  updated_at: string
  available_cuts?: CutType[]
}

export interface CutType {
  id: number
  cut_name: string
  default_addition: number
  created_at: string
}

export interface FishCutPrice {
  id: number
  fish_id: number
  cut_type_id: number
  override_price?: number
  created_at: string
}

export interface OrderItem {
  fish_name: string
  cut: string
  quantity_kg: number
  price: number
}

export interface Order {
  id: number
  customer_name: string
  email: string
  phone: string
  delivery_address: string
  delivery_date: string
  delivery_time: string
  order_items: OrderItem[]
  total_price: number
  created_at: string
} 