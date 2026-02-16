import * as path from 'forward-slash-path'
import {convertPathToPattern, globbyStream, isDynamicPattern} from 'globby'

import {isGitFolder} from 'lib/isGitFolder.ts'

import {Repo} from './Repo.ts'

export type Source = {
  input: string
  type: 'deep' | 'glob' | 'parent'
}

export type SourceInput = Source | string

export type Options = {
  cwd: string
  deepSources?: Array<string>
}

export class Match {
  repo: Repo
  source: Source
  constructor(source: Source, repo: Repo) {
    this.source = source
    this.repo = repo
  }
}

export class LocalFinder {
  static fromSources(sources: Array<SourceInput>): LocalFinder {
    const finder = new LocalFinder
    for (const source of sources) {
      finder.addSource(source)
    }
    return finder
  }
  baseSources: Array<Source> = []
  deepSources: Array<Source> = []
  options: Options
  constructor(options = {}) {
    const defaultOptions: Options = {
      cwd: process.cwd(),
    }
    this.options = {
      ...defaultOptions,
      ...options,
    }
  }
  addDeepSource(folder: string) {
    this.addSource({
      input: folder,
      type: 'deep',
    })
  }
  addGlobSource(glob: string): void {
    this.addSource({
      input: glob,
      type: 'glob',
    })
  }
  addParentSource(parentFolder: string) {
    this.addSource({
      input: parentFolder,
      type: 'parent',
    })
  }
  addSource(location: SourceInput) {
    const source = this.#normalizeSource(location)
    this.baseSources.push(source)
  }
  async expectSingle(needle: string, additionalSources: Array<Source> = []): Promise<Match | undefined> {
    const match = await this.findSingle(needle, additionalSources)
    if (!match) {
      const errorMessage = `No repo found for needle: ${needle}`
      console.error(errorMessage)
      console.error('Searched in:')
      for (const source of this.baseSources) {
        console.error(`• ${source.type} “${source.input}”`)
      }
      for (const source of additionalSources) {
        console.error(`• ${source.type} “${source.input}”`)
      }
      throw new Error(errorMessage)
    }
    return match
  }
  async findRepoFromFolder(startFolder?: string): Promise<Repo | undefined> {
    const start: string = startFolder ?? this.options.cwd
    let currentFolder: string = start
    while (true) {
      const isRepo = await isGitFolder(currentFolder)
      if (isRepo) {
        return Repo.fromFolder(currentFolder)
      }
      const parentFolder = path.dirname(currentFolder)
      if (parentFolder === currentFolder) {
        return
      }
      currentFolder = parentFolder
    }
  }
  async findReposInFolder(parentFolder: string): Promise<Array<Repo>> {
    const glob = this.#makeGlobbyFromParent(parentFolder)
    return this.findReposInGlobbyStream(glob)
  }
  async findReposInGlob(glob: string): Promise<Array<Repo>> {
    const stream = this.#makeGlobbyFromGlob(glob)
    return this.findReposInGlobbyStream(stream)
  }
  async findReposInGlobbyStream(stream: ReturnType<typeof globbyStream>): Promise<Array<Repo>> {
    const repos: Array<Repo> = []
    for await (const entry of stream) {
      const repo = Repo.fromFolder(entry)
      repos.push(repo)
    }
    return repos
  }
  async findSingle(needle?: string, additionalSources: Array<Source> = []): Promise<Match | undefined> {
    if (!needle) {
      const source: Source = {
        input: this.options.cwd,
        type: 'deep',
      }
      const repos = await this.getAllReposFromSource(source)
      if (!repos.length) {
        return
      }
      const match = new Match(source, repos[0])
      return match
    }
    const matches = await this.getAllMatches(additionalSources)
    const suitableMatches = matches.filter(match => match.repo.name === needle)
    if (suitableMatches.length === 0) {
      return
    }
    if (suitableMatches.length > 1) {
      console.log(`Multiple repos found: ${suitableMatches.map(match => match.repo.asFolder()).join(', ')}`)
    }
    return suitableMatches[0]
  }
  async getAllMatches(additionalSources: Array<Source> = []): Promise<Array<Match>> {
    const sources = [...this.baseSources, ...additionalSources]
    return this.getAllMatchesForSources(sources)
  }
  async getAllMatchesForSources(sources: Array<Source> = []): Promise<Array<Match>> {
    if (!sources.length) {
      throw new Error('No search sources specified')
    }
    const matches: Array<Match> = []
    for (const source of sources) {
      const repos = await this.getAllReposFromSource(source)
      for (const repo of repos) {
        const match = new Match(source, repo)
        matches.push(match)
      }
    }
    return matches
  }
  async getAllRepos(additionalSources: Array<Source> = []): Promise<Array<string>> {
    const matches = await this.getAllMatches(additionalSources)
    return matches.map(match => match.repo.asFolder())
  }
  async getAllReposFromSource(source: Source): Promise<Array<Repo>> {
    if (source.type === 'deep') {
      const repo = await this.findRepoFromFolder(source.input)
      if (repo) {
        return [repo]
      }
    }
    if (source.type === 'glob') {
      return this.findReposInGlob(source.input)
    }
    if (source.type === 'parent') {
      return this.findReposInFolder(source.input)
    }
    return []
  }
  #makeGlobbyFromGlob(glob: string): ReturnType<typeof globbyStream> {
    const gitGlob = `${glob}/.git`
    const stream = globbyStream(gitGlob, {
      expandDirectories: false,
      onlyDirectories: true,
    })
    return stream
  }
  #makeGlobbyFromParent(parentFolder: string): ReturnType<typeof globbyStream> {
    const glob = convertPathToPattern(parentFolder)
    return this.#makeGlobbyFromGlob(`${glob}/*`)
  }
  #normalizeSource(source: SourceInput): Source {
    if (typeof source === 'string') {
      if (isDynamicPattern(source)) {
        return {
          input: source,
          type: 'glob',
        }
      }
      return {
        input: source,
        type: 'parent',
      }
    }
    return source
  }
}
