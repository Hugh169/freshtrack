/**
 * Seed script for FreshTrack
 * Usage: npm run seed
 *
 * Creates a test user, restaurant, 20 inventory items, and 2 weeks of movements/waste logs.
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { subDays, addDays, format, startOfDay } from 'date-fns'

dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const TEST_EMAIL = 'demo@freshtrack.app'
const TEST_PASSWORD = 'freshtrack123'

interface SeedItem {
  name: string
  category: string
  unit: string
  current_quantity: number
  reorder_threshold: number
  cost_per_unit: number
  expiry_date?: string
}

const items: SeedItem[] = [
  // Beverages
  {
    name: 'Arabica Coffee Beans',
    category: 'Beverages',
    unit: 'kg',
    current_quantity: 1.2,
    reorder_threshold: 2,
    cost_per_unit: 32.0,
    expiry_date: format(addDays(new Date(), 120), 'yyyy-MM-dd'),
  },
  {
    name: 'Whole Milk',
    category: 'Dairy',
    unit: 'L',
    current_quantity: 18,
    reorder_threshold: 5,
    cost_per_unit: 1.8,
    expiry_date: format(addDays(new Date(), 4), 'yyyy-MM-dd'),
  },
  {
    name: 'Oat Milk',
    category: 'Beverages',
    unit: 'L',
    current_quantity: 2.5,
    reorder_threshold: 3,
    cost_per_unit: 2.5,
    expiry_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
  },
  {
    name: 'Almond Milk',
    category: 'Beverages',
    unit: 'L',
    current_quantity: 4,
    reorder_threshold: 2,
    cost_per_unit: 3.2,
    expiry_date: format(addDays(new Date(), 45), 'yyyy-MM-dd'),
  },
  {
    name: 'Orange Juice (Fresh)',
    category: 'Beverages',
    unit: 'L',
    current_quantity: 6,
    reorder_threshold: 2,
    cost_per_unit: 3.5,
    expiry_date: format(addDays(new Date(), 2), 'yyyy-MM-dd'),
  },
  // Dairy
  {
    name: 'Free Range Eggs',
    category: 'Dairy',
    unit: 'dozen',
    current_quantity: 4,
    reorder_threshold: 2,
    cost_per_unit: 8.5,
    expiry_date: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
  },
  {
    name: 'Unsalted Butter',
    category: 'Dairy',
    unit: 'kg',
    current_quantity: 3.5,
    reorder_threshold: 1,
    cost_per_unit: 12.0,
    expiry_date: format(addDays(new Date(), 21), 'yyyy-MM-dd'),
  },
  {
    name: 'Thickened Cream',
    category: 'Dairy',
    unit: 'L',
    current_quantity: 0.6,
    reorder_threshold: 1,
    cost_per_unit: 4.5,
    expiry_date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
  },
  {
    name: 'Cheddar Cheese',
    category: 'Dairy',
    unit: 'kg',
    current_quantity: 1.8,
    reorder_threshold: 0.5,
    cost_per_unit: 15.0,
    expiry_date: format(addDays(new Date(), 18), 'yyyy-MM-dd'),
  },
  // Produce
  {
    name: 'Avocado',
    category: 'Produce',
    unit: 'units',
    current_quantity: 3,
    reorder_threshold: 4,
    cost_per_unit: 2.2,
    expiry_date: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
  },
  {
    name: 'Baby Spinach',
    category: 'Produce',
    unit: 'kg',
    current_quantity: 1.5,
    reorder_threshold: 0.5,
    cost_per_unit: 9.0,
    expiry_date: format(addDays(new Date(), 5), 'yyyy-MM-dd'),
  },
  {
    name: 'Cherry Tomatoes',
    category: 'Produce',
    unit: 'kg',
    current_quantity: 2,
    reorder_threshold: 0.5,
    cost_per_unit: 8.0,
    expiry_date: format(addDays(new Date(), 6), 'yyyy-MM-dd'),
  },
  // Meat & Seafood
  {
    name: 'Smoked Salmon',
    category: 'Meat & Seafood',
    unit: 'kg',
    current_quantity: 0.8,
    reorder_threshold: 0.5,
    cost_per_unit: 45.0,
    expiry_date: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
  },
  {
    name: 'Streaky Bacon',
    category: 'Meat & Seafood',
    unit: 'kg',
    current_quantity: 2.5,
    reorder_threshold: 1,
    cost_per_unit: 18.0,
    expiry_date: format(addDays(new Date(), 10), 'yyyy-MM-dd'),
  },
  // Bakery
  {
    name: 'Sourdough Loaf',
    category: 'Bakery',
    unit: 'loaves',
    current_quantity: 2,
    reorder_threshold: 3,
    cost_per_unit: 7.5,
    expiry_date: format(addDays(new Date(), 2), 'yyyy-MM-dd'),
  },
  {
    name: 'Sourdough Rolls',
    category: 'Bakery',
    unit: 'units',
    current_quantity: 24,
    reorder_threshold: 8,
    cost_per_unit: 2.5,
    expiry_date: format(addDays(new Date(), 2), 'yyyy-MM-dd'),
  },
  // Dry Goods
  {
    name: 'Plain Flour',
    category: 'Dry Goods',
    unit: 'kg',
    current_quantity: 12,
    reorder_threshold: 3,
    cost_per_unit: 1.8,
  },
  {
    name: 'White Sugar',
    category: 'Dry Goods',
    unit: 'kg',
    current_quantity: 8,
    reorder_threshold: 2,
    cost_per_unit: 2.2,
  },
  {
    name: 'Vanilla Syrup',
    category: 'Dry Goods',
    unit: 'units',
    current_quantity: 1,
    reorder_threshold: 1,
    cost_per_unit: 12.0,
  },
  {
    name: 'Chilli Jam',
    category: 'Other',
    unit: 'units',
    current_quantity: 4,
    reorder_threshold: 2,
    cost_per_unit: 8.0,
  },
]

type WasteReason = 'expired' | 'spoiled' | 'overcooked' | 'dropped' | 'over_prepared' | 'other'

const wasteReasons: WasteReason[] = ['expired', 'spoiled', 'overcooked', 'dropped', 'over_prepared', 'other']

function randomBetween(min: number, max: number, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

async function seed() {
  console.log('🌱 Starting FreshTrack seed...\n')

  // ── 1. Create / find test user ──────────────────────────────────────────────
  console.log(`Creating test user: ${TEST_EMAIL}`)
  let userId: string

  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const existing = existingUsers?.users.find((u) => u.email === TEST_EMAIL)

  if (existing) {
    console.log('  ↳ User already exists, reusing')
    userId = existing.id
  } else {
    const { data: newUser, error } = await supabase.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
    })
    if (error) throw error
    userId = newUser.user.id
    console.log(`  ↳ Created user ${userId}`)
  }

  // ── 2. Create / find restaurant ─────────────────────────────────────────────
  console.log('\nSetting up restaurant: The Corner Cafe')
  let restaurantId: string

  const { data: existingRestaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', userId)
    .single()

  if (existingRestaurant) {
    console.log('  ↳ Restaurant exists, reusing')
    restaurantId = existingRestaurant.id
  } else {
    const { data: newRestaurant, error } = await supabase
      .from('restaurants')
      .insert({ name: 'The Corner Cafe', owner_id: userId, created_at: new Date().toISOString() })
      .select('id')
      .single()
    if (error) throw error
    restaurantId = newRestaurant.id
    console.log(`  ↳ Created restaurant ${restaurantId}`)
  }

  // ── 3. Clear existing data ──────────────────────────────────────────────────
  console.log('\nClearing existing inventory/waste data...')
  await supabase.from('waste_logs').delete().eq('restaurant_id', restaurantId)
  await supabase.from('stock_movements').delete().eq('restaurant_id', restaurantId)
  await supabase.from('inventory_items').delete().eq('restaurant_id', restaurantId)

  // ── 4. Insert inventory items ───────────────────────────────────────────────
  console.log(`\nInserting ${items.length} inventory items...`)
  const { data: insertedItems, error: itemsError } = await supabase
    .from('inventory_items')
    .insert(
      items.map((item) => ({
        ...item,
        restaurant_id: restaurantId,
        created_at: subDays(new Date(), 30).toISOString(),
        updated_at: new Date().toISOString(),
      }))
    )
    .select()

  if (itemsError) throw itemsError
  console.log(`  ↳ Inserted ${insertedItems.length} items`)

  // ── 5. Generate 14 days of movements ───────────────────────────────────────
  console.log('\nGenerating 14 days of stock movements...')
  const movements: object[] = []
  const wasteLogs: object[] = []

  for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
    const day = subDays(new Date(), dayOffset)

    // Deliveries: 2-4 random items received every 3 days
    if (dayOffset % 3 === 0) {
      const deliveryItems = insertedItems
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(Math.random() * 3) + 2)

      for (const item of deliveryItems) {
        const qty = randomBetween(2, 10, 1)
        movements.push({
          restaurant_id: restaurantId,
          item_id: item.id,
          movement_type: 'received',
          quantity: qty,
          notes: `Delivery from supplier`,
          recorded_at: new Date(day.setHours(8, 30, 0)).toISOString(),
          created_by: userId,
        })
      }
    }

    // Usage: 5-8 random items used each day (service)
    const usageItems = insertedItems
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 4) + 5)

    for (const item of usageItems) {
      const maxUse = Math.min(item.current_quantity, item.reorder_threshold * 0.4)
      if (maxUse <= 0) continue
      const qty = randomBetween(0.1, maxUse, 2)
      movements.push({
        restaurant_id: restaurantId,
        item_id: item.id,
        movement_type: 'used',
        quantity: -qty,
        notes: dayOffset < 5 ? 'Breakfast service' : 'Brunch service',
        recorded_at: new Date(day.setHours(14, 0, 0)).toISOString(),
        created_by: userId,
      })
    }

    // Waste: 1-3 items wasted per day
    const wasteItemCount = Math.floor(Math.random() * 3) + 1
    const wasteItems = insertedItems
      .filter((i) => i.current_quantity > 0)
      .sort(() => Math.random() - 0.5)
      .slice(0, wasteItemCount)

    for (const item of wasteItems) {
      const qty = randomBetween(0.05, 0.5, 2)
      const reason = pick(wasteReasons)
      const cost = parseFloat((qty * item.cost_per_unit).toFixed(2))

      wasteLogs.push({
        restaurant_id: restaurantId,
        item_id: item.id,
        quantity: qty,
        reason,
        estimated_cost: cost,
        logged_at: new Date(day.setHours(17, 30, 0)).toISOString(),
        created_by: userId,
      })

      movements.push({
        restaurant_id: restaurantId,
        item_id: item.id,
        movement_type: 'wasted',
        quantity: -qty,
        notes: `Wasted — ${reason}`,
        recorded_at: new Date(day.setHours(17, 31, 0)).toISOString(),
        created_by: userId,
      })
    }
  }

  // Insert movements in batches
  const batchSize = 50
  for (let i = 0; i < movements.length; i += batchSize) {
    const { error } = await supabase.from('stock_movements').insert(movements.slice(i, i + batchSize))
    if (error) console.warn('Movement batch error:', error.message)
  }
  console.log(`  ↳ Inserted ${movements.length} movements`)

  for (let i = 0; i < wasteLogs.length; i += batchSize) {
    const { error } = await supabase.from('waste_logs').insert(wasteLogs.slice(i, i + batchSize))
    if (error) console.warn('Waste log batch error:', error.message)
  }
  console.log(`  ↳ Inserted ${wasteLogs.length} waste log entries`)

  // ── 6. Summary ──────────────────────────────────────────────────────────────
  console.log('\n✅ Seed complete!')
  console.log('─────────────────────────────────────')
  console.log(`  URL:      ${supabaseUrl}`)
  console.log(`  Email:    ${TEST_EMAIL}`)
  console.log(`  Password: ${TEST_PASSWORD}`)
  console.log('─────────────────────────────────────')
  console.log('  Now run: npm run dev → http://localhost:3000')
}

seed().catch((err) => {
  console.error('\n❌ Seed failed:', err)
  process.exit(1)
})
