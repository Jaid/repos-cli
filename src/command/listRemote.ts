import type {GlobalArgs} from '../cli.js'
import type {Repo} from '~/lib/ExtendedOctokit.js'
import type {ArgumentsCamelCase, Argv, CommandBuilder} from 'yargs'

import {chalkifyPath} from '~/lib/chalk.js'
import {ExtendedOctokit} from '~/lib/ExtendedOctokit.js'

export type Args = (typeof builder) extends CommandBuilder<any, infer U> ? ArgumentsCamelCase<U> : never

export const command = `list-remote`
export const description = `lists remote repos`
export const builder = (argv: Argv) => {
  return argv
    .options({
    })
}

const repoToSlug = (repo: Repo) => {
  return repo.full_name
}
const filterReposPredicate = (repo: Repo) => {
  return !repo.archived
}

export const handler = async (args: GlobalArgs & Args) => {
  const octokit = new ExtendedOctokit({
    timeZone: process.env.TZ ?? `UTC`,
  }, process.env.GITHUB_TOKEN)
  const repos = await octokit.listRepos(args.githubUser)
  for (const repo of repos) {
    if (!filterReposPredicate(repo)) {
      continue
    }
    console.log(chalkifyPath(repoToSlug(repo)))
  }
}
