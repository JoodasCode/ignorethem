import { cn } from '../utils'

describe('Utils', () => {
  describe('cn (className utility)', () => {
    it('should merge class names correctly', () => {
      const result = cn('px-4', 'py-2', 'bg-blue-500')
      expect(result).toBe('px-4 py-2 bg-blue-500')
    })

    it('should handle conditional classes', () => {
      const isActive = true
      const isDisabled = false
      
      const result = cn(
        'base-class',
        isActive && 'active-class',
        isDisabled && 'disabled-class'
      )
      
      expect(result).toBe('base-class active-class')
    })

    it('should handle arrays of classes', () => {
      const result = cn(['px-4', 'py-2'], 'bg-blue-500')
      expect(result).toBe('px-4 py-2 bg-blue-500')
    })

    it('should handle objects with boolean values', () => {
      const result = cn({
        'px-4': true,
        'py-2': true,
        'bg-red-500': false,
        'bg-blue-500': true
      })
      
      expect(result).toBe('px-4 py-2 bg-blue-500')
    })

    it('should merge conflicting Tailwind classes correctly', () => {
      // twMerge should handle conflicting classes
      const result = cn('px-4 px-6', 'py-2 py-4')
      
      // Should keep the last conflicting class
      expect(result).toContain('px-6')
      expect(result).toContain('py-4')
      expect(result).not.toContain('px-4')
      expect(result).not.toContain('py-2')
    })

    it('should handle empty inputs', () => {
      expect(cn()).toBe('')
      expect(cn('')).toBe('')
      expect(cn(null)).toBe('')
      expect(cn(undefined)).toBe('')
    })

    it('should handle mixed input types', () => {
      const result = cn(
        'base',
        ['array-class'],
        { 'object-class': true, 'false-class': false },
        'string-class',
        null,
        undefined,
        false && 'conditional-class'
      )
      
      expect(result).toBe('base array-class object-class string-class')
    })

    it('should handle complex Tailwind class merging scenarios', () => {
      // Test responsive classes
      const result1 = cn('text-sm md:text-base', 'text-lg md:text-xl')
      expect(result1).toBe('text-lg md:text-xl')

      // Test hover states
      const result2 = cn('hover:bg-blue-500', 'hover:bg-red-500')
      expect(result2).toBe('hover:bg-red-500')

      // Test different properties
      const result3 = cn('bg-blue-500 text-white', 'bg-red-500 font-bold')
      expect(result3).toBe('text-white bg-red-500 font-bold')
    })

    it('should preserve non-conflicting classes', () => {
      const result = cn(
        'flex items-center justify-center',
        'px-4 py-2',
        'bg-blue-500 text-white',
        'rounded-md shadow-sm'
      )
      
      expect(result).toContain('flex')
      expect(result).toContain('items-center')
      expect(result).toContain('justify-center')
      expect(result).toContain('px-4')
      expect(result).toContain('py-2')
      expect(result).toContain('bg-blue-500')
      expect(result).toContain('text-white')
      expect(result).toContain('rounded-md')
      expect(result).toContain('shadow-sm')
    })

    it('should handle variant-based class merging', () => {
      // Simulate button variant classes
      const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium'
      const primaryVariant = 'bg-blue-600 text-white hover:bg-blue-700'
      const secondaryVariant = 'bg-gray-200 text-gray-900 hover:bg-gray-300'
      
      const primaryButton = cn(baseClasses, primaryVariant)
      const secondaryButton = cn(baseClasses, secondaryVariant)
      
      expect(primaryButton).toContain('bg-blue-600')
      expect(primaryButton).toContain('text-white')
      expect(primaryButton).not.toContain('bg-gray-200')
      
      expect(secondaryButton).toContain('bg-gray-200')
      expect(secondaryButton).toContain('text-gray-900')
      expect(secondaryButton).not.toContain('bg-blue-600')
    })

    it('should handle size-based class merging', () => {
      const baseClasses = 'inline-flex items-center justify-center rounded-md'
      const smallSize = 'h-8 px-3 text-sm'
      const largeSize = 'h-12 px-6 text-lg'
      
      const smallButton = cn(baseClasses, smallSize)
      const largeButton = cn(baseClasses, largeSize)
      
      expect(smallButton).toContain('h-8')
      expect(smallButton).toContain('px-3')
      expect(smallButton).toContain('text-sm')
      
      expect(largeButton).toContain('h-12')
      expect(largeButton).toContain('px-6')
      expect(largeButton).toContain('text-lg')
    })

    it('should handle state-based conditional classes', () => {
      const isLoading = true
      const isDisabled = false
      const hasError = true
      
      const result = cn(
        'button',
        'bg-blue-500 text-white',
        isLoading && 'opacity-50 cursor-not-allowed',
        isDisabled && 'opacity-25 pointer-events-none',
        hasError && 'border-red-500 bg-red-50'
      )
      
      expect(result).toContain('button')
      expect(result).toContain('text-white')
      expect(result).toContain('opacity-50')
      expect(result).toContain('cursor-not-allowed')
      expect(result).toContain('border-red-500')
      expect(result).toContain('bg-red-50')
      expect(result).not.toContain('bg-blue-500') // Should be overridden by error state
      expect(result).not.toContain('opacity-25') // isDisabled is false
    })

    it('should handle dynamic class generation', () => {
      const colors = ['red', 'blue', 'green']
      const sizes = ['sm', 'md', 'lg']
      
      colors.forEach(color => {
        sizes.forEach(size => {
          const result = cn(
            'button',
            `bg-${color}-500`,
            `text-${size}`,
            'hover:opacity-80'
          )
          
          expect(result).toContain('button')
          expect(result).toContain(`bg-${color}-500`)
          expect(result).toContain(`text-${size}`)
          expect(result).toContain('hover:opacity-80')
        })
      })
    })
  })
})