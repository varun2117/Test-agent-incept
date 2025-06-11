'use client'

import { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface AddAgentModalProps {
  isOpen: boolean
  onClose: () => void
  onAgentAdded: () => void
}

export default function AddAgentModal({ isOpen, onClose, onAgentAdded }: AddAgentModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    description: '',
    personality: '',
    expertise: [''],
    systemPrompt: '',
    avatar: '🤖',
    color: 'bg-blue-500',
    restrictions: [''],
    examples: [{ userMessage: '', agentResponse: '' }],
    isPublic: false
  })
  const [isLoading, setIsLoading] = useState(false)

  const colorOptions = [
    'bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-purple-500', 
    'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500', 'bg-gray-500',
    'bg-emerald-500', 'bg-orange-500', 'bg-cyan-500', 'bg-lime-500'
  ]

  const emojiOptions = [
    '🤖', '👨‍💼', '👩‍💼', '👨‍🏫', '👩‍🏫', '👨‍🔬', '👩‍🔬', 
    '👨‍⚕️', '👩‍⚕️', '👨‍💻', '👩‍💻', '👨‍🎨', '👩‍🎨', '👨‍🍳', 
    '👩‍🍳', '👨‍🔧', '👩‍🔧', '💪', '🧠', '📚', '⚖️', '🎯'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.role.trim() || !formData.description.trim() || !formData.systemPrompt.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    const filteredExpertise = formData.expertise.filter(item => item.trim())
    const filteredRestrictions = formData.restrictions.filter(item => item.trim())
    const filteredExamples = formData.examples.filter(ex => ex.userMessage.trim() && ex.agentResponse.trim())

    if (filteredExpertise.length === 0) {
      toast.error('Please add at least one expertise area')
      return
    }

    if (filteredExamples.length === 0) {
      toast.error('Please add at least one example conversation')
      return
    }

    setIsLoading(true)

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          expertise: filteredExpertise,
          restrictions: filteredRestrictions,
          examples: filteredExamples
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success('Agent created successfully!')
        onAgentAdded()
        onClose()
        setFormData({
          name: '',
          role: '',
          description: '',
          personality: '',
          expertise: [''],
          systemPrompt: '',
          avatar: '🤖',
          color: 'bg-blue-500',
          restrictions: [''],
          examples: [{ userMessage: '', agentResponse: '' }],
          isPublic: false
        })
      } else {
        toast.error(data.error || 'Failed to create agent')
      }
    } catch (error) {
      toast.error('Failed to create agent')
    } finally {
      setIsLoading(false)
    }
  }

  const addExpertise = () => {
    setFormData(prev => ({
      ...prev,
      expertise: [...prev.expertise, '']
    }))
  }

  const removeExpertise = (index: number) => {
    setFormData(prev => ({
      ...prev,
      expertise: prev.expertise.filter((_, i) => i !== index)
    }))
  }

  const updateExpertise = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      expertise: prev.expertise.map((item, i) => i === index ? value : item)
    }))
  }

  const addRestriction = () => {
    setFormData(prev => ({
      ...prev,
      restrictions: [...prev.restrictions, '']
    }))
  }

  const removeRestriction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      restrictions: prev.restrictions.filter((_, i) => i !== index)
    }))
  }

  const updateRestriction = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      restrictions: prev.restrictions.map((item, i) => i === index ? value : item)
    }))
  }

  const addExample = () => {
    setFormData(prev => ({
      ...prev,
      examples: [...prev.examples, { userMessage: '', agentResponse: '' }]
    }))
  }

  const removeExample = (index: number) => {
    setFormData(prev => ({
      ...prev,
      examples: prev.examples.filter((_, i) => i !== index)
    }))
  }

  const updateExample = (index: number, field: 'userMessage' | 'agentResponse', value: string) => {
    setFormData(prev => ({
      ...prev,
      examples: prev.examples.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Create New Agent</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agent Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Dr. Sarah Chen"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <input
                type="text"
                required
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Chemistry Teacher"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="High school chemistry teacher with 15 years of experience"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Personality
            </label>
            <textarea
              value={formData.personality}
              onChange={(e) => setFormData(prev => ({ ...prev, personality: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Patient, enthusiastic, safety-conscious, loves making chemistry accessible"
            />
          </div>

          {/* Avatar and Color */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Avatar
              </label>
              <div className="grid grid-cols-6 gap-2">
                {emojiOptions.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, avatar: emoji }))}
                    className={`p-2 text-2xl border rounded-lg hover:bg-gray-50 ${
                      formData.avatar === emoji ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color Theme
              </label>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                    className={`w-10 h-10 rounded-lg ${color} border-2 ${
                      formData.color === color ? 'border-gray-800' : 'border-gray-300'
                    }`}
                  />
                ))}
              </div>
              
              {/* Preview */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview
                </label>
                <div className={`inline-flex p-3 rounded-full text-2xl ${formData.color} ${
                  formData.color === 'bg-yellow-500' || formData.color === 'bg-lime-500' || formData.color === 'bg-cyan-500' || formData.color === 'bg-orange-500'
                    ? 'text-gray-900' 
                    : 'text-white'
                }`}>
                  {formData.avatar}
                </div>
              </div>
            </div>
          </div>

          {/* Expertise */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expertise Areas *
            </label>
            {formData.expertise.map((expertise, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={expertise}
                  onChange={(e) => updateExpertise(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Organic Chemistry"
                />
                {formData.expertise.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExpertise(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addExpertise}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>Add Expertise</span>
            </button>
          </div>

          {/* System Prompt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              System Prompt *
            </label>
            <textarea
              required
              value={formData.systemPrompt}
              onChange={(e) => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={6}
              placeholder="You are Dr. Sarah Chen, an experienced high school chemistry teacher..."
            />
          </div>

          {/* Restrictions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Safety Restrictions
            </label>
            {formData.restrictions.map((restriction, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={restriction}
                  onChange={(e) => updateRestriction(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="No instructions for dangerous experiments"
                />
                {formData.restrictions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRestriction(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addRestriction}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>Add Restriction</span>
            </button>
          </div>

          {/* Examples */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Example Conversations *
            </label>
            {formData.examples.map((example, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Example {index + 1}</span>
                  {formData.examples.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExample(index)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">User Message</label>
                    <textarea
                      value={example.userMessage}
                      onChange={(e) => updateExample(index, 'userMessage', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="How do I make a volcano for my science project?"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Agent Response</label>
                    <textarea
                      value={example.agentResponse}
                      onChange={(e) => updateExample(index, 'agentResponse', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Great question! A baking soda volcano is a classic and safe demonstration..."
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addExample}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>Add Example</span>
            </button>
          </div>

          {/* Public Option */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={formData.isPublic}
              onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isPublic" className="text-sm text-gray-700">
              Make this agent public (other users can see and use it)
            </label>
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating...' : 'Create Agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}