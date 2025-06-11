import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { usernameOrEmail, password } = await request.json()

    // Validation
    if (!usernameOrEmail?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Username or email is required' },
        { status: 400 }
      )
    }

    if (!password?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      )
    }

    // Attempt login
    const result = await AuthService.login(usernameOrEmail.trim(), password)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      token: result.token,
      user: {
        id: result.user!.id,
        username: result.user!.username,
        email: result.user!.email,
        name: result.user!.name
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Login failed',
        debug: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}