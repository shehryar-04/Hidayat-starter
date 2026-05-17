/**
 * Tests for the pre-rendering configuration.
 * Validates that the prerender setup is correctly configured:
 * - main.jsx supports hydration
 * - prerender script exists and has correct structure
 * - package.json has the required scripts
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const ROOT_DIR = join(import.meta.dirname, '..')

describe('Pre-rendering Configuration', () => {
  describe('main.jsx hydration support', () => {
    it('should use hydrateRoot when pre-rendered content exists', () => {
      const mainContent = readFileSync(join(ROOT_DIR, 'src/main.jsx'), 'utf-8')
      expect(mainContent).toContain('hydrateRoot')
    })

    it('should fall back to createRoot for fresh renders', () => {
      const mainContent = readFileSync(join(ROOT_DIR, 'src/main.jsx'), 'utf-8')
      expect(mainContent).toContain('createRoot')
    })

    it('should check hasChildNodes to detect pre-rendered content', () => {
      const mainContent = readFileSync(join(ROOT_DIR, 'src/main.jsx'), 'utf-8')
      expect(mainContent).toContain('hasChildNodes()')
    })
  })

  describe('prerender script', () => {
    it('should exist at scripts/prerender.js', () => {
      expect(existsSync(join(ROOT_DIR, 'scripts/prerender.js'))).toBe(true)
    })

    it('should define static routes for homepage and search', () => {
      const script = readFileSync(join(ROOT_DIR, 'scripts/prerender.js'), 'utf-8')
      expect(script).toContain("'/fatwas'")
      expect(script).toContain("'/fatwas/search'")
    })

    it('should verify meta tags in rendered output', () => {
      const script = readFileSync(join(ROOT_DIR, 'scripts/prerender.js'), 'utf-8')
      expect(script).toContain('meta name="description"')
      expect(script).toContain('og:title')
      expect(script).toContain('application/ld+json')
    })

    it('should verify canonical URL in rendered output', () => {
      const script = readFileSync(join(ROOT_DIR, 'scripts/prerender.js'), 'utf-8')
      expect(script).toContain('rel="canonical"')
    })

    it('should support dynamic routes via prerender manifest', () => {
      const script = readFileSync(join(ROOT_DIR, 'scripts/prerender.js'), 'utf-8')
      expect(script).toContain('prerender-manifest.json')
    })

    it('should use puppeteer with no-sandbox for CI compatibility', () => {
      const script = readFileSync(join(ROOT_DIR, 'scripts/prerender.js'), 'utf-8')
      expect(script).toContain('--no-sandbox')
    })
  })

  describe('manifest generator script', () => {
    it('should exist at scripts/generate-prerender-manifest.js', () => {
      expect(existsSync(join(ROOT_DIR, 'scripts/generate-prerender-manifest.js'))).toBe(true)
    })

    it('should query published fatwas from Supabase', () => {
      const script = readFileSync(join(ROOT_DIR, 'scripts/generate-prerender-manifest.js'), 'utf-8')
      expect(script).toContain("'published'")
      expect(script).toContain('fatwa_questions')
    })

    it('should generate category routes from fatwa data', () => {
      const script = readFileSync(join(ROOT_DIR, 'scripts/generate-prerender-manifest.js'), 'utf-8')
      expect(script).toContain('/fatwas/category/')
    })
  })

  describe('package.json scripts', () => {
    it('should have build:prerender script', () => {
      const pkg = JSON.parse(readFileSync(join(ROOT_DIR, 'package.json'), 'utf-8'))
      expect(pkg.scripts['build:prerender']).toBeDefined()
      expect(pkg.scripts['build:prerender']).toContain('vite build')
      expect(pkg.scripts['build:prerender']).toContain('prerender.js')
    })

    it('should have prerender script', () => {
      const pkg = JSON.parse(readFileSync(join(ROOT_DIR, 'package.json'), 'utf-8'))
      expect(pkg.scripts.prerender).toBeDefined()
    })

    it('should have generate:manifest script', () => {
      const pkg = JSON.parse(readFileSync(join(ROOT_DIR, 'package.json'), 'utf-8'))
      expect(pkg.scripts['generate:manifest']).toBeDefined()
    })

    it('should have puppeteer as a dev dependency', () => {
      const pkg = JSON.parse(readFileSync(join(ROOT_DIR, 'package.json'), 'utf-8'))
      expect(pkg.devDependencies.puppeteer).toBeDefined()
    })
  })
})
