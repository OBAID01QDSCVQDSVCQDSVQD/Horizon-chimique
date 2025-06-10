import { NextResponse } from 'next/server';
import { Service } from '@/lib/db/models/service.model';
import '@/lib/db/mongoose';

export async function GET() {
  try {
    const services = await Service.find({}).sort({ name: 1 });
    return NextResponse.json(services);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la récupération des services.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const service = await Service.create(body);
    return NextResponse.json(service);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la création du service.' }, { status: 500 });
  }
} 