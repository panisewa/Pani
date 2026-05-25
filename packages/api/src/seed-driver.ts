/**
 * One-off script: create a fake DRIVER user for local dev/testing.
 * Run: pnpm --filter api exec tsx src/seed-driver.ts
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env['SUPABASE_URL']!
const serviceKey = process.env['SUPABASE_SERVICE_ROLE_KEY']!

const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

async function main() {
  // 1. Find the first tenant
  const { data: tenants, error: tErr } = await admin
    .from('tenants')
    .select('id, name, slug')
    .limit(1)
    .single()

  if (tErr || !tenants) {
    console.error('No tenant found. Register an account first.')
    process.exit(1)
  }

  console.log(`Using tenant: ${tenants.name} (${tenants.id})`)

  const email = 'driver.ram@panisewa.local'
  const password = 'Driver@123'

  // 2. Create auth user
  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authErr) {
    if (authErr.message.includes('already been registered')) {
      console.log('Auth user already exists, looking up...')
      const { data: list } = await admin.auth.admin.listUsers()
      const existing = list?.users.find((u) => u.email === email)
      if (!existing) { console.error('Could not find existing user.'); process.exit(1) }

      // Ensure users row exists
      const { data: existingRow } = await admin
        .from('users')
        .select('id')
        .eq('id', existing.id)
        .single()

      if (existingRow) {
        console.log('Driver already seeded:', email)
        console.log('Password:', password)
        process.exit(0)
      }

      // Insert missing row
      await admin.from('users').insert({
        id: existing.id,
        tenant_id: tenants.id,
        role: 'DRIVER',
        first_name: 'Ram',
        last_name: 'Bahadur',
        phone: '9841000001',
        is_active: true,
      })
      console.log('Driver row created for existing auth user.')
      console.log('Email:', email)
      console.log('Password:', password)
      process.exit(0)
    }
    console.error('Auth error:', authErr.message)
    process.exit(1)
  }

  const userId = authData.user!.id

  // 3. Insert users row
  const { error: uErr } = await admin.from('users').insert({
    id: userId,
    tenant_id: tenants.id,
    role: 'DRIVER',
    first_name: 'Ram',
    last_name: 'Bahadur',
    phone: '9841000001',
    is_active: true,
  })

  if (uErr) {
    console.error('Failed to insert users row:', uErr.message)
    process.exit(1)
  }

  console.log('Driver created successfully.')
  console.log('Email:', email)
  console.log('Password:', password)
  console.log('Name: Ram Bahadur')
  console.log('Tenant:', tenants.name)
}

main()
