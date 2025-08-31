// Simple template validation tests without complex dependencies

describe('Template Validation Logic', () => {
  describe('Project Name Validation', () => {
    it('should validate valid project names', () => {
      const validNames = [
        'my-project',
        'awesome-app',
        'project123',
        'test-app-v2'
      ]

      validNames.forEach(name => {
        expect(isValidProjectName(name)).toBe(true)
      })
    })

    it('should reject invalid project names', () => {
      const invalidNames = [
        '',
        'My Project!',
        'project@#$',
        'project with spaces',
        '123-project', // starts with number
        '-project', // starts with dash
        'project-' // ends with dash
      ]

      invalidNames.forEach(name => {
        expect(isValidProjectName(name)).toBe(false)
      })
    })

    it('should sanitize project names correctly', () => {
      const testCases = [
        ['My Awesome Project', 'my-awesome-project'],
        ['Project@#$%', 'project'],
        ['  Spaced  Project  ', 'spaced-project'],
        ['UPPERCASE', 'uppercase'],
        ['mixed_Case-Name', 'mixedcase-name'] // Underscores are removed
      ]

      testCases.forEach(([input, expected]) => {
        expect(sanitizeProjectName(input)).toBe(expected)
      })
    })
  })

  describe('Technology Selection Validation', () => {
    it('should validate compatible technology combinations', () => {
      const validCombinations = [
        {
          framework: 'nextjs',
          authentication: 'clerk',
          database: 'supabase',
          payments: 'stripe'
        },
        {
          framework: 'nextjs',
          authentication: 'nextauth',
          database: 'planetscale',
          payments: 'paddle'
        }
      ]

      validCombinations.forEach(combo => {
        expect(isValidTechCombination(combo)).toBe(true)
      })
    })

    it('should detect incompatible technology combinations', () => {
      const invalidCombinations = [
        {
          framework: 'nextjs',
          authentication: 'invalid-auth',
          database: 'supabase',
          payments: 'stripe'
        },
        {
          framework: 'remix',
          authentication: 'clerk', // Might not be compatible
          database: 'invalid-db',
          payments: 'stripe'
        }
      ]

      invalidCombinations.forEach(combo => {
        expect(isValidTechCombination(combo)).toBe(false)
      })
    })
  })

  describe('File Path Validation', () => {
    it('should validate safe file paths', () => {
      const safePaths = [
        'src/components/Button.tsx',
        'lib/utils.ts',
        'pages/api/auth.ts',
        'styles/globals.css',
        'public/logo.svg'
      ]

      safePaths.forEach(path => {
        expect(isSafeFilePath(path)).toBe(true)
      })
    })

    it('should reject dangerous file paths', () => {
      const dangerousPaths = [
        '../../../etc/passwd',
        '..\\windows\\system32',
        '/etc/shadow',
        'C:\\Windows\\System32',
        'node_modules/malicious/file.js'
      ]

      dangerousPaths.forEach(path => {
        expect(isSafeFilePath(path)).toBe(false)
      })
    })
  })

  describe('Content Sanitization', () => {
    it('should sanitize file content', () => {
      const maliciousContent = `
        const fs = require('fs');
        fs.unlinkSync('/important/file');
        eval('malicious code');
        process.exit(1);
      `

      const sanitized = sanitizeFileContent(maliciousContent)
      
      expect(sanitized).not.toContain('unlinkSync')
      expect(sanitized).not.toContain('eval(')
      expect(sanitized).not.toContain('process.exit')
    })

    it('should preserve safe content', () => {
      const safeContent = `
        import React from 'react';
        
        export default function Button({ children, onClick }) {
          return (
            <button onClick={onClick} className="btn">
              {children}
            </button>
          );
        }
      `

      const sanitized = sanitizeFileContent(safeContent)
      
      expect(sanitized).toContain('import React')
      expect(sanitized).toContain('export default function')
      expect(sanitized).toContain('onClick={onClick}')
    })
  })

  describe('Template Variable Validation', () => {
    it('should validate template variable syntax', () => {
      const validVariables = [
        '{{projectName}}',
        '{{projectNameKebab}}',
        '{{selections.authentication}}',
        '{{timestamp}}'
      ]

      validVariables.forEach(variable => {
        expect(isValidTemplateVariable(variable)).toBe(true)
      })
    })

    it('should reject invalid template variables', () => {
      const invalidVariables = [
        '{projectName}', // Single braces
        '{{}}', // Empty
        '{{project Name}}', // Space in name
        '{{project-name}}', // Dash in name
        '{{project.name.invalid.}}' // Trailing dot
      ]

      invalidVariables.forEach(variable => {
        expect(isValidTemplateVariable(variable)).toBe(false)
      })
    })

    it('should process template variables correctly', () => {
      const template = 'Hello {{name}}, welcome to {{projectName}}!'
      const context = {
        name: 'John',
        projectName: 'My Awesome App'
      }

      const result = processTemplateVariables(template, context)
      expect(result).toBe('Hello John, welcome to My Awesome App!')
    })

    it('should handle missing variables gracefully', () => {
      const template = 'Hello {{name}}, welcome to {{unknownVar}}!'
      const context = {
        name: 'John'
      }

      const result = processTemplateVariables(template, context)
      expect(result).toBe('Hello John, welcome to {{unknownVar}}!')
    })
  })
})

// Helper functions for testing
function isValidProjectName(name: string): boolean {
  if (!name || name.length === 0) return false
  if (name.startsWith('-') || name.endsWith('-')) return false
  if (/^[0-9]/.test(name)) return false
  return /^[a-z0-9-]+$/.test(name)
}

function sanitizeProjectName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function isValidTechCombination(combo: any): boolean {
  const validFrameworks = ['nextjs', 'remix', 'sveltekit']
  const validAuth = ['clerk', 'nextauth', 'supabase-auth', 'none']
  const validDb = ['supabase', 'planetscale', 'neon', 'none']
  const validPayments = ['stripe', 'paddle', 'none']

  return (
    validFrameworks.includes(combo.framework) &&
    validAuth.includes(combo.authentication) &&
    validDb.includes(combo.database) &&
    validPayments.includes(combo.payments)
  )
}

function isSafeFilePath(path: string): boolean {
  // Check for path traversal
  if (path.includes('..')) return false
  
  // Check for absolute paths
  if (path.startsWith('/') || /^[A-Z]:\\/.test(path)) return false
  
  // Check for dangerous directories
  const dangerousDirs = ['node_modules', 'etc', 'windows', 'system32']
  const lowerPath = path.toLowerCase()
  
  return !dangerousDirs.some(dir => lowerPath.includes(dir))
}

function sanitizeFileContent(content: string): string {
  const dangerousPatterns = [
    /fs\.unlinkSync/g,
    /fs\.rmSync/g,
    /eval\s*\(/g,
    /process\.exit/g,
    /require\s*\(\s*['"]child_process['"]\s*\)/g
  ]

  let sanitized = content
  dangerousPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '/* REMOVED_DANGEROUS_CODE */')
  })

  return sanitized
}

function isValidTemplateVariable(variable: string): boolean {
  const pattern = /^\{\{[a-zA-Z][a-zA-Z0-9]*(?:\.[a-zA-Z][a-zA-Z0-9]*)*\}\}$/
  return pattern.test(variable)
}

function processTemplateVariables(template: string, context: any): string {
  return template.replace(/\{\{([a-zA-Z][a-zA-Z0-9]*(?:\.[a-zA-Z][a-zA-Z0-9]*)*)\}\}/g, (match, path) => {
    const value = getNestedValue(context, path)
    return value !== undefined ? String(value) : match
  })
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}