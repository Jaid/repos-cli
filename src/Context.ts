import type {GlobalArgs} from './cli.js'
import type {Match, SourceInput} from '~/src/LocalFinder.js'
import type {Merge} from 'type-fest'

import readFileYaml from 'read-file-yaml'

import path from '~/lib/commonPath.js'
import {defaultReposFolder} from '~/lib/defaultReposFolder.js'
import {ExtendedOctokit} from '~/src/ExtendedOctokit.js'
import {LocalFinder} from '~/src/LocalFinder.js'
import {Repo} from '~/src/Repo.js'

type CommonResult = {
  repo: Repo
  source: Source
}

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
  sources?: SourceInput[]
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
  constructor(options: Options) {
    this.options = options
  }
  get foreignReposFolder() {
    return this.options.foreignReposFolder ?? `${this.reposFolder}/.foreign`
  }
  get forksFolder() {
    return this.options.forksFolder ?? `${this.reposFolder}/.fork`
  }
  get gistFolder() {
    return this.options.gistFolder ?? `${this.reposFolder}/.gist`
  }
  get githubToken() {
    return process.env.GITHUB_TOKEN
  }
  get githubUser() {
    return this.options.githubUser ?? this.#octokitUser ?? process.env.GITHUB_USER
  }
  get reposFolder() {
    return this.options.reposFolder ?? defaultReposFolder
  }
  async findAnywhere(needle?: string): Promise<Result | undefined> {
    const retrievedNeedle = needle ?? this.options.needle
    if (!retrievedNeedle) {
      throw new Error(`No needle provided`)
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
      throw new Error(`No needle provided`)
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
    const cloneParentFolder = this.getExpectedParentFolder(result.repo)
    await result.repo.clone(cloneParentFolder, this.options.githubCloneBackend !== `ssh`)
    return result.repo
  }
  async gatherSources(): Promise<SourceInput[]> {
    const sources: SourceInput[] = []
    if (this.options.reposFolder) {
      sources.push({
        input: this.options.reposFolder,
        type: `parent`,
      })
    }
    if (this.options.forksFolder) {
      sources.push({
        input: this.options.forksFolder,
        type: `parent`,
      })
    }
    if (this.options.gistFolder) {
      sources.push({
        input: this.options.gistFolder,
        type: `parent`,
      })
    }
    if (this.options.foreignReposFolder) {
      sources.push({
        input: `${this.options.foreignReposFolder}/*/*`,
        type: `glob`,
      })
    }
    for (const parent of this.options.parent ?? []) {
      sources.push({
        input: parent,
        type: `parent`,
      })
    }
    for (const glob of this.options.glob ?? []) {
      sources.push({
        input: glob,
        type: `glob`,
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
  getExpectedFolder(githubRepo: Repo, folderName?: string) {
    const repoData = githubRepo.githubRepo!
    const name = folderName ?? repoData.name
    const parentFolder = this.getExpectedParentFolder(githubRepo)
    return path.join(parentFolder, name)
  }
  getExpectedParentFolder(githubRepo: Repo) {
    const repoData = githubRepo.githubRepo!
    const isForeign = this.#octokitUser !== repoData.owner.login
    if (isForeign) {
      return path.join(this.foreignReposFolder, repoData.owner.login)
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
  async loadConfig() {
    if (!this.options.configFile) {
      return
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const config = <Config | undefined> await readFileYaml.default(this.options.configFile)
    this.config = config
  }
}
