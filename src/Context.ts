import type {GlobalArgs} from './makeCli.ts'
import type {Match, SourceInput} from 'src/LocalFinder.ts'
import type {Merge} from 'type-fest'

import * as path from 'forward-slash-path'
import {globby} from 'globby'
import readFileYaml from 'read-file-yaml'

import {ExtendedOctokit} from 'src/ExtendedOctokit.ts'
import {LocalFinder} from 'src/LocalFinder.ts'
import {Repo} from 'src/Repo.ts'

export const enum Source {
  Local,
  Github,
}

export type LocalResult = Merge<CommonResult, {
  match: Match
  source: Source.Local
}>

export type GithubResult = Merge<CommonResult, {
  source: Source.Github
}>
export type Result = GithubResult | LocalResult

export type Options = GlobalArgs & {
  needle?: string
}

export type Config = {
  sources?: Array<SourceInput>
}

type CommonResult = {
  repo: Repo
  source: Source
}

export default class Context {
  static async withConfig(options: Options) {
    const context = new Context(options)
    await context.loadConfig()
    return context
  }
  config: Config | undefined
  options: Options
  #octokit: ExtendedOctokit | undefined
  #octokitUser: string | undefined
  #resolvedAlt: Array<string> | undefined
  constructor(options: Options) {
    this.options = options
  }
  get asFolder() {
    return this.options.asFolder
  }
  get foreignReposFolder() {
    return this.options.foreignReposFolder
  }
  get forksFolder() {
    return this.options.forksFolder
  }
  get gistFolder() {
    return this.options.gistFolder
  }
  get githubToken() {
    return process.env.GITHUB_TOKEN
  }
  get githubUser() {
    return this.options.githubUser || this.#octokitUser
  }
  get reposFolder() {
    return this.options.reposFolder
  }
  async discoverAlts(): Promise<Array<string>> {
    try {
      const directories = await globby('*', {
        cwd: this.asFolder,
        onlyDirectories: true,
      })
      return directories
    } catch {
      return []
    }
  }
  async findAnywhere(needle?: string): Promise<Result | undefined> {
    const retrievedNeedle = needle ?? this.options.needle
    if (!retrievedNeedle) {
      throw new Error('No needle provided')
    }
    const sources = await this.gatherSources()
    const finder = LocalFinder.fromSources(sources)
    const match = await finder.findSingle(retrievedNeedle)
    if (match) {
      return {
        match,
        repo: match.repo,
        source: Source.Local,
      }
    }
    const octokit = await this.getOctokit()
    const githubRepo = await octokit.findRepo(retrievedNeedle, this.githubUser)
    if (githubRepo) {
      return {
        repo: Repo.fromRemote(githubRepo),
        source: Source.Github,
      }
    }
  }
  async findLocal(needle?: string): Promise<Match | undefined> {
    const retrievedNeedle = needle ?? this.options.needle
    if (!retrievedNeedle) {
      throw new Error('No needle provided')
    }
    const sources = await this.gatherSources()
    const finder = LocalFinder.fromSources(sources)
    const match = await finder.findSingle(retrievedNeedle)
    return match
  }
  async findOrClone(needle?: string): Promise<Repo | undefined> {
    const result = await this.findAnywhere(needle)
    if (!result) {
      return
    }
    if (result.source === Source.Local) {
      return result.repo
    }
    const cloneParentFolder = await this.getExpectedParentFolder(result.repo)
    await result.repo.clone(cloneParentFolder, this.options.githubCloneBackend !== 'ssh')
    return result.repo
  }
  async gatherSources(): Promise<Array<SourceInput>> {
    const sources: Array<SourceInput> = []
    if (this.options.reposFolder) {
      sources.push({
        input: this.options.reposFolder,
        type: 'parent',
      })
    }
    if (this.options.forksFolder) {
      sources.push({
        input: this.options.forksFolder,
        type: 'parent',
      })
    }
    if (this.options.gistFolder) {
      sources.push({
        input: this.options.gistFolder,
        type: 'parent',
      })
    }
    if (this.options.foreignReposFolder) {
      sources.push({
        input: `${this.options.foreignReposFolder}/*/*`,
        type: 'glob',
      })
    }
    const altAccounts = await this.getAlt()
    for (const altAccount of altAccounts) {
      sources.push({
        input: path.join(this.asFolder, altAccount),
        type: 'parent',
      })
    }
    for (const parent of this.options.parent ?? []) {
      sources.push({
        input: parent,
        type: 'parent',
      })
    }
    for (const glob of this.options.glob ?? []) {
      sources.push({
        input: glob,
        type: 'glob',
      })
    }
    for (const source of this.options.source ?? []) {
      sources.push(source)
    }
    if (this.config) {
      for (const source of this.config.sources ?? []) {
        sources.push(source)
      }
    }
    return sources
  }
  async getAlt(): Promise<Array<string>> {
    if (this.#resolvedAlt !== undefined) {
      return this.#resolvedAlt
    }
    if (this.options.alt && this.options.alt.length > 0) {
      this.#resolvedAlt = this.options.alt
    } else {
      this.#resolvedAlt = await this.discoverAlts()
    }
    return this.#resolvedAlt
  }
  async getExpectedFolder(githubRepo: Repo, folderName?: string) {
    const repoData = githubRepo.githubRepo!
    const name = folderName ?? repoData.name
    const parentFolder = await this.getExpectedParentFolder(githubRepo)
    return path.join(parentFolder, name)
  }
  async getExpectedParentFolder(githubRepo: Repo) {
    const repoData = githubRepo.githubRepo!
    const ownerLogin = repoData.owner.login
    const altAccounts = await this.getAlt()
    // Check if this is an alt account
    if (altAccounts.includes(ownerLogin)) {
      return path.join(this.asFolder, ownerLogin)
    }
    const isForeign = await this.isRepoForeign(githubRepo)
    if (isForeign) {
      return path.join(this.foreignReposFolder, ownerLogin)
    }
    if (repoData.fork) {
      return this.forksFolder
    }
    return this.reposFolder
  }
  async getOctokit() {
    if (this.#octokit) {
      return this.#octokit
    }
    const githubToken = this.githubToken
    const octokit = new ExtendedOctokit(undefined, githubToken)
    if (githubToken) {
      const user = await octokit.users.getAuthenticated()
      this.#octokitUser = user.data.login
    }
    this.#octokit = octokit
    return octokit
  }
  async isRepoForeign(githubRepo: Repo) {
    const repoData = githubRepo.githubRepo!
    const ownerLogin = repoData.owner.login
    const altAccounts = await this.getAlt()
    if (altAccounts.includes(ownerLogin)) {
      return false
    }
    return this.#octokitUser !== ownerLogin
  }
  async loadConfig() {
    if (!this.options.configFile) {
      return
    }
    // eslint-disable-next-line typescript/no-unsafe-call
    const config = await readFileYaml(this.options.configFile) as Config | undefined
    this.config = config
  }
}
