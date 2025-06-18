import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { connectToDatabase } from '@/lib/db'
import User from '@/lib/db/models/user.model'
import bcrypt from 'bcryptjs'

async function createTestUser() {
  try {
    await connectToDatabase()
    console.log('✅ Connected to database')

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'admin@test.com' })
    if (existingUser) {
      console.log('👤 Test user already exists')
      console.log('Email: admin@test.com')
      console.log('Password: admin123')
      return
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12)

    // Create test user
    const testUser = await User.create({
      email: 'admin@test.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN'
    })

    console.log('🎉 Test user created successfully!')
    console.log('Email: admin@test.com')
    console.log('Password: admin123')
    console.log('Role: ADMIN')
    console.log('ID:', testUser._id)

  } catch (error) {
    console.error('💥 Error creating test user:', error)
  } finally {
    process.exit(0)
  }
}

createTestUser() 