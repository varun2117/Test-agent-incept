'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { LogOut, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Header() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const publicRoutes = ['/login', '/signup']
  const isPublicRoute = publicRoutes.includes(pathname)

  const handleLogout = async () => {
    setIsLoggingOut(true)

    try {
      const token = localStorage.getItem('auth_token')
      
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      }

      localStorage.removeItem('auth_token')
      toast.success('Logged out successfully')
      router.push('/login')
    } catch (error) {
      toast.error('Logout failed')
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (isPublicRoute) {
    return null
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
              <MessageCircle className="h-5 w-5 text-blue-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Test Agents</h1>
          </div>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </div>
    </header>
  )
}