import {convertPathToPattern, globbyStream, isDynamicPattern} from 'globby'

import {Repo} from './Repo.js'

export type Source = {
  input: string
  type: `glob` | `parent`
}

export type SourceInput = Source | string

export class Match {
  repo: Repo
  source: Source
  constructor(source: Source, repo: Repo) {
    this.source = source
    this.repo = repo
  }
}

export class LocalFinder {
  static fromSources(sources: SourceInput[]): LocalFinder {
    const finder = new LocalFinder
    for (const source of sources) {
      finder.addSource(source)
    }
    return finder
  }
  baseSources: Source[] = []
  cwd: string
  constructor(options = {}) {
    this.cwd = options.cwd ?? process.cwd()
  }
  addGlobSource(glob: string): void {
    this.addSource({
      input: glob,
      type: `glob`,
    })
  }
  addParentSource(parentFolder: string): void {
    this.addSource({
      input: parentFolder,
      type: `parent`,
    })
  }
  addSource(location: SourceInput): void {
    const source = this.#normalizeSource(location)
    this.baseSources.push(source)
  }
  async expectSingle(needle: string, additionalSources: Source[] = []): Promise<Match | undefined> {
    const match = await this.findSingle(needle, additionalSources)
    if (!match) {
      const errorMessage = `No repo found for needle: ${needle}`
      console.error(errorMessage)
      console.error(`Searched in:`)
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
  async findReposInFolder(parentFolder: string): Promise<Repo[]> {
    const glob = this.#makeGlobbyFromParent(parentFolder)
    return this.findReposInGlobbyStream(glob)
  }
  async findReposInGlob(glob: string): Promise<Repo[]> {
    const stream = this.#makeGlobbyFromGlob(glob)
    return this.findReposInGlobbyStream(stream)
  }
  async findReposInGlobbyStream(stream: ReturnType<typeof globbyStream>): Promise<Repo[]> {
    const repos: Repo[] = []
    for await (const entry of stream) {
      const repo = Repo.fromFolder(<string> entry)
      repos.push(repo)
    }
    return repos
  }
  async findSingle(needle: string, additionalSources: Source[] = []): Promise<Match | undefined> {
    const matches = await this.getAllMatches(additionalSources)
    const suitableMatches = matches.filter(match => match.repo.name === needle)
    if (suitableMatches.length === 0) {
      return
    }
    if (suitableMatches.length > 1) {
      console.log(`Multiple repos found: ${suitableMatches.map(match => match.repo.asFolder()).join(`, `)}`)
    }
    return suitableMatches[0]
  }
  async getAllMatches(additionalSources: Source[] = []): Promise<Match[]> {
    const sources = [...this.baseSources, ...additionalSources]
    if (!sources.length) {
      throw new Error(`No search sources specified`)
    }
    const matches: Match[] = []
    for (const source of sources) {
      let repos: Repo[]
      if (source.type === `glob`) {
        repos = await this.findReposInGlob(source.input)
      } else {
        repos = await this.findReposInFolder(source.input)
      }
      for (const repo of repos) {
        const match = new Match(source, repo)
        matches.push(match)
      }
    }
    return matches
  }
  async getAllRepos(additionalSources: Source[] = []): Promise<string[]> {
    const matches = await this.getAllMatches(additionalSources)
    return matches.map(match => match.repo.asFolder())
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
    if (typeof source === `string`) {
      if (isDynamicPattern(source)) {
        return {
          input: source,
          type: `glob`,
        }
      }
      return {
        input: source,
        type: `parent`,
      }
    }
    return source
  }
}
