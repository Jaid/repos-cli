import type {RepoData} from './ExtendedOctokit.js'
import type {MatchFromKeys} from 'lib/superRegexTypes.js'
import type {RemoteWithRefs} from 'simple-git'

import fs from 'fs-extra'
import {simpleGit} from 'simple-git'
import {firstMatch} from 'super-regex'

import path from 'lib/commonPath.js'

import {chalkifyPath} from '../lib/chalk.js'

export type GithubExpressionMatch = {
  owner: string
  repo: string
}

export type GithubMatch = MatchFromKeys<'owner' | 'repo'>

const githubExpression = /(\/\/|@)github.com(:|\/)(?<owner>[^/]+)\/(?<repo>[^/]+?)(\.git)?$/i
const pickFromRemotes = (remotes: Array<RemoteWithRefs>) => {
  if (remotes.length === 0) {
    return
  }
  const originRemote = remotes.find(remote => remote.name === 'origin')
  if (originRemote) {
    return originRemote
  }
  const upstreamRemote = remotes.find(remote => remote.name === 'upstream')
  if (upstreamRemote) {
    return upstreamRemote
  }
  return remotes[0]
}

export class Repo {
  static fromFolder(folder: string): Repo {
    const normalizedFolder = path.normalize(path.resolve(folder))
    const name = path.basename(normalizedFolder)
    const parentFolder = path.dirname(normalizedFolder)
    if (name === '.git') {
      return this.fromFolder(parentFolder)
    }
    return this.fromLocal(name, parentFolder)
  }
  static fromLocal(name: string, parentFolder: string) {
    const repo = new this
    repo.declareLocal(parentFolder, name)
    return repo
  }
  static fromRemote(githubRepo: RepoData) {
    const repo = new this
    repo.declareRemote(githubRepo)
    return repo
  }
  folderName?: string
  githubRepo?: RepoData
  parentFolder?: string
  get name() {
    if (this.isLocal()) {
      return this.folderName
    }
    return this.remoteName
  }
  get owner() {
    this.expectRemote()
    // @ts-expect-error
    return this.githubRepo.owner.login
  }
  get remoteName() {
    this.expectRemote()
    // @ts-expect-error
    return this.githubRepo.name
  }
  asFolder() {
    this.expectLocal()
    // @ts-expect-error
    return path.join(this.parentFolder, this.folderName)
  }
  asSlug() {
    this.expectRemote()
    return `${this.owner}/${this.remoteName}`
  }
  async clone(parentFolder: string, useHttps: boolean = false, folderName?: string) {
    this.expectRemote()
    const name = folderName ?? this.remoteName
    const targetFolder = path.join(parentFolder, name)
    await fs.mkdirp(parentFolder)
    const git = simpleGit()
    const urlProperty = useHttps ? 'clone_url' : 'ssh_url'
    // @ts-expect-error
    await git.clone(this.githubRepo[urlProperty], targetFolder)
    this.declareLocal(parentFolder, name)
  }
  declareLocal(parentFolder: string, folderName: string) {
    this.parentFolder = parentFolder
    this.folderName = folderName
  }
  declareRemote(githubRepo: RepoData) {
    this.githubRepo = githubRepo
  }
  async deleteLocal() {
    this.expectLocal()
    await fs.remove(this.asFolder())
  }
  async ensureLocal(parentFolder: string, useHttps: boolean = false, folderName?: string) {
    if (this.isLocal()) {
      return
    }
    const name = folderName ?? this.remoteName
    const targetFolder = path.join(parentFolder, name)
    const alreadyExists = await fs.pathExists(targetFolder)
    if (alreadyExists) {
      this.declareLocal(parentFolder, name)
      return
    }
    await this.clone(parentFolder, useHttps, folderName)
  }
  expectLocal() {
    if (!this.isLocal()) {
      throw new Error(`Expected local repo, got remote repo: ${this.asSlug()}`)
    }
  }
  expectRemote() {
    if (!this.isRemote()) {
      throw new Error(`Expected remote repo, got local repo: ${this.asFolder()}`)
    }
  }
  getAnsiFolder() {
    return chalkifyPath(this.asFolder())
  }
  getAnsiSlug() {
    return chalkifyPath(this.asSlug())
  }
  getBasehead() {
    const parent = this.getParent()
    if (!parent) {
      return
    }
    // @ts-expect-error
    return `${parent.owner.login}:${parent.default_branch}...${this.githubRepo.owner.login}:${this.githubRepo.default_branch}`
  }
  async getFetchUrl() {
    this.expectLocal()
    const git = this.getSimpleGit()
    const remotes = await git.getRemotes(true)
    const remote = pickFromRemotes(remotes)
    if (!remote) {
      return
    }
    return remote.refs.fetch
  }
  async getGithubSlug() {
    this.expectLocal()
    const fetchUrl = await this.getFetchUrl()
    if (!fetchUrl) {
      return
    }
    const githubExpressionMatch = firstMatch(githubExpression, fetchUrl) as GithubMatch
    if (!githubExpressionMatch) {
      return
    }
    return githubExpressionMatch.namedGroups
  }
  getParent() {
    if (!this.isFork()) {
      return
    }
    // @ts-expect-error
    return this.githubRepo.parent
  }
  getSimpleGit() {
    this.expectLocal()
    return simpleGit(this.asFolder())
  }
  isFork() {
    this.expectRemote()
    // @ts-expect-error
    return this.githubRepo.fork
  }
  isLocal() {
    return Boolean(this.parentFolder)
  }
  isRemote() {
    return Boolean(this.githubRepo)
  }
  toAnsiString() {
    if (this.isLocal()) {
      return this.getAnsiFolder()
    }
    return this.getAnsiSlug()
  }
  toString() {
    if (this.isLocal()) {
      return this.asFolder()
    }
    return this.asSlug()
  }
}
