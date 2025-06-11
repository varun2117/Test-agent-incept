import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma, directPrisma, withRetry } from './prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key'
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

export interface AuthUser {
  id: string
  username: string
  email: string
  name?: string
}

export class AuthService {
  /**
   * Hash a password
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
  }

  /**
   * Verify a password
   */
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
  }

  /**
   * Generate JWT token
   */
  static generateToken(user: AuthUser): string {
    return jwt.sign(
      { 
        userId: user.id, 
        username: user.username,
        email: user.email 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return null
    }
  }

  /**
   * Create user session
   */
  static async createSession(userId: string): Promise<string> {
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
    const expiresAt = new Date(Date.now() + SESSION_DURATION)

    await directPrisma.session.create({
      data: {
        userId,
        token,
        expiresAt
      }
    })

    return token
  }

  /**
   * Get user from session token
   */
  static async getUserFromSession(token: string): Promise<AuthUser | null> {
    try {
      const session = await prisma.session.findUnique({
        where: { token },
        include: { user: true }
      })

      if (!session || session.expiresAt < new Date()) {
        // Clean up expired session
        if (session) {
          await prisma.session.delete({ where: { id: session.id } })
        }
        return null
      }

      return {
        id: session.user.id,
        username: session.user.username,
        email: session.user.email,
        name: session.user.name || undefined
      }
    } catch (error) {
      return null
    }
  }

  /**
   * Delete session (logout)
   */
  static async deleteSession(token: string): Promise<void> {
    try {
      await prisma.session.delete({
        where: { token }
      })
    } catch (error) {
      // Session might not exist, ignore error
    }
  }

  /**
   * Clean up expired sessions
   */
  static async cleanupExpiredSessions(): Promise<void> {
    await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    })
  }

  /**
   * Register new user
   */
  static async register(data: {
    username: string
    email: string
    password: string
    name?: string
  }): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    try {
      // Check if user already exists with retry logic
      const existingUser = await withRetry(() => 
        prisma.user.findFirst({
          where: {
            OR: [
              { username: data.username },
              { email: data.email }
            ]
          }
        })
      )

      if (existingUser) {
        return {
          success: false,
          error: existingUser.username === data.username 
            ? 'Username already taken' 
            : 'Email already registered'
        }
      }

      // Hash password
      const hashedPassword = await this.hashPassword(data.password)

      // Create user using direct connection (bypasses pooling)
      const user = await directPrisma.user.create({
        data: {
          username: data.username,
          email: data.email,
          password: hashedPassword,
          name: data.name
        }
      })

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name || undefined
        }
      }
    } catch (error) {
      console.error('AuthService.register error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      }
    }
  }

  /**
   * Login user
   */
  static async login(usernameOrEmail: string, password: string): Promise<{
    success: boolean
    user?: AuthUser
    token?: string
    error?: string
  }> {
    try {
      // Find user by username or email
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { username: usernameOrEmail },
            { email: usernameOrEmail }
          ],
          isActive: true
        }
      })

      if (!user) {
        return {
          success: false,
          error: 'Invalid credentials'
        }
      }

      // Verify password
      const isValidPassword = await this.verifyPassword(password, user.password)
      if (!isValidPassword) {
        return {
          success: false,
          error: 'Invalid credentials'
        }
      }

      // Create session
      const token = await this.createSession(user.id)

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name || undefined
        },
        token
      }
    } catch (error) {
      console.error('AuthService.login error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      }
    }
  }
}