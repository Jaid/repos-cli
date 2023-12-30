import type {RepoData} from './ExtendedOctokit.js'

import fs from 'fs-extra'
import {simpleGit} from 'simple-git'

import path from '~/lib/commonPath.js'

import {chalkifyPath} from '../lib/chalk.js'

export class Repo {
  static fromFolder(folder: string): Repo {
    const normalizedFolder = path.normalize(path.resolve(folder))
    const name = path.basename(normalizedFolder)
    const parentFolder = path.dirname(normalizedFolder)
    if (name === `.git`) {
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
    const urlProperty = useHttps ? `clone_url` : `ssh_url`
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
