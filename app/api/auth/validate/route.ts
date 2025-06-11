import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      )
    }

    const user = await AuthService.getUserFromSession(token)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name
      }
    })

  } catch (error) {
    console.error('Token validation error:', error)
    return NextResponse.json(
      { success: false, error: 'Token validation failed' },
      { status: 500 }
    )
  }
}