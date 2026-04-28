export type Category =
  | 'Produce'
  | 'Dairy'
  | 'Meat & Seafood'
  | 'Dry Goods'
  | 'Beverages'
  | 'Bakery'
  | 'Other'

export type Unit = 'kg' | 'g' | 'L' | 'mL' | 'units' | 'portions' | 'loaves' | 'dozen'

export type MovementType = 'received' | 'used' | 'wasted' | 'adjusted'

export type WasteReason =
  | 'expired'
  | 'spoiled'
  | 'overcooked'
  | 'dropped'
  | 'over_prepared'
  | 'other'

export type ItemStatus = 'ok' | 'low_stock' | 'expiring_soon' | 'expired'

export interface Restaurant {
  id: string
  name: string
  owner_id: string
  created_at: string
}

export interface InventoryItem {
  id: string
  restaurant_id: string
  name: string
  category: Category
  unit: Unit
  current_quantity: number
  reorder_threshold: number
  cost_per_unit: number
  expiry_date: string | null
  created_at: string
  updated_at: string
}

export interface StockMovement {
  id: string
  restaurant_id: string
  item_id: string
  movement_type: MovementType
  quantity: number
  notes: string | null
  recorded_at: string
  created_by: string
  inventory_items?: {
    name: string
    unit: Unit
    category: Category
  }
}

export interface WasteLog {
  id: string
  restaurant_id: string
  item_id: string
  quantity: number
  reason: WasteReason
  estimated_cost: number
  logged_at: string
  created_by: string
  inventory_items?: {
    name: string
    unit: Unit
    category: Category
    cost_per_unit: number
  }
}

export interface DashboardMetrics {
  totalInventoryValue: number
  lowStockCount: number
  expiringSoonCount: number
  wasteThisWeek: number
  wasteThisMonth: number
  wasteLastMonth: number
}

export const CATEGORIES: Category[] = [
  'Produce',
  'Dairy',
  'Meat & Seafood',
  'Dry Goods',
  'Beverages',
  'Bakery',
  'Other',
]

export const UNITS: Unit[] = ['kg', 'g', 'L', 'mL', 'units', 'portions', 'loaves', 'dozen']

export const WASTE_REASONS: { value: WasteReason; label: string }[] = [
  { value: 'expired', label: 'Expired' },
  { value: 'spoiled', label: 'Spoiled' },
  { value: 'overcooked', label: 'Overcooked' },
  { value: 'dropped', label: 'Dropped / Damaged' },
  { value: 'over_prepared', label: 'Over-prepared' },
  { value: 'other', label: 'Other' },
]
