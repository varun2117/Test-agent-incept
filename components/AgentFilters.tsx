'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Grid, List, Star } from 'lucide-react'

interface AgentFiltersProps {
  agents: any[]
  onFilter: (filteredAgents: any[]) => void
}

export default function AgentFilters({ agents, onFilter }: AgentFiltersProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('name')

  const categories = [
    'all',
    'static', // Built-in agents
    'custom', // User-created agents
    'public', // Public custom agents
    'security',
    'business',
    'creative',
    'technical',
    'educational'
  ]

  useEffect(() => {
    let filtered = [...agents]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(agent => 
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.expertise.some((skill: string) => 
          skill.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Category filter
    if (selectedCategory !== 'all') {
      switch (selectedCategory) {
        case 'static':
          filtered = filtered.filter(agent => !agent.isCustom)
          break
        case 'custom':
          filtered = filtered.filter(agent => agent.isCustom && agent.canDelete)
          break
        case 'public':
          filtered = filtered.filter(agent => agent.isCustom && !agent.canDelete)
          break
        case 'security':
          filtered = filtered.filter(agent => 
            agent.expertise.some((skill: string) => 
              skill.toLowerCase().includes('security') ||
              skill.toLowerCase().includes('penetration') ||
              skill.toLowerCase().includes('vulnerability')
            )
          )
          break
        case 'business':
          filtered = filtered.filter(agent => 
            agent.role.toLowerCase().includes('advisor') ||
            agent.role.toLowerCase().includes('analyst') ||
            agent.role.toLowerCase().includes('consultant') ||
            agent.expertise.some((skill: string) => 
              skill.toLowerCase().includes('business') ||
              skill.toLowerCase().includes('finance') ||
              skill.toLowerCase().includes('strategy')
            )
          )
          break
        case 'creative':
          filtered = filtered.filter(agent => 
            agent.role.toLowerCase().includes('creative') ||
            agent.role.toLowerCase().includes('designer') ||
            agent.role.toLowerCase().includes('writer') ||
            agent.expertise.some((skill: string) => 
              skill.toLowerCase().includes('design') ||
              skill.toLowerCase().includes('creative') ||
              skill.toLowerCase().includes('content')
            )
          )
          break
        case 'technical':
          filtered = filtered.filter(agent => 
            agent.role.toLowerCase().includes('engineer') ||
            agent.role.toLowerCase().includes('developer') ||
            agent.role.toLowerCase().includes('scientist') ||
            agent.expertise.some((skill: string) => 
              skill.toLowerCase().includes('programming') ||
              skill.toLowerCase().includes('data') ||
              skill.toLowerCase().includes('machine learning')
            )
          )
          break
        case 'educational':
          filtered = filtered.filter(agent => 
            agent.role.toLowerCase().includes('teacher') ||
            agent.role.toLowerCase().includes('educator') ||
            agent.role.toLowerCase().includes('trainer')
          )
          break
      }
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'role':
          return a.role.localeCompare(b.role)
        case 'created':
          if (a.isCustom && b.isCustom) {
            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          }
          return a.isCustom ? -1 : 1
        case 'type':
          if (a.isCustom === b.isCustom) {
            return a.name.localeCompare(b.name)
          }
          return a.isCustom ? 1 : -1
        default:
          return 0
      }
    })

    onFilter(filtered)
  }, [searchTerm, selectedCategory, sortBy, agents, onFilter])

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search agents by name, role, or expertise..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          {/* Category Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="name">Sort by Name</option>
            <option value="role">Sort by Role</option>
            <option value="created">Sort by Created</option>
            <option value="type">Sort by Type</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-md">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500'}`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-500'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
        <span>Total: {agents.length}</span>
        <span>Static: {agents.filter(a => !a.isCustom).length}</span>
        <span>Custom: {agents.filter(a => a.isCustom).length}</span>
        <span>Mine: {agents.filter(a => a.canDelete).length}</span>
      </div>
    </div>
  )
}
