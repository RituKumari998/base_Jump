import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { address, name } = body

    // Validation
    if (!address || !name) {
      return NextResponse.json(
        { error: 'Wallet address and name are required' },
        { status: 400 }
      )
    }

    // Basic validation for wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      )
    }

    // Validate name length
    if (name.length < 2 || name.length > 100) {
      return NextResponse.json(
        { error: 'Name must be between 2 and 100 characters' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('basejump')
    const collection = db.collection('waitlist')

    // Check if address already exists
    const existingEntry = await collection.findOne({ address: address.toLowerCase() })
    
    if (existingEntry) {
      return NextResponse.json(
        { error: 'This wallet address is already on the waitlist' },
        { status: 409 }
      )
    }

    // Insert the waitlist entry
    const waitlistEntry = {
      address: address.toLowerCase(),
      name: name.trim(),
      joinedAt: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    }

    await collection.insertOne(waitlistEntry)

    return NextResponse.json(
      { 
        success: true, 
        message: 'Successfully joined the waitlist',
        data: {
          address: waitlistEntry.address,
          name: waitlistEntry.name,
          joinedAt: waitlistEntry.joinedAt
        }
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error adding to waitlist:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Optional: GET endpoint to retrieve waitlist count or check if address exists
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')

    const client = await clientPromise
    const db = client.db('basejump')
    const collection = db.collection('waitlist')

    // If address is provided, check if it exists
    if (address) {
      const exists = await collection.findOne({ address: address.toLowerCase() })
      return NextResponse.json({
        exists: !!exists,
        address: address.toLowerCase()
      })
    }

    // Otherwise, return the total count
    const count = await collection.countDocuments()
    return NextResponse.json({ count })

  } catch (error) {
    console.error('Error fetching waitlist data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

