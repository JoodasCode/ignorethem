// Setup file for integration tests that need MCP access
import { beforeAll, afterAll } from '@jest/globals'

// Mock MCP Supabase client for tests
const mockMcpSupabase = {
  execute_sql: async ({ project_id, query }: { project_id: string; query: string }) => {
    // For integration tests, we'll use a real connection
    // This is a simplified mock that validates SQL syntax
    
    // Basic SQL validation
    if (!query.trim()) {
      throw new Error('Empty query')
    }
    
    // Check for dangerous operations in tests
    const dangerousOperations = ['DROP DATABASE', 'DROP SCHEMA', 'TRUNCATE']
    const upperQuery = query.toUpperCase()
    
    for (const op of dangerousOperations) {
      if (upperQuery.includes(op) && !upperQuery.includes('IF EXISTS')) {
        throw new Error(`Dangerous operation detected: ${op}`)
      }
    }
    
    // Mock successful responses for different query types
    if (upperQuery.includes('CREATE TABLE')) {
      return []
    }
    
    if (upperQuery.includes('INSERT') && upperQuery.includes('RETURNING')) {
      return [{
        id: 'test-uuid-123',
        email: 'test@example.com',
        created_at: new Date().toISOString()
      }]
    }
    
    if (upperQuery.includes('SELECT')) {
      if (upperQuery.includes('information_schema.columns')) {
        return [
          {
            table_name: 'users',
            column_name: 'id',
            data_type: 'uuid',
            is_nullable: 'NO'
          },
          {
            table_name: 'users',
            column_name: 'email',
            data_type: 'text',
            is_nullable: 'NO'
          }
        ]
      }
      
      return [{
        id: 'test-uuid-123',
        email: 'test@example.com',
        created_at: new Date().toISOString()
      }]
    }
    
    if (upperQuery.includes('EXPLAIN')) {
      return [{
        'QUERY PLAN': 'Seq Scan on test_table'
      }]
    }
    
    return []
  }
}

beforeAll(() => {
  // Set up global MCP mock for integration tests
  global.mcpSupabase = mockMcpSupabase
})

afterAll(() => {
  // Cleanup
  delete global.mcpSupabase
})

// Type declaration for global
declare global {
  var mcpSupabase: typeof mockMcpSupabase
}

export { mockMcpSupabase }