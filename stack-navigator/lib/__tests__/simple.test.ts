import { dependencyManager } from '../dependency-manager'
import { configGenerator } from '../config-generator'

describe('Simple Code Generation Tests', () => {
  it('should create dependency manager instance', () => {
    expect(dependencyManager).toBeDefined()
  })

  it('should create config generator instance', () => {
    expect(configGenerator).toBeDefined()
  })

  it('should check version compatibility', () => {
    const result = dependencyManager.checkVersionCompatibility('react', '^18.0.0', '^18.2.0')
    expect(result).toBeDefined()
    expect(result.compatible).toBeDefined()
    expect(result.recommendedVersion).toBeDefined()
  })

  it('should generate Next.js config', () => {
    const selections = {
      framework: 'nextjs' as const,
      authentication: 'none' as const,
      database: 'none' as const,
      hosting: 'vercel' as const,
      payments: 'none' as const,
      analytics: 'none' as const,
      email: 'none' as const,
      monitoring: 'none' as const,
      ui: 'none' as const
    }

    const configs = configGenerator.generateNextJsConfigs(selections)
    expect(configs).toBeInstanceOf(Array)
    expect(configs.length).toBeGreaterThan(0)
    
    const nextConfig = configs.find(c => c.path === 'next.config.mjs')
    expect(nextConfig).toBeDefined()
    expect(nextConfig?.content).toContain('nextConfig')
  })
})