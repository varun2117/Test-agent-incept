'use client'

import { useState, useEffect } from 'react'
import { Key, X, Check, Eye, EyeOff, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface ApiKeySidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function ApiKeySidebar({ isOpen, onClose }: ApiKeySidebarProps) {
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [isConfigured, setIsConfigured] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Load existing API key from database
    const loadApiKey = async () => {
      try {
        const response = await fetch('/api/keys')
        const data = await response.json()
        
        if (data.success && data.keys.length > 0) {
          const openrouterKey = data.keys.find((key: any) => key.provider === 'openrouter')
          if (openrouterKey) {
            setApiKey('***configured***') // Don't show actual key
            setIsConfigured(true)
            return
          }
        }
        setIsConfigured(false)
      } catch (error) {
        console.error('Failed to load API keys:', error)
        setError('Failed to load API keys from database')
        
        // Fallback to localStorage
        const savedKey = localStorage.getItem('openrouter_api_key')
        if (savedKey) {
          setApiKey(savedKey)
          setIsConfigured(true)
        }
      }
    }
    
    if (isOpen) {
      loadApiKey()
    }
  }, [isOpen])

  const validateApiKey = (key: string): boolean => {
    if (!key.trim()) {
      setError('Please enter an API key')
      return false
    }

    if (!key.startsWith('sk-or-')) {
      setError('Invalid OpenRouter API key format. Key should start with "sk-or-"')
      return false
    }

    setError('')
    return true
  }

  const handleSave = async () => {
    if (!validateApiKey(apiKey)) {
      return
    }

    setIsValidating(true)
    setError('')

    try {
      // First test the API key
      const testResponse = await fetch('/api/test-key', {
        method: 'POST',
        headers: {
          'x-openrouter-api-key': apiKey,
        }
      })

      if (!testResponse.ok) {
        setError('Invalid API key or API key test failed')
        setIsValidating(false)
        return
      }

      // Save to database
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'OpenRouter API Key',
          provider: 'openrouter',
          keyValue: apiKey
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Remove from localStorage since it's now in database
        localStorage.removeItem('openrouter_api_key')
        setIsConfigured(true)
        toast.success('API key saved to database successfully!')
        setApiKey('***configured***')
        onClose()
      } else {
        setError(data.error || 'Failed to save API key to database')
        
        // Fallback: save to localStorage
        localStorage.setItem('openrouter_api_key', apiKey)
        setIsConfigured(true)
        toast.success('API key saved locally as fallback')
      }
    } catch (error) {
      console.error('Error saving API key:', error)
      setError('Failed to save API key. Network error.')
      
      // Fallback: save to localStorage
      localStorage.setItem('openrouter_api_key', apiKey)
      setIsConfigured(true)
      toast.success('API key saved locally as fallback')
    } finally {
      setIsValidating(false)
    }
  }

  const handleClear = async () => {
    try {
      // Get keys from database to find the one to delete
      const response = await fetch('/api/keys')
      const data = await response.json()
      
      if (data.success && data.keys.length > 0) {
        const openrouterKey = data.keys.find((key: any) => key.provider === 'openrouter')
        
        if (openrouterKey) {
          // Delete from database
          await fetch('/api/keys', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ keyId: openrouterKey.id })
          })
        }
      }
      
      setApiKey('')
      setIsConfigured(false)
      setError('')
      localStorage.removeItem('openrouter_api_key')
      toast.success('API key cleared from database')
    } catch (error) {
      setApiKey('')
      setIsConfigured(false)
      setError('')
      localStorage.removeItem('openrouter_api_key')
      toast.success('API key cleared locally')
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 transform transition-transform duration-300">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Key className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">OpenRouter API Key</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-md"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <div className="relative">
                <input
                  id="apiKey"
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value)
                    setError('') // Clear error when user types
                  }}
                  placeholder="sk-or-v1-..."
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              <p className="mb-2">Get your API key from:</p>
              <a 
                href="https://openrouter.ai/keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                openrouter.ai/keys
              </a>
            </div>

            {/* Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleSave}
                disabled={isValidating || !apiKey.trim()}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isValidating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Validating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </button>
              
              <button
                onClick={handleClear}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Clear
              </button>
            </div>

            {/* Status */}
            {isConfigured && !error && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-sm text-green-700">
                    API key configured successfully
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-sm font-medium text-blue-900 mb-2">About OpenRouter</h3>
            <p className="text-xs text-blue-700">
              OpenRouter provides access to multiple AI models including Claude, GPT-4, and Llama. 
              Your API key is stored securely and used to make requests on your behalf.
            </p>
          </div>

          {/* Troubleshooting */}
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h3 className="text-sm font-medium text-yellow-900 mb-2">Troubleshooting</h3>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>• Ensure your API key starts with "sk-or-"</li>
              <li>• Check that your OpenRouter account has credits</li>
              <li>• Verify the key hasn't expired</li>
              <li>• If database save fails, the key will be stored locally</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  )
}
