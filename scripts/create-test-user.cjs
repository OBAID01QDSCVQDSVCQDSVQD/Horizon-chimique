require('dotenv').config({ path: '.env.local' })

const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String },
  role: { type: String, default: 'USER' },
  image: { type: String },
}, { timestamps: true })

const User = mongoose.models.User || mongoose.model('User', userSchema)

async function createTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to database')

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'admin@test.com' })
    if (existingUser) {
      console.log('👤 Test user already exists')
      console.log('Email: admin@test.com')
      console.log('Password: admin123')
      console.log('Role:', existingUser.role)
      await mongoose.disconnect()
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

    await mongoose.disconnect()

  } catch (error) {
    console.error('💥 Error creating test user:', error)
    await mongoose.disconnect()
  }
}

createTestUser() 