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
  sale_unit?: 'units' | 'kg'
  average_weight_kg?: number | null
  sold_by_customer_weight?: boolean
  has_sizes?: boolean  // האם לדג יש אפשרות לבחור מידות S/M/L
}

export interface CutType {
  id: number
  cut_name: string
  default_addition: number
  is_active: boolean
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
  is_holiday_order?: boolean
  holiday_id?: number
  status?: 'pending' | 'weighing' | 'ready' | 'completed'
  extras?: Array<{
    product_id: number
    name: string
    unit: string
    quantity: number
    price: number
    total: number
  }>
  extras_total?: number
}

export interface Holiday {
  id: number
  name: string
  start_date: string
  end_date: string
  active: boolean
  pickup_deadline?: string
  supplier_report_deadline?: string
}

export interface AdditionalProduct {
  id: number
  name: string
  price: number
  unit: string
  image_url?: string
  available_units: number
  active: boolean
  meal_tags?: string[]
  suggest_tags?: string[]
  category?: string
}

export interface Coupon {
  id: number
  code: string
  description?: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_order_amount: number
  max_uses?: number
  current_uses: number
  valid_from: string
  valid_until?: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface MealRecommendation {
  id: number
  fish_id: number
  cut_type_id: number
  meal_name: string
  recommended_products: string[]
}

export interface AvailabilitySlot {
  id: number
  day_of_week: number // 0=ראשון, 1=שני, וכו'
  start_time: string
  end_time: string
  max_orders: number
  active: boolean
  created_at: string
  updated_at: string
  current_orders?: number // נוסף לצורך ספירה דינמית
}
 