import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { POST } from '../route'
import { CompareStacksService } from '@/lib/compare-stacks-service'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

// Mock dependencies
vi.mock('@/lib/compare-stacks-service')
vi.mock('@supabase/auth-helpers-nextjs')
vi.mock('next/headers', () => ({
  cookies: vi.fn()
}))

describe('/api/compare/choose', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' }
  const mockSupabase = {
    auth: {
      getUser: vi.fn()
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createRouteHandlerClient).mockReturnValue(mockSupabase as any)
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('POST /api/compare/choose', () => {
    it('should successfully choose a stack without creating project', async () => {
      vi.mocked(CompareStacksService.chooseStackFromComparison).mockResolvedValue({
        success: true,
        projectId: undefined
      })

      const request = new Request('http://localhost:3000/api/compare/choose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stack_id: 'stack-1',
          conversation_id: 'conv-123'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Stack selected successfully')
      expect(data.project_id).toBeUndefined()
      expect(data.next_steps).toEqual({
        generate_project: false,
        continue_conversation: true,
        start_new_conversation: false
      })
      expect(CompareStacksService.chooseStackFromComparison).toHaveBeenCalledWith(
        'stack-1',
        mockUser.id,
        'conv-123',
        undefined
      )
    })

    it('should successfully choose a stack and create project', async () => {
      vi.mocked(CompareStacksService.chooseStackFromComparison).mockResolvedValue({
        success: true,
        projectId: 'project-456'
      })

      const request = new Request('http://localhost:3000/api/compare/choose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stack_id: 'stack-1',
          conversation_id: 'conv-123',
          project_name: 'My New Project'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.project_id).toBe('project-456')
      expect(data.next_steps).toEqual({
        generate_project: true,
        continue_conversation: false,
        start_new_conversation: false
      })
      expect(CompareStacksService.chooseStackFromComparison).toHaveBeenCalledWith(
        'stack-1',
        mockUser.id,
        'conv-123',
        'My New Project'
      )
    })

    it('should handle choosing stack without conversation or project', async () => {
      vi.mocked(CompareStacksService.chooseStackFromComparison).mockResolvedValue({
        success: true,
        projectId: undefined
      })

      const request = new Request('http://localhost:3000/api/compare/choose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stack_id: 'stack-1'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.next_steps).toEqual({
        generate_project: false,
        continue_conversation: false,
        start_new_conversation: true
      })
    })

    it('should return 401 for unauthenticated users', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })

      const request = new Request('http://localhost:3000/api/compare/choose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stack_id: 'stack-1'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })

    it('should return 400 for missing stack_id', async () => {
      const request = new Request('http://localhost:3000/api/compare/choose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('stack_id is required')
    })

    it('should return 400 for service failure', async () => {
      vi.mocked(CompareStacksService.chooseStackFromComparison).mockResolvedValue({
        success: false,
        error: 'Stack not found'
      })

      const request = new Request('http://localhost:3000/api/compare/choose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stack_id: 'invalid-stack'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Stack not found')
    })

    it('should return 404 for stack not found errors', async () => {
      vi.mocked(CompareStacksService.chooseStackFromComparison).mockRejectedValue(
        new Error('Stack with ID invalid-stack not found')
      )

      const request = new Request('http://localhost:3000/api/compare/choose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stack_id: 'invalid-stack'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('not found')
    })

    it('should return 403 for usage limit errors', async () => {
      vi.mocked(CompareStacksService.chooseStackFromComparison).mockRejectedValue(
        new Error('You have reached your project generation limit. Upgrade to Pro for unlimited projects.')
      )

      const request = new Request('http://localhost:3000/api/compare/choose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stack_id: 'stack-1',
          project_name: 'My Project'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toContain('limit')
      expect(data.upgrade_required).toBe(true)
      expect(data.feature).toBe('project_generation')
    })

    it('should return 500 for unexpected errors', async () => {
      vi.mocked(CompareStacksService.chooseStackFromComparison).mockRejectedValue(
        new Error('Database connection failed')
      )

      const request = new Request('http://localhost:3000/api/compare/choose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stack_id: 'stack-1'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should handle authentication errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: null }, 
        error: new Error('Invalid token') 
      })

      const request = new Request('http://localhost:3000/api/compare/choose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stack_id: 'stack-1'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })

    it('should handle malformed JSON gracefully', async () => {
      const request = new Request('http://localhost:3000/api/compare/choose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })
})