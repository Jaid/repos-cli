import {afterEach, beforeEach, describe, expect, test} from 'bun:test'
import os from 'node:os'
import path from 'node:path'

import fs from 'fs-extra'

import Context from '../src/Context.js'

describe('Alt accounts', () => {
  let temporaryFolder: string
  beforeEach(async () => {
    // Create temporary directory structure
    temporaryFolder = path.join(os.tmpdir(), `repos-cli-test-${Date.now()}`)
    await fs.mkdirp(temporaryFolder)
  })
  afterEach(async () => {
    // Clean up
    await fs.remove(temporaryFolder)
  })
  test('getAlt returns empty array when no .as folder exists', async () => {
    const context = new Context({
      asFolder: temporaryFolder,
      configFile: '',
      foreignReposFolder: path.join(temporaryFolder, '.foreign'),
      forksFolder: path.join(temporaryFolder, '.fork'),
      gistFolder: path.join(temporaryFolder, '.gist'),
      githubCloneBackend: 'ssh',
      githubUser: 'MainUser',
      glob: [],
      parent: [],
      reposFolder: temporaryFolder,
      source: [],
    })
    const alts = await context.getAlt()
    expect(alts).toEqual([])
  })
  test('getAlt discovers alts from .as subdirectories', async () => {
    // Create .as directory structure
    const asFolder = path.join(temporaryFolder, '.as')
    await fs.mkdirp(path.join(asFolder, 'Alt1'))
    await fs.mkdirp(path.join(asFolder, 'Alt2'))
    const context = new Context({
      asFolder: temporaryFolder,
      configFile: '',
      foreignReposFolder: path.join(temporaryFolder, '.foreign'),
      forksFolder: path.join(temporaryFolder, '.fork'),
      gistFolder: path.join(temporaryFolder, '.gist'),
      githubCloneBackend: 'ssh',
      githubUser: 'MainUser',
      glob: [],
      parent: [],
      reposFolder: temporaryFolder,
      source: [],
    })
    const alts = await context.getAlt()
    expect(alts.toSorted()).toEqual(['Alt1', 'Alt2'])
  })
  test('getAlt discovers alts automatically', async () => {
  test('getAlt returns specified array when alt is array', async () => {
    const context = new Context({
      alt: ['Alt1', 'Alt2'],
      asFolder: temporaryFolder,
      configFile: '',
      foreignReposFolder: path.join(temporaryFolder, '.foreign'),
      forksFolder: path.join(temporaryFolder, '.fork'),
      gistFolder: path.join(temporaryFolder, '.gist'),
      githubCloneBackend: 'ssh',
      githubUser: 'MainUser',
      glob: [],
      parent: [],
      reposFolder: temporaryFolder,
      source: [],
    })
    const alts = await context.getAlt()
    expect(alts).toEqual(['Alt1', 'Alt2'])
  })
  test('getAlt discovers alts when alt is true', async () => {
    // Create .as directory structure
    const asFolder = path.join(temporaryFolder, '.as')
    await fs.mkdirp(path.join(asFolder, 'AltAccount1'))
    await fs.mkdirp(path.join(asFolder, 'AltAccount2'))
    await fs.mkdirp(path.join(asFolder, 'AltAccount3'))
    const context = new Context({
      alt: true,
      asFolder: temporaryFolder,
      configFile: '',
      foreignReposFolder: path.join(temporaryFolder, '.foreign'),
      forksFolder: path.join(temporaryFolder, '.fork'),
      gistFolder: path.join(temporaryFolder, '.gist'),
      githubCloneBackend: 'ssh',
      githubUser: 'MainUser',
      glob: [],
      parent: [],
      reposFolder: temporaryFolder,
      source: [],
    })
    const alts = await context.getAlt()
    expect(alts.toSorted()).toEqual(['AltAccount1', 'AltAccount2', 'AltAccount3'])
  })
  test('getAlt caches result', async () => {
    const asFolder = path.join(temporaryFolder, '.as')
    await fs.mkdirp(path.join(asFolder, 'InitialAlt'))
    const context = new Context({
      alt: true,
      asFolder: temporaryFolder,
      configFile: '',
      foreignReposFolder: path.join(temporaryFolder, '.foreign'),
      forksFolder: path.join(temporaryFolder, '.fork'),
      gistFolder: path.join(temporaryFolder, '.gist'),
      githubCloneBackend: 'ssh',
      githubUser: 'MainUser',
      glob: [],
      parent: [],
      reposFolder: temporaryFolder,
      source: [],
    })
    const alts1 = await context.getAlt()
    expect(alts1).toEqual(['InitialAlt'])
    // Create another alt after first call
    await fs.mkdirp(path.join(asFolder, 'NewAlt'))
    // Should still return cached result
    const alts2 = await context.getAlt()
    expect(alts2).toEqual(['InitialAlt'])
  })
  test('discoverAlts returns empty array when .as folder does not exist', async () => {
    const context = new Context({
      asFolder: temporaryFolder,
      configFile: '',
      foreignReposFolder: path.join(temporaryFolder, '.foreign'),
      forksFolder: path.join(temporaryFolder, '.fork'),
      gistFolder: path.join(temporaryFolder, '.gist'),
      githubCloneBackend: 'ssh',
      githubUser: 'MainUser',
      glob: [],
      parent: [],
      reposFolder: temporaryFolder,
      source: [],
    })
    const alts = await context.discoverAlts()
    expect(alts).toEqual([])
  })
  test('gatherSources includes alt account sources', async () => {
    const asFolder = path.join(temporaryFolder, '.as')
    await fs.mkdirp(path.join(asFolder, 'AltUser'))
    const context = new Context({
      alt: true,
      asFolder: temporaryFolder,
      configFile: '',
      foreignReposFolder: path.join(temporaryFolder, '.foreign'),
      forksFolder: path.join(temporaryFolder, '.fork'),
      gistFolder: path.join(temporaryFolder, '.gist'),
      githubCloneBackend: 'ssh',
      githubUser: 'MainUser',
      glob: [],
      parent: [],
      reposFolder: temporaryFolder,
      source: [],
    })
    const sources = await context.gatherSources()
    const altSources = sources.filter(s => typeof s === 'object'
      && s.type === 'parent'
      && s.input.includes('.as'))
    expect(altSources.length).toBe(1)
    const altSource = altSources[0]
    if (typeof altSource === 'string') {
      throw new TypeError('Expected alt source to be object')
    }
    expect(path.normalize(altSource.input)).toBe(path.normalize(path.join(temporaryFolder, '.as', 'AltUser')))
  })
})
