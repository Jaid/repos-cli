import type {Repo} from './ExtendedOctokit.js'
import type {Match} from './LocalFinder.js'
import type {GlobalArgs} from '~/src/cli.js'

import {ExtendedOctokit} from './ExtendedOctokit.js'
import {gatherSources} from './gatherSources.js'
import {LocalFinder} from './LocalFinder.js'

export type LocalResult = {
  match: Match
  source: 'local'
}
export type GithubResult = {
  repo: Repo
  source: 'github'
}

export type Result = GithubResult | LocalResult

export type Options = GlobalArgs & {
  needle?: string
}

export const findAnywhere = async (args: Options, needle?: string): Promise<Result | undefined> => {
  const retrievedNeedle = args.needle ?? needle
  if (!retrievedNeedle) {
    throw new Error(`No needle provided`)
  }
  const sources = await gatherSources(args)
  const finder = LocalFinder.fromSources(sources)
  const match = await finder.findSingle(retrievedNeedle)
  if (match) {
    return {
      match,
      source: `local`,
    }
  }
  const octokit = new ExtendedOctokit(undefined, process.env.GITHUB_TOKEN)
  const repo = await octokit.findRepo(retrievedNeedle, args.githubUser)
  if (repo) {
    return {
      repo,
      source: `github`,
    }
  }
}
