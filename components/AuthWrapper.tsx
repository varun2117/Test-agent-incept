'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface AuthWrapperProps {
  children: React.ReactNode
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isValidating, setIsValidating] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const publicRoutes = ['/login', '/signup', '/debug-auth']
  const isPublicRoute = publicRoutes.includes(pathname)

  useEffect(() => {
    const validateAuth = async () => {
      const token = localStorage.getItem('auth_token')
      
      if (!token) {
        setIsAuthenticated(false)
        setIsValidating(false)
        if (!isPublicRoute) {
          router.push('/login')
        }
        return
      }

      // Validate token with server
      try {
        const response = await fetch('/api/auth/validate', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          setIsAuthenticated(true)
          if (isPublicRoute) {
            router.push('/')
          }
        } else {
          localStorage.removeItem('auth_token')
          setIsAuthenticated(false)
          if (!isPublicRoute) {
            router.push('/login')
          }
        }
      } catch (error) {
        localStorage.removeItem('auth_token')
        setIsAuthenticated(false)
        if (!isPublicRoute) {
          router.push('/login')
        }
      } finally {
        setIsValidating(false)
      }
    }

    validateAuth()
  }, [pathname, router, isPublicRoute])

  // Show loading state while validating auth
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <div className="text-gray-700 text-lg">Loading...</div>
        </div>
      </div>
    )
  }

  // Don't render protected content if not authenticated (except public routes)
  if (!isAuthenticated && !isPublicRoute) {
    return null
  }

  return <>{children}</>
}