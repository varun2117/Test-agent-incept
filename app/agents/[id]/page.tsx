'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  Send, 
  MessageCircle, 
  User, 
  Copy, 
  ExternalLink,
  AlertTriangle,
  Info,
  Settings,
  ChevronDown
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { getAgentById } from '@/lib/agents'
import type { ChatAgent } from '@/lib/agents'
import { AVAILABLE_MODELS, getModelById } from '@/lib/openai'
import type { ModelInfo } from '@/lib/openai'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ExtendedChatAgent extends ChatAgent {
  isCustom?: boolean
  canDelete?: boolean
  createdBy?: string
}

export default function AgentChat() {
  const params = useParams()
  const router = useRouter()
  const [agent, setAgent] = useState<ExtendedChatAgent | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showApiInfo, setShowApiInfo] = useState(false)
  const [selectedModel, setSelectedModel] = useState('anthropic/claude-sonnet-4')
  const [showModelSelector, setShowModelSelector] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadAgent = async () => {
      // First try static agents
      let agentData = getAgentById(params.id as string)
      
      if (agentData) {
        setAgent({ ...agentData, isCustom: false, canDelete: false })
      } else {
        // Try to fetch from database (custom agents)
        try {
          const token = localStorage.getItem('auth_token')
          const headers: Record<string, string> = {}
          if (token) {
            headers['Authorization'] = `Bearer ${token}`
          }

          const response = await fetch('/api/agents', { headers })
          const data = await response.json()
          
          if (data.success) {
            const customAgent = data.agents.find((a: any) => a.id === params.id)
            if (customAgent) {
              setAgent(customAgent)
            } else {
              toast.error('Agent not found')
              router.push('/')
              return
            }
          } else {
            toast.error('Failed to load agent')
            router.push('/')
            return
          }
        } catch (error) {
          console.error('Error loading agent:', error)
          toast.error('Failed to load agent')
          router.push('/')
          return
        }
      }
    }

    loadAgent()
  }, [params.id, router])

  useEffect(() => {
    if (agent) {
      // Add welcome message
      setMessages([{
        id: '1',
        role: 'assistant',
        content: `Hello! I'm ${agent.name}, your ${agent.role.toLowerCase()}. ${agent.description} How can I help you today?`,
        timestamp: new Date()
      }])
    }
  }, [agent])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !agent) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch(`/api/agents/${agent.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          model: selectedModel,
          conversation: messages.slice(-6).map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }),
      })

      const data = await response.json()

      if (data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        toast.error('Failed to get response: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      toast.error('Network error. Please try again.')
      console.error('Chat error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const copyApiEndpoint = () => {
    const endpoint = `${window.location.origin}/api/agents/${agent?.id}?model=${selectedModel}`
    navigator.clipboard.writeText(endpoint)
    toast.success('API endpoint copied to clipboard!')
  }

  const tryExample = (example: string) => {
    setInputMessage(example)
  }

  if (!agent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading agent...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Agents</span>
              </Link>
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full text-white ${agent.color}`}>
                  <span className="text-xl">{agent.avatar}</span>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-xl font-semibold text-gray-900">{agent.name}</h1>
                    {agent.isCustom && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                        Custom Agent
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{agent.role}</p>
                  {agent.createdBy && (
                    <p className="text-xs text-gray-500">Created by {agent.createdBy}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Model Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowModelSelector(!showModelSelector)}
                  className="flex items-center space-x-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  <span>{getModelById(selectedModel)?.name || 'Select Model'}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                
                {showModelSelector && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border z-50">
                    <div className="p-2">
                      <div className="text-xs font-medium text-gray-500 mb-2">Recommended Models</div>
                      {AVAILABLE_MODELS.filter(m => m.recommended).map((model) => (
                        <button
                          key={model.id}
                          onClick={() => {
                            setSelectedModel(model.id)
                            setShowModelSelector(false)
                            toast.success(`Switched to ${model.name}`)
                          }}
                          className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 ${
                            selectedModel === model.id ? 'bg-purple-100 text-purple-700' : ''
                          }`}
                        >
                          <div className="font-medium">{model.name}</div>
                          <div className="text-xs text-gray-500">{model.provider} • ${model.pricing.prompt}/${model.pricing.completion}</div>
                        </button>
                      ))}
                      
                      <div className="text-xs font-medium text-gray-500 mt-3 mb-2">Other Models</div>
                      {AVAILABLE_MODELS.filter(m => !m.recommended).map((model) => (
                        <button
                          key={model.id}
                          onClick={() => {
                            setSelectedModel(model.id)
                            setShowModelSelector(false)
                            toast.success(`Switched to ${model.name}`)
                          }}
                          className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 ${
                            selectedModel === model.id ? 'bg-purple-100 text-purple-700' : ''
                          }`}
                        >
                          <div className="font-medium">{model.name}</div>
                          <div className="text-xs text-gray-500">{model.provider} • ${model.pricing.prompt}/${model.pricing.completion}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowApiInfo(!showApiInfo)}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                <span>API</span>
              </button>
              <button
                onClick={copyApiEndpoint}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Copy className="h-4 w-4" />
                <span>Copy Endpoint</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* API Info Panel */}
      <AnimatePresence>
        {showApiInfo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-blue-50 border-b border-blue-200 overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900">API Endpoint</h3>
                  <p className="text-sm text-blue-700 mt-1">Use this endpoint for automated testing:</p>
                  <div className="mt-2 p-3 bg-white rounded border font-mono text-sm">
                    <div className="text-green-600">POST {window.location.origin}/api/agents/{agent.id}?model={selectedModel}</div>
                    <div className="text-gray-500 mt-1 text-xs">✓ API key stored securely in database</div>
                    <div className="mt-2 text-gray-600">
                      {JSON.stringify({ message: "Your test message", conversation: [] }, null, 2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Agent Info */}
          <div className="bg-white border-b p-4">
            <div className="max-w-4xl mx-auto">
              <p className="text-gray-600 mb-3">{agent.description}</p>
              <div className="flex flex-wrap gap-2">
                {agent.expertise.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-4xl mx-auto space-y-4">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-3 max-w-2xl ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : `${agent.color} ${
                            agent.color === 'bg-yellow-500' || agent.color === 'bg-lime-500' || agent.color === 'bg-cyan-500' || agent.color === 'bg-orange-500'
                              ? 'text-gray-900' 
                              : 'text-white'
                          }`
                      }`}>
                        {message.role === 'user' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <span className="text-sm">{agent.avatar}</span>
                        )}
                      </div>
                      <div className={`p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border shadow-sm text-gray-900'
                      }`}>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <p className={`text-xs mt-2 ${
                          message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing Indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex items-start space-x-3 max-w-2xl">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${agent.color} ${
                      agent.color === 'bg-yellow-500' || agent.color === 'bg-lime-500' || agent.color === 'bg-cyan-500' || agent.color === 'bg-orange-500'
                        ? 'text-gray-900' 
                        : 'text-white'
                    }`}>
                      <span className="text-sm">{agent.avatar}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-white border shadow-sm">
                      <div className="typing-indicator">
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="bg-white border-t p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder={`Ask ${agent.name} anything...`}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar with Examples */}
        <div className="w-80 bg-white border-l overflow-y-auto">
          <div className="p-4">
            <h3 className="font-medium text-gray-900 mb-4 flex items-center space-x-2">
              <MessageCircle className="h-4 w-4" />
              <span>Example Questions</span>
            </h3>
            <div className="space-y-3">
              {agent.examples.map((example, idx) => (
                <div key={idx} className="border rounded-lg p-3">
                  <button
                    onClick={() => tryExample(example.userMessage)}
                    className="text-left w-full text-sm text-blue-600 hover:text-blue-800 font-medium mb-2"
                  >
                    "{example.userMessage}"
                  </button>
                  <p className="text-xs text-gray-600">
                    Expected response: {example.agentResponse.substring(0, 100)}...
                  </p>
                </div>
              ))}
            </div>

            {/* Safety Notice */}
            {agent.restrictions && agent.restrictions.length > 0 && (
              <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">Safety Protocols</h4>
                    <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                      {agent.restrictions.map((restriction, idx) => (
                        <li key={idx}>• {restriction}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
