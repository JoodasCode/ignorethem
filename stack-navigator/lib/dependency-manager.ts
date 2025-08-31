import { Template, TechSelections } from './types/template'
import * as semver from 'semver'

/**
 * Dependency management system for package.json generation and version compatibility
 */
export class DependencyManager {
  private compatibilityMatrix: Map<string, PackageCompatibility> = new Map()
  private versionOverrides: Map<string, string> = new Map()

  constructor() {
    this.initializeCompatibilityMatrix()
    this.initializeVersionOverrides()
  }

  /**
   * Generate complete package.json with resolved dependencies
   */
  generatePackageJson(
    projectName: string,
    templates: Template[],
    selections: TechSelections
  ): PackageJsonResult {
    const result: PackageJsonResult = {
      packageJson: this.createBasePackageJson(projectName),
      conflicts: [],
      warnings: [],
      suggestions: []
    }

    // Collect all dependencies from templates
    const allDependencies = this.collectDependencies(templates)
    const allDevDependencies = this.collectDevDependencies(templates)
    const allScripts = this.collectScripts(templates)

    // Resolve version conflicts
    const resolvedDeps = this.resolveDependencyVersions(allDependencies, result)
    const resolvedDevDeps = this.resolveDependencyVersions(allDevDependencies, result)

    // Add framework-specific dependencies
    this.addFrameworkDependencies(resolvedDeps, resolvedDevDeps, selections, result)

    // Validate compatibility
    this.validateDependencyCompatibility(resolvedDeps, result)

    // Apply version overrides
    this.applyVersionOverrides(resolvedDeps)
    this.applyVersionOverrides(resolvedDevDeps)

    // Update package.json
    result.packageJson.dependencies = resolvedDeps
    result.packageJson.devDependencies = resolvedDevDeps
    result.packageJson.scripts = { ...result.packageJson.scripts, ...allScripts }

    // Add peer dependencies if needed
    this.addPeerDependencies(result.packageJson, selections)

    return result
  }

  /**
   * Check version compatibility between packages
   */
  checkVersionCompatibility(
    packageName: string,
    version1: string,
    version2: string
  ): CompatibilityCheck {
    const compatibility = this.compatibilityMatrix.get(packageName)
    
    if (!compatibility) {
      return {
        compatible: true,
        recommendedVersion: this.selectBestVersion(version1, version2),
        reason: 'No compatibility constraints found'
      }
    }

    // Check if versions are compatible
    const isCompatible = this.areVersionsCompatible(
      version1,
      version2,
      compatibility.compatibilityRules
    )

    return {
      compatible: isCompatible,
      recommendedVersion: isCompatible 
        ? this.selectBestVersion(version1, version2)
        : compatibility.recommendedVersion || version2,
      reason: isCompatible 
        ? 'Versions are compatible'
        : `Incompatible versions: ${compatibility.incompatibilityReason || 'Unknown reason'}`
    }
  }

  /**
   * Get latest stable versions for packages
   */
  async getLatestVersions(packages: string[]): Promise<Record<string, string>> {
    // In a real implementation, this would fetch from npm registry
    // For now, return current versions from our compatibility matrix
    const versions: Record<string, string> = {}
    
    for (const pkg of packages) {
      const compatibility = this.compatibilityMatrix.get(pkg)
      versions[pkg] = compatibility?.recommendedVersion || 'latest'
    }

    return versions
  }

  /**
   * Validate that all dependencies are compatible with each other
   */
  validateDependencySet(dependencies: Record<string, string>): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []

    const packages = Object.keys(dependencies)

    for (let i = 0; i < packages.length; i++) {
      for (let j = i + 1; j < packages.length; j++) {
        const pkg1 = packages[i]
        const pkg2 = packages[j]
        
        const conflict = this.checkPackageConflict(pkg1, pkg2, dependencies)
        if (conflict) {
          errors.push(conflict)
        }
      }
    }

    // Check for missing peer dependencies
    for (const [pkg, version] of Object.entries(dependencies)) {
      const missing = this.getMissingPeerDependencies(pkg, dependencies)
      if (missing.length > 0) {
        warnings.push(`${pkg} requires peer dependencies: ${missing.join(', ')}`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    }
  }

  /**
   * Create base package.json structure
   */
  private createBasePackageJson(projectName: string): any {
    return {
      name: this.toKebabCase(projectName),
      version: '0.1.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint',
        'type-check': 'tsc --noEmit'
      },
      dependencies: {},
      devDependencies: {},
      engines: {
        node: '>=18.0.0',
        npm: '>=8.0.0'
      }
    }
  }

  /**
   * Collect all dependencies from templates
   */
  private collectDependencies(templates: Template[]): Record<string, string[]> {
    const dependencies: Record<string, string[]> = {}

    for (const template of templates) {
      for (const [pkg, version] of Object.entries(template.packageDependencies)) {
        if (!dependencies[pkg]) {
          dependencies[pkg] = []
        }
        dependencies[pkg].push(version)
      }
    }

    return dependencies
  }

  /**
   * Collect all dev dependencies from templates
   */
  private collectDevDependencies(templates: Template[]): Record<string, string[]> {
    const devDependencies: Record<string, string[]> = {}

    for (const template of templates) {
      for (const [pkg, version] of Object.entries(template.devDependencies)) {
        if (!devDependencies[pkg]) {
          devDependencies[pkg] = []
        }
        devDependencies[pkg].push(version)
      }
    }

    return devDependencies
  }

  /**
   * Collect all scripts from templates
   */
  private collectScripts(templates: Template[]): Record<string, string> {
    const scripts: Record<string, string> = {}

    for (const template of templates) {
      Object.assign(scripts, template.scripts)
    }

    return scripts
  }

  /**
   * Resolve version conflicts in dependencies
   */
  private resolveDependencyVersions(
    dependencies: Record<string, string[]>,
    result: PackageJsonResult
  ): Record<string, string> {
    const resolved: Record<string, string> = {}

    for (const [pkg, versions] of Object.entries(dependencies)) {
      if (versions.length === 1) {
        resolved[pkg] = versions[0]
      } else {
        // Multiple versions - need to resolve conflict
        const resolution = this.resolveVersionConflict(pkg, versions)
        resolved[pkg] = resolution.version

        if (resolution.hasConflict) {
          result.conflicts.push({
            package: pkg,
            conflictingVersions: versions,
            resolvedVersion: resolution.version,
            reason: resolution.reason
          })
        }

        if (resolution.warning) {
          result.warnings.push(resolution.warning)
        }
      }
    }

    return resolved
  }

  /**
   * Resolve version conflict for a single package
   */
  private resolveVersionConflict(
    packageName: string,
    versions: string[]
  ): VersionResolution {
    const compatibility = this.compatibilityMatrix.get(packageName)
    
    // Strategy 1: Use recommended version if available
    if (compatibility?.recommendedVersion) {
      return {
        version: compatibility.recommendedVersion,
        hasConflict: true,
        reason: 'Used recommended version to resolve conflict'
      }
    }

    // Strategy 2: Find compatible range
    const compatibleVersion = this.findCompatibleVersion(versions)
    if (compatibleVersion) {
      return {
        version: compatibleVersion,
        hasConflict: false,
        reason: 'Found compatible version range'
      }
    }

    // Strategy 3: Use latest version
    const latestVersion = this.selectBestVersion(...versions)
    return {
      version: latestVersion,
      hasConflict: true,
      reason: 'Used latest version as fallback',
      warning: `Version conflict for ${packageName}: ${versions.join(', ')}. Using ${latestVersion}.`
    }
  }

  /**
   * Find a version that satisfies all version ranges
   */
  private findCompatibleVersion(versions: string[]): string | null {
    // Sort versions by semver
    const sortedVersions = versions.sort((a, b) => {
      try {
        return semver.compare(semver.coerce(a)?.version || a, semver.coerce(b)?.version || b)
      } catch {
        return a.localeCompare(b)
      }
    })

    // For now, return the highest version
    // In a real implementation, this would check if all ranges are satisfied
    return sortedVersions[sortedVersions.length - 1]
  }

  /**
   * Select the best version from multiple options
   */
  private selectBestVersion(...versions: string[]): string {
    // Filter out invalid versions
    const validVersions = versions.filter(v => {
      try {
        return semver.valid(semver.coerce(v))
      } catch {
        return false
      }
    })

    if (validVersions.length === 0) {
      return versions[0] // Return first version as fallback
    }

    // Return highest valid version
    return validVersions.sort((a, b) => {
      const versionA = semver.coerce(a)?.version || a
      const versionB = semver.coerce(b)?.version || b
      return semver.compare(versionB, versionA) // Descending order
    })[0]
  }

  /**
   * Add framework-specific dependencies
   */
  private addFrameworkDependencies(
    dependencies: Record<string, string>,
    devDependencies: Record<string, string>,
    selections: TechSelections,
    result: PackageJsonResult
  ): void {
    // Next.js specific dependencies
    if (selections.framework === 'nextjs') {
      dependencies['next'] = dependencies['next'] || '^14.0.0'
      dependencies['react'] = dependencies['react'] || '^18.0.0'
      dependencies['react-dom'] = dependencies['react-dom'] || '^18.0.0'
      
      devDependencies['@types/node'] = devDependencies['@types/node'] || '^20.0.0'
      devDependencies['@types/react'] = devDependencies['@types/react'] || '^18.0.0'
      devDependencies['@types/react-dom'] = devDependencies['@types/react-dom'] || '^18.0.0'
      devDependencies['typescript'] = devDependencies['typescript'] || '^5.0.0'
    }

    // UI library dependencies
    if (selections.ui === 'shadcn') {
      dependencies['@radix-ui/react-slot'] = '^1.0.0'
      dependencies['class-variance-authority'] = '^0.7.0'
      dependencies['clsx'] = '^2.0.0'
      dependencies['tailwind-merge'] = '^2.0.0'
      dependencies['lucide-react'] = '^0.300.0'
      
      devDependencies['tailwindcss'] = '^3.3.0'
      devDependencies['autoprefixer'] = '^10.4.0'
      devDependencies['postcss'] = '^8.4.0'
    }
  }

  /**
   * Validate compatibility between dependencies
   */
  private validateDependencyCompatibility(
    dependencies: Record<string, string>,
    result: PackageJsonResult
  ): void {
    // Check React version compatibility
    const reactVersion = dependencies['react']
    const nextVersion = dependencies['next']
    
    if (reactVersion && nextVersion) {
      const reactMajor = semver.major(semver.coerce(reactVersion) || '0.0.0')
      const nextMajor = semver.major(semver.coerce(nextVersion) || '0.0.0')
      
      if (nextMajor >= 14 && reactMajor < 18) {
        result.warnings.push('Next.js 14+ requires React 18+')
      }
    }

    // Check TypeScript compatibility
    const tsVersion = dependencies['typescript'] || result.packageJson.devDependencies?.typescript
    if (tsVersion) {
      const tsMajor = semver.major(semver.coerce(tsVersion) || '0.0.0')
      if (tsMajor < 5) {
        result.suggestions.push('Consider upgrading to TypeScript 5+ for better performance')
      }
    }
  }

  /**
   * Apply version overrides for known compatibility issues
   */
  private applyVersionOverrides(dependencies: Record<string, string>): void {
    for (const [pkg, version] of Array.from(this.versionOverrides.entries())) {
      if (dependencies[pkg]) {
        dependencies[pkg] = version
      }
    }
  }

  /**
   * Add peer dependencies if needed
   */
  private addPeerDependencies(packageJson: any, selections: TechSelections): void {
    // This would add peerDependencies section if any packages require it
    // For now, we'll skip this as most modern packages handle peer deps automatically
  }

  /**
   * Check if two packages have conflicts
   */
  private checkPackageConflict(
    pkg1: string,
    pkg2: string,
    dependencies: Record<string, string>
  ): string | null {
    const conflicts = [
      // React Router conflicts
      { packages: ['react-router-dom', '@reach/router'], reason: 'Both provide routing functionality' },
      // CSS framework conflicts
      { packages: ['tailwindcss', 'bootstrap'], reason: 'CSS framework conflict' },
      // State management conflicts
      { packages: ['redux', 'zustand', 'jotai'], reason: 'Multiple state management libraries' }
    ]

    for (const conflict of conflicts) {
      if (conflict.packages.includes(pkg1) && conflict.packages.includes(pkg2)) {
        return `Conflict between ${pkg1} and ${pkg2}: ${conflict.reason}`
      }
    }

    return null
  }

  /**
   * Get missing peer dependencies for a package
   */
  private getMissingPeerDependencies(
    packageName: string,
    dependencies: Record<string, string>
  ): string[] {
    const peerDeps = this.getPeerDependencies(packageName)
    return peerDeps.filter(peer => !dependencies[peer])
  }

  /**
   * Get peer dependencies for a package
   */
  private getPeerDependencies(packageName: string): string[] {
    const peerDependencies: Record<string, string[]> = {
      '@radix-ui/react-slot': ['react', 'react-dom'],
      'lucide-react': ['react'],
      'class-variance-authority': [],
      'tailwind-merge': ['tailwindcss']
    }

    return peerDependencies[packageName] || []
  }

  /**
   * Check if versions are compatible based on rules
   */
  private areVersionsCompatible(
    version1: string,
    version2: string,
    rules: CompatibilityRule[]
  ): boolean {
    for (const rule of rules) {
      if (!this.checkCompatibilityRule(version1, version2, rule)) {
        return false
      }
    }
    return true
  }

  /**
   * Check a single compatibility rule
   */
  private checkCompatibilityRule(
    version1: string,
    version2: string,
    rule: CompatibilityRule
  ): boolean {
    try {
      const v1 = semver.coerce(version1)
      const v2 = semver.coerce(version2)
      
      if (!v1 || !v2) return true // Skip validation for invalid versions

      switch (rule.type) {
        case 'major':
          return semver.major(v1) === semver.major(v2)
        case 'minor':
          return semver.major(v1) === semver.major(v2) && semver.minor(v1) === semver.minor(v2)
        case 'exact':
          return semver.eq(v1, v2)
        default:
          return true
      }
    } catch {
      return true // Skip validation on error
    }
  }

  /**
   * Convert string to kebab-case
   */
  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase()
  }

  /**
   * Initialize compatibility matrix with known package compatibility rules
   */
  private initializeCompatibilityMatrix(): void {
    this.compatibilityMatrix.set('react', {
      packageName: 'react',
      recommendedVersion: '^18.2.0',
      compatibilityRules: [
        { type: 'major', description: 'React major versions must match' }
      ],
      incompatibilityReason: 'React versions must be compatible across all packages'
    })

    this.compatibilityMatrix.set('next', {
      packageName: 'next',
      recommendedVersion: '^14.0.0',
      compatibilityRules: [
        { type: 'major', description: 'Next.js major versions should match' }
      ]
    })

    this.compatibilityMatrix.set('typescript', {
      packageName: 'typescript',
      recommendedVersion: '^5.0.0',
      compatibilityRules: []
    })
  }

  /**
   * Initialize version overrides for known compatibility issues
   */
  private initializeVersionOverrides(): void {
    // Override versions for known compatibility issues
    this.versionOverrides.set('react', '^18.2.0')
    this.versionOverrides.set('react-dom', '^18.2.0')
    this.versionOverrides.set('@types/react', '^18.2.0')
    this.versionOverrides.set('@types/react-dom', '^18.2.0')
  }
}

// Types for dependency management
interface PackageCompatibility {
  packageName: string
  recommendedVersion?: string
  compatibilityRules: CompatibilityRule[]
  incompatibilityReason?: string
}

interface CompatibilityRule {
  type: 'major' | 'minor' | 'exact'
  description: string
}

interface CompatibilityCheck {
  compatible: boolean
  recommendedVersion: string
  reason: string
}

interface VersionResolution {
  version: string
  hasConflict: boolean
  reason: string
  warning?: string
}

interface PackageJsonResult {
  packageJson: any
  conflicts: DependencyConflict[]
  warnings: string[]
  suggestions: string[]
}

interface DependencyConflict {
  package: string
  conflictingVersions: string[]
  resolvedVersion: string
  reason: string
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

export const dependencyManager = new DependencyManager()