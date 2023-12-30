import type {GithubResult} from '../lib/find.js'
import type {GlobalArgs} from '~/src/cli.js'
import type {SimpleGit} from 'simple-git'
import type {AsyncReturnType} from 'type-fest'

import util from 'node:util'

import {simpleGit} from 'simple-git'

import path from '~/lib/commonPath.js'

export type Options = GlobalArgs & {
  isForeign?: boolean
  url?: string
}

type PullResult = AsyncReturnType<SimpleGit['clone']>

export const cloneFromUrl = async (args: Options, targetFolder: string, url?: string): Promise<PullResult> => {
  const retrievedUrl = args.url ?? url
  if (!retrievedUrl) {
    throw new Error(`No url provided`)
  }
  const git = simpleGit()
  const result = await git.clone(retrievedUrl, targetFolder)
  return result
}

export const cloneFromGithubRepo = async (args: Options, targetFolder: string, owner: string, repo: string) => {
  const urlTemplate = args.githubCloneBackend === `ssh` ? `git@github.com/%s/%s.git` : `https://github.com/%s/%s.git`
  const url = util.format(urlTemplate, owner, repo)
  return cloneFromUrl(args, targetFolder, url)
}

export const cloneFromFindResult = async (args: Options, result: GithubResult) => {
  let targetParent = args.reposFolder
  if (args.isForeign) {
    targetParent = args.foreignReposFolder
  }
  if (result.repo.fork) {
    targetParent = args.forksFolder
  }
  let targetFolder: string
  if (args.isForeign) {
    targetFolder = path.join(targetParent, result.repo.owner.login, result.repo.name)
  } else {
    targetFolder = path.join(targetParent, result.repo.name)
  }
  return cloneFromGithubRepo(args, targetFolder, result.repo.owner.login, result.repo.name)
}
