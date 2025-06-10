import { NextResponse } from 'next/server';
import { Appointment } from '@/lib/db/models/appointment.model';
import '@/lib/db/mongoose';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const appointment = await Appointment.create(data);
    return NextResponse.json(appointment);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la création du rendez-vous.' }, { status: 500 });
  }
} 