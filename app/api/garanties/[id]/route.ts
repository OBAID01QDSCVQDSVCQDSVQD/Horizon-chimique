import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import Garantie from '@/lib/db/models/garantie.model'

type RouteContext = {
  params: Promise<{ id: string }>
}

export const runtime = "nodejs"

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await connectToDatabase()
    const { id } = await context.params

    const garantie = await Garantie.findById(id).lean()
    if (!garantie) {
      return new NextResponse('Garantie not found', { status: 404 })
    }

    return NextResponse.json(garantie)
  } catch (error) {
    console.error('Error fetching garantie:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await connectToDatabase()
    const { id } = await context.params
    const body = await request.json()

    const garantie = await Garantie.findByIdAndUpdate(id, body, { new: true }).lean()
    if (!garantie) {
      return new NextResponse('Garantie not found', { status: 404 })
    }

    return NextResponse.json(garantie)
  } catch (error) {
    console.error('Error updating garantie:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await connectToDatabase()
    const { id } = await context.params

    const garantie = await Garantie.findByIdAndDelete(id).lean()
    if (!garantie) {
      return new NextResponse('Garantie not found', { status: 404 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting garantie:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 