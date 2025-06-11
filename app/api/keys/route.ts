import { NextRequest, NextResponse } from 'next/server'
import { directPrisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Get stored API keys
export async function GET(request: NextRequest) {
  try {
    // For demo, we'll use a default user. In production, get from session/auth
    const defaultUserId = 'default-user'
    
    const apiKeys = await directPrisma.apiKey.findMany({
      where: { 
        userId: defaultUserId,
        isActive: true 
      },
      select: {
        id: true,
        name: true,
        provider: true,
        isActive: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      success: true,
      keys: apiKeys
    })

  } catch (error) {
    console.error('Error fetching API keys:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch API keys' },
      { status: 500 }
    )
  }
}

// Save new API key
export async function POST(request: NextRequest) {
  try {
    const { name, provider, keyValue } = await request.json()

    if (!name || !provider || !keyValue) {
      return NextResponse.json(
        { success: false, error: 'Name, provider, and keyValue are required' },
        { status: 400 }
      )
    }

    // For demo, we'll use a default user
    const defaultUserId = 'default-user'

    // Create user if doesn't exist
    await directPrisma.user.upsert({
      where: { username: 'default' },
      update: {},
      create: {
        id: defaultUserId,
        username: 'default',
        email: 'default@testagents.local',
        password: 'not-used'
      }
    })

    // Upsert API key (update if exists, create if not)
    const apiKey = await directPrisma.apiKey.upsert({
      where: {
        userId_provider: {
          userId: defaultUserId,
          provider: provider
        }
      },
      update: {
        name,
        keyValue,
        isActive: true
      },
      create: {
        userId: defaultUserId,
        name,
        provider,
        keyValue,
        isActive: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'API key saved successfully',
      keyId: apiKey.id
    })

  } catch (error) {
    console.error('Error saving API key:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save API key' },
      { status: 500 }
    )
  }
}

// Delete API key
export async function DELETE(request: NextRequest) {
  try {
    const { keyId } = await request.json()

    if (!keyId) {
      return NextResponse.json(
        { success: false, error: 'Key ID is required' },
        { status: 400 }
      )
    }

    await directPrisma.apiKey.update({
      where: { id: keyId },
      data: { isActive: false }
    })

    return NextResponse.json({
      success: true,
      message: 'API key deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting API key:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete API key' },
      { status: 500 }
    )
  }
}