'use client'

import { useState, useEffect } from 'react'

export default function DebugAuthPage() {
  const [authStatus, setAuthStatus] = useState<any>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token')
    setToken(storedToken)
    
    if (storedToken) {
      // Test token validation
      fetch('/api/auth/validate', {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      })
      .then(res => res.json())
      .then(data => {
        setAuthStatus({
          ...data,
          tokenExists: !!storedToken,
          tokenLength: storedToken?.length,
          httpStatus: data.success ? 200 : 401
        })
      })
      .catch(err => {
        setAuthStatus({
          error: err.message,
          tokenExists: !!storedToken,
          tokenLength: storedToken?.length
        })
      })
    } else {
      setAuthStatus({
        error: 'No token found',
        tokenExists: false
      })
    }
  }, [])

  const testAgentsEndpoint = async () => {
    const storedToken = localStorage.getItem('auth_token')
    if (!storedToken) return
    
    try {
      const response = await fetch('/api/agents', {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      })
      const data = await response.json()
      console.log('Agents API response:', { status: response.status, data })
    } catch (error) {
      console.error('Agents API error:', error)
    }
  }

  const testLogin = async () => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usernameOrEmail: 'test', // Replace with actual credentials
          password: 'test123'      // Replace with actual credentials
        }),
      })
      
      const data = await response.json()
      console.log('Login API response:', { 
        status: response.status, 
        data,
        hasToken: !!data.token,
        tokenPreview: data.token ? `${data.token.substring(0, 20)}...` : null
      })
      
      if (data.token) {
        localStorage.setItem('auth_token', data.token)
        window.location.reload()
      }
    } catch (error) {
      console.error('Login API error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Authentication Debug</h1>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Token Status:</h3>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
              {JSON.stringify({ 
                hasToken: !!token,
                tokenPreview: token ? `${token.substring(0, 20)}...` : null 
              }, null, 2)}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold">Validation Response:</h3>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
              {JSON.stringify(authStatus, null, 2)}
            </pre>
          </div>

          <button
            onClick={testAgentsEndpoint}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mr-4"
          >
            Test Agents API
          </button>

          <button
            onClick={testLogin}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Test Login API
          </button>

          <div>
            <button
              onClick={() => {
                localStorage.removeItem('auth_token')
                window.location.href = '/login'
              }}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Clear Token & Go to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}