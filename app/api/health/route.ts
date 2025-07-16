import { NextResponse } from 'next/server'
import { databaseService } from '@/lib/database'

export async function GET() {
  try {
    // Test database connections
    const connections = await databaseService.checkConnectionHealth()
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      connections: {
        mongodb: connections.mongodb,
        supabase: connections.supabase
      },
      status: connections.mongodb && connections.supabase ? 'healthy' : 'partial',
      services: {
        mongodb: connections.mongodb ? 'connected' : 'disconnected',
        supabase: connections.supabase ? 'connected' : 'disconnected'
      }
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
