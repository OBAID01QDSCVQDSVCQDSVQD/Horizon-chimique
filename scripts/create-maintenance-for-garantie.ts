import { connectToDatabase } from '../lib/db'
import Garantie from '../lib/db/models/garantie.model'
import MaintenanceStatus from '../lib/db/models/maintenance.model'

async function createMaintenanceForExistingGaranties() {
  try {
    await connectToDatabase()
    console.log('Connected to database')

    // جلب جميع الضمانات المعتمدة
    const garanties = await Garantie.find({ status: 'APPROVED' })
    console.log(`Found ${garanties.length} approved garanties`)

    let createdCount = 0
    let skippedCount = 0

    for (const garantie of garanties) {
      // التحقق من وجود سجلات صيانة للضمان
      const existingMaintenance = await MaintenanceStatus.findOne({ garantieId: garantie._id })
      
      if (existingMaintenance) {
        console.log(`Skipping garantie ${garantie._id} - maintenance already exists`)
        skippedCount++
        continue
      }

      // إنشاء سجل صيانة افتراضي
      const maintenanceData = {
        garantieId: garantie._id,
        maintenanceType: 'PREVENTIVE',
        maintenanceDate: new Date(),
        status: 'PENDING',
        notes: 'صيانة وقائية دورية',
        cost: 0,
        duration: 2
      }

      await MaintenanceStatus.create(maintenanceData)
      console.log(`Created maintenance record for garantie ${garantie._id}`)
      createdCount++
    }

    console.log('\n=== Summary ===')
    console.log(`Total garanties processed: ${garanties.length}`)
    console.log(`Maintenance records created: ${createdCount}`)
    console.log(`Skipped (already exists): ${skippedCount}`)

  } catch (error) {
    console.error('Error creating maintenance records:', error)
  } finally {
    process.exit(0)
  }
}

// تشغيل السكريبت
createMaintenanceForExistingGaranties() 