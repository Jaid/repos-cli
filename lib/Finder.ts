import type {ReadableStream} from 'node:stream/web'

import {convertPathToPattern, globbyStream} from 'globby'

import {ansiDarkOrange3, ansiGold3} from './chalk.js'

export type Source = {
  input: string
  type: `glob` | `parent`
}

export type RepoFolder = {
  name: string
  parents: string
}

export class Match {
  repoFolder: RepoFolder
  source: Source
  constructor(source: Source, repoFolder: RepoFolder) {
    this.source = source
    this.repoFolder = repoFolder
  }
  toColorString(): string {
    const first = ansiDarkOrange3(`${this.repoFolder.parents}/`)
    const second = ansiGold3(this.repoFolder.name)
    return first + second
  }
  toString(): string {
    return `${this.repoFolder.parents}/${this.repoFolder.name}`
  }
}

export class Finder {
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
  addSource(location: Source): void {
    this.baseSources.push(location)
  }
  async findReposInFolder(parentFolder: string): Promise<RepoFolder[]> {
    const glob = this.#makeGlobbyFromParent(parentFolder)
    return this.findReposInGlobbyStream(glob)
  }
  async findReposInGlob(glob: string): Promise<RepoFolder[]> {
    const stream = this.#makeGlobbyFromGlob(glob)
    return this.findReposInGlobbyStream(stream)
  }
  async findReposInGlobbyStream(stream: ReturnType<typeof globbyStream>): Promise<RepoFolder[]> {
    const repoFolders: RepoFolder[] = []
    for await (const entry of stream) {
      const withoutGit = (<string> entry).slice(0, -5)
      const name = withoutGit.slice(withoutGit.lastIndexOf(`/`) + 1)
      const parents = withoutGit.slice(0, withoutGit.lastIndexOf(`/`))
      repoFolders.push({
        name,
        parents,
      })
    }
    return repoFolders
  }
  async findSingle(needle: string, additionalSources: Source[] = []): Promise<Match> {
    const matches = await this.getAllMatches(additionalSources)
    const suitableMatches = matches.filter(match => match.repoFolder.name === needle)
    if (suitableMatches.length === 0) {
      throw new Error(`No repos found`)
    }
    if (suitableMatches.length > 1) {
      console.log(`Multiple repos found: ${suitableMatches.map(match => match.repoFolder.name).join(`, `)}`)
    }
    return suitableMatches[0]
  }
  async getAllMatches(additionalSources: Source[] = []): Promise<Match[]> {
    const sources = [...this.baseSources, ...additionalSources]
    const matches: Match[] = []
    for (const source of sources) {
      let repoFolders: RepoFolder[]
      if (source.type === `glob`) {
        repoFolders = await this.findReposInGlob(source.input)
      } else {
        repoFolders = await this.findReposInFolder(source.input)
      }
      for (const repoFolder of repoFolders) {
        const match = new Match(source, repoFolder)
        matches.push(match)
      }
    }
    return matches
  }
  async getAllRepos(additionalSources: Source[] = []): Promise<string[]> {
    const matches = await this.getAllMatches(additionalSources)
    return matches.map(match => match.toString())
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
}
