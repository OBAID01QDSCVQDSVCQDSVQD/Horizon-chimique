import { connectToDatabase } from '../lib/db'
import Garantie from '../lib/db/models/garantie.model'
import MaintenanceStatus from '../lib/db/models/maintenance.model'

async function migrateMaintenanceData() {
  try {
    await connectToDatabase()
    console.log('🔄 Starting maintenance data migration...')

    // جلب جميع الضمانات المعتمدة
    const garanties = await Garantie.find({ status: 'APPROVED' })
    console.log(`📊 Found ${garanties.length} approved garanties`)

    let createdCount = 0
    let skippedCount = 0

    for (const garantie of garanties) {
      console.log(`\n🔍 Processing garantie: ${garantie.company} - ${garantie.name}`)

      // التحقق من وجود سجلات صيانة موجودة
      const existingMaintenances = await MaintenanceStatus.find({ garantieId: garantie._id })
      if (existingMaintenances.length > 0) {
        console.log(`⏭️  Skipping - ${existingMaintenances.length} maintenance records already exist`)
        skippedCount++
        continue
      }

      // إنشاء سجلات الصيانة من البيانات الموجودة
      if (garantie.maintenances && garantie.maintenances.length > 0) {
        const maintenanceRecords = garantie.maintenances.map((maintenance: any) => ({
          garantieId: garantie._id,
          maintenanceDate: maintenance.date,
          status: 'PENDING',
          maintenanceType: 'PREVENTIVE',
          priority: 'MEDIUM',
          isScheduled: true
        }))

        await MaintenanceStatus.insertMany(maintenanceRecords)
        console.log(`✅ Created ${maintenanceRecords.length} maintenance records`)
        createdCount += maintenanceRecords.length

        // تحديث إحصائيات الضمان
        await Garantie.findByIdAndUpdate(garantie._id, {
          nextMaintenanceDate: garantie.maintenances[0]?.date || null
        })
      } else {
        console.log(`⚠️  No maintenance dates found`)
        skippedCount++
      }
    }

    console.log(`\n🎉 Migration completed!`)
    console.log(`✅ Created: ${createdCount} maintenance records`)
    console.log(`⏭️  Skipped: ${skippedCount} garanties`)
    console.log(`📊 Total processed: ${garanties.length} garanties`)

  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    process.exit(0)
  }
}

// تشغيل الـ migration
migrateMaintenanceData() 