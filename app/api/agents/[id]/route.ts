import { NextRequest, NextResponse } from 'next/server';
import { getAgentById } from '@/lib/agents';
import { openai } from '@/lib/openai';
import { prisma } from '@/lib/prisma';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { message, conversation = [], model: modelFromBody } = await request.json();
    
    // Get model from query params or request body, with fallback to default
    const url = new URL(request.url);
    const modelFromQuery = url.searchParams.get('model');
    const model = modelFromQuery || modelFromBody || 'openai/gpt-4o-mini';
    
    // Get API key from different sources
    let apiKey = null;
    
    // 1. Check for API key in Authorization header (for external integrations)
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      apiKey = authHeader.replace('Bearer ', '');
    }
    
    // 2. Check for API key in custom header
    if (!apiKey) {
      apiKey = request.headers.get('x-api-key');
    }
    
    // 3. Check for API key in query parameters
    if (!apiKey) {
      apiKey = url.searchParams.get('api_key');
    }
    
    // 4. If no API key provided via headers/params, try to get from database
    if (!apiKey) {
      // Try to get provider-specific key, fallback to openrouter
      const provider = url.searchParams.get('provider') || 'openrouter';
      
      // Try to get from authenticated user first
      const token = request.headers.get('auth-token');
      let userId = null;
      
      if (token) {
        try {
          const { AuthService } = await import('@/lib/auth');
          const user = await AuthService.getUserFromSession(token);
          if (user) {
            userId = user.id;
          }
        } catch (error) {
          // Continue without authentication
        }
      }
      
      // If no user, try default system user
      if (!userId) {
        userId = 'default-user';
      }
      
      const storedApiKey = await prisma.apiKey.findFirst({
        where: {
          userId: userId,
          provider: provider,
          isActive: true
        }
      });
      
      if (storedApiKey) {
        apiKey = storedApiKey.keyValue;
      }
    }
    
    if (!apiKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: `No API key provided. Please provide via Authorization header, x-api-key header, api_key query parameter, or configure one in settings.` 
        },
        { status: 401, headers: corsHeaders }
      );
    }

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get the agent configuration (static or custom)
    let agent = getAgentById(params.id);
    
    if (!agent) {
      // Try to find custom agent in database
      const customAgent = await prisma.agent.findUnique({
        where: { 
          id: params.id,
          isActive: true 
        }
      });

      if (customAgent) {
        agent = {
          id: customAgent.id,
          name: customAgent.name,
          role: customAgent.role,
          description: customAgent.description,
          personality: customAgent.personality,
          expertise: JSON.parse(customAgent.expertise),
          systemPrompt: customAgent.systemPrompt,
          avatar: customAgent.avatar,
          color: customAgent.color,
          restrictions: customAgent.restrictions ? JSON.parse(customAgent.restrictions) : [],
          examples: JSON.parse(customAgent.examples)
        };
      }
    }

    if (!agent) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Build conversation history
    const messages = [
      { role: 'system' as const, content: agent.systemPrompt },
      ...conversation.slice(-10), // Keep last 10 messages for context
      { role: 'user' as const, content: message }
    ];

    // Get response from OpenRouter
    const response = await openai.createChatCompletion({
      messages,
      model,
      temperature: 0.7,
      maxTokens: 400,
      apiKey,
    });

    if (!response.success) {
      return NextResponse.json(
        { success: false, error: response.error },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json({
      success: true,
      message: response.message,
      agent: {
        id: agent.id,
        name: agent.name,
        role: agent.role,
        avatar: agent.avatar
      },
      usage: response.usage
    }, {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the agent configuration (static or custom)
    let agent = getAgentById(params.id);
    
    if (!agent) {
      // Try to find custom agent in database
      const customAgent = await prisma.agent.findUnique({
        where: { 
          id: params.id,
          isActive: true 
        }
      });

      if (customAgent) {
        agent = {
          id: customAgent.id,
          name: customAgent.name,
          role: customAgent.role,
          description: customAgent.description,
          personality: customAgent.personality,
          expertise: JSON.parse(customAgent.expertise),
          systemPrompt: customAgent.systemPrompt,
          avatar: customAgent.avatar,
          color: customAgent.color,
          restrictions: customAgent.restrictions ? JSON.parse(customAgent.restrictions) : [],
          examples: JSON.parse(customAgent.examples)
        };
      }
    }

    if (!agent) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        role: agent.role,
        description: agent.description,
        expertise: agent.expertise,
        avatar: agent.avatar,
        color: agent.color,
        examples: agent.examples
      }
    }, {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Agent info API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}