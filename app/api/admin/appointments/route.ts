import { Appointment } from "@/lib/db/models/appointment.model";
import { NextResponse } from "next/server";
import { Service } from '@/lib/db/models/service.model';

export async function GET(req: Request) {
  // إذا كان هناك ?checkServices=true في الرابط، نفذ الفحص
  const url = req ? new URL(req.url) : null;
  if (url && url.searchParams.get('checkServices') === 'true') {
    // جلب جميع serviceId من appointments
    const appointments = await Appointment.find();
    const allServiceIds = appointments.map(a => a.serviceId?.toString()).filter(Boolean);
    // جلب جميع _id من مجموعة الخدمات
    const services = await Service.find({}, '_id');
    const validServiceIds = services.map(s => s._id.toString());
    // إيجاد الـ id غير الموجودة
    const invalidServiceIds = allServiceIds.filter(id => !validServiceIds.includes(id));
    return NextResponse.json({ invalidServiceIds });
  }
  // الكود العادي بدون populate
  try {
    const appointments = await Appointment.find()
      .populate('serviceId', 'name')
      .sort({ createdAt: -1 });
    return NextResponse.json({ appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Error fetching appointments', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const appointmentId = searchParams.get('appointmentId');
    if (!appointmentId) {
      return NextResponse.json(
        { error: 'Appointment ID is required' },
        { status: 400 }
      );
    }

    const data = await req.json();
    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { status: data.status },
      { new: true }
    );

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { error: 'Error updating appointment' },
      { status: 500 }
    );
  }
}
