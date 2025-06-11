'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Users, Target, Globe, Key, Plus, Trash2, User } from 'lucide-react'
import Link from 'next/link'
import { getAllAgents } from '@/lib/agents'
import type { ChatAgent } from '@/lib/agents'
import ApiKeySidebar from '@/components/ApiKeySidebar'
import AddAgentModal from '@/components/AddAgentModal'
import toast from 'react-hot-toast'

interface ExtendedChatAgent extends ChatAgent {
  isCustom?: boolean
  canDelete?: boolean
  createdBy?: string
}

export default function Home() {
  const [agents, setAgents] = useState<ExtendedChatAgent[]>([])
  const [isApiSidebarOpen, setIsApiSidebarOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const fetchAgents = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/agents', { headers })
      const data = await response.json()
      if (data.success) {
        setAgents(data.agents)
      } else {
        console.error('Failed to fetch agents:', data.error)
        // Fallback to static agents
        setAgents(getAllAgents().map(agent => ({ ...agent, isCustom: false, canDelete: false })))
      }
    } catch (error) {
      console.error('Error fetching agents:', error)
      // Fallback to static agents
      setAgents(getAllAgents().map(agent => ({ ...agent, isCustom: false, canDelete: false })))
    }
  }

  const handleDeleteAgent = async (agentId: string, agentName: string) => {
    if (!confirm(`Are you sure you want to delete "${agentName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/agents?id=${agentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success('Agent deleted successfully')
        fetchAgents() // Refresh the list
      } else {
        toast.error(data.error || 'Failed to delete agent')
      }
    } catch (error) {
      toast.error('Failed to delete agent')
    }
  }

  useEffect(() => {
    fetchAgents()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Top Actions Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>{agents.length} Agents Available</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Agent</span>
              </button>
              <button
                onClick={() => setIsApiSidebarOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md transition-colors"
              >
                <Key className="h-4 w-4" />
                <span>API Key</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Diverse Chat Agents for Security Testing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Test your red team capabilities against a variety of AI personalities. 
              Each agent has unique expertise, communication styles, and safety protocols.
            </p>
            <div className="flex justify-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Vulnerability Testing</span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Multiple Personalities</span>
              </div>
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5" />
                <span>Real-time Chat</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Agents Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Available Test Agents</h3>
            <p className="text-gray-600">Each agent represents a different personality and expertise area</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {agents.map((agent, index) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative"
              >
                <div className="agent-card bg-white rounded-xl shadow-md hover:shadow-xl p-6 border border-gray-100 relative">
                  {/* Delete button for custom agents */}
                  {agent.canDelete && (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleDeleteAgent(agent.id, agent.name)
                      }}
                      className="absolute top-3 right-3 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors z-10"
                      title="Delete agent"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}

                  {/* Custom agent indicator */}
                  {agent.isCustom && (
                    <div className="absolute top-3 left-3 flex items-center space-x-1">
                      <div className="flex items-center space-x-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                        <User className="h-3 w-3" />
                        <span>{agent.createdBy || 'Custom'}</span>
                      </div>
                    </div>
                  )}

                  <Link href={`/agents/${agent.id}`} className="block">
                    <div className={`flex items-center mb-4 ${agent.isCustom ? 'mt-8' : ''}`}>
                      <div className={`p-3 rounded-full text-2xl ${agent.color} ${
                        agent.color === 'bg-yellow-500' || agent.color === 'bg-lime-500' || agent.color === 'bg-cyan-500' || agent.color === 'bg-orange-500'
                          ? 'text-gray-900' 
                          : 'text-white'
                      }`}>
                        {agent.avatar}
                      </div>
                      <div className="ml-4">
                        <h4 className="text-lg font-semibold text-gray-900">{agent.name}</h4>
                        <p className="text-sm text-gray-600">{agent.role}</p>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-4 line-clamp-3">{agent.description}</p>
                    
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Expertise:</h5>
                      <div className="flex flex-wrap gap-2">
                        {agent.expertise.slice(0, 3).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                        {agent.expertise.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                            +{agent.expertise.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Click to chat</span>
                      <MessageCircle className="h-5 w-5 text-gray-400" />
                    </div>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* API Information */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-md p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">API Endpoints for Red Team Testing</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Chat with Agents</h4>
                <div className="bg-gray-100 rounded-lg p-4 font-mono text-sm">
                  <div className="text-green-600 mb-2">POST /api/agents/[agent-id]</div>
                  <div className="text-gray-600">
                    {JSON.stringify({
                      message: "Your test message",
                      conversation: []
                    }, null, 2)}
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">List All Agents</h4>
                <div className="bg-gray-100 rounded-lg p-4 font-mono text-sm">
                  <div className="text-blue-600 mb-2">GET /api/agents</div>
                  <div className="text-gray-600">
                    Returns list of all available agents with their configurations
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h5 className="font-medium text-yellow-800 mb-2">⚠️ Security Testing Notice</h5>
              <p className="text-sm text-yellow-700">
                These agents are designed for red team testing and vulnerability assessment. 
                Each agent has built-in safety protocols and restrictions. Use responsibly and ethically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            Test Chat Agents Platform - Built for Red Team Security Testing
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Use responsibly and ethically. Each agent maintains safety protocols and professional boundaries.
          </p>
        </div>
      </footer>

      {/* API Key Sidebar */}
      <ApiKeySidebar 
        isOpen={isApiSidebarOpen} 
        onClose={() => setIsApiSidebarOpen(false)} 
      />

      {/* Add Agent Modal */}
      <AddAgentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAgentAdded={fetchAgents}
      />
    </div>
  )
}