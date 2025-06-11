import { NextRequest, NextResponse } from 'next/server';
import { getAllAgents } from '@/lib/agents';
import { AuthService } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    let currentUser = null;
    if (token) {
      currentUser = await AuthService.getUserFromSession(token);
    }

    // Get static agents
    const staticAgents = getAllAgents();
    
    // Get custom agents (public ones + user's private ones)
    let customAgents = [];
    if (currentUser) {
      const dbAgents = await prisma.agent.findMany({
        where: {
          isActive: true,
          OR: [
            { isPublic: true },
            { userId: currentUser.id }
          ]
        },
        include: {
          user: {
            select: {
              username: true
            }
          }
        }
      });

      customAgents = dbAgents.map(agent => ({
        id: agent.id,
        name: agent.name,
        role: agent.role,
        description: agent.description,
        expertise: JSON.parse(agent.expertise),
        avatar: agent.avatar,
        color: agent.color,
        examples: JSON.parse(agent.examples),
        isCustom: true,
        createdBy: agent.user.username,
        canDelete: agent.userId === currentUser.id
      }));
    } else {
      // If not authenticated, only show public custom agents
      const dbAgents = await prisma.agent.findMany({
        where: {
          isActive: true,
          isPublic: true
        },
        include: {
          user: {
            select: {
              username: true
            }
          }
        }
      });

      customAgents = dbAgents.map(agent => ({
        id: agent.id,
        name: agent.name,
        role: agent.role,
        description: agent.description,
        expertise: JSON.parse(agent.expertise),
        avatar: agent.avatar,
        color: agent.color,
        examples: JSON.parse(agent.examples),
        isCustom: true,
        createdBy: agent.user.username,
        canDelete: false
      }));
    }
    
    // Combine static and custom agents
    const publicAgents = staticAgents.map(agent => ({
      id: agent.id,
      name: agent.name,
      role: agent.role,
      description: agent.description,
      expertise: agent.expertise,
      avatar: agent.avatar,
      color: agent.color,
      examples: agent.examples,
      isCustom: false,
      canDelete: false
    }));

    const allAgents = [...publicAgents, ...customAgents];

    return NextResponse.json({
      success: true,
      agents: allAgents,
      count: allAgents.length
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

  } catch (error) {
    console.error('Agents list API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const currentUser = await AuthService.getUserFromSession(token);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, role, description, personality, expertise, systemPrompt, avatar, color, restrictions, examples, isPublic } = body;

    // Validation
    if (!name?.trim() || !role?.trim() || !description?.trim() || !systemPrompt?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, role, description, systemPrompt' },
        { status: 400 }
      );
    }

    if (!Array.isArray(expertise) || !Array.isArray(examples)) {
      return NextResponse.json(
        { success: false, error: 'Expertise and examples must be arrays' },
        { status: 400 }
      );
    }

    // Create agent
    const agent = await prisma.agent.create({
      data: {
        userId: currentUser.id,
        name: name.trim(),
        role: role.trim(),
        description: description.trim(),
        personality: personality?.trim() || '',
        expertise: JSON.stringify(expertise),
        systemPrompt: systemPrompt.trim(),
        avatar: avatar || '🤖',
        color: color || 'bg-gray-500',
        restrictions: restrictions ? JSON.stringify(restrictions) : null,
        examples: JSON.stringify(examples),
        isPublic: Boolean(isPublic)
      }
    });

    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        role: agent.role,
        description: agent.description,
        expertise: JSON.parse(agent.expertise),
        avatar: agent.avatar,
        color: agent.color,
        examples: JSON.parse(agent.examples),
        isCustom: true,
        canDelete: true
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

  } catch (error) {
    console.error('Create agent API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create agent' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const currentUser = await AuthService.getUserFromSession(token);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('id');

    if (!agentId) {
      return NextResponse.json(
        { success: false, error: 'Agent ID required' },
        { status: 400 }
      );
    }

    // Check if agent exists and belongs to user
    const agent = await prisma.agent.findUnique({
      where: { id: agentId }
    });

    if (!agent) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      );
    }

    if (agent.userId !== currentUser.id) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to delete this agent' },
        { status: 403 }
      );
    }

    // Delete agent
    await prisma.agent.delete({
      where: { id: agentId }
    });

    return NextResponse.json({
      success: true,
      message: 'Agent deleted successfully'
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

  } catch (error) {
    console.error('Delete agent API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete agent' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}