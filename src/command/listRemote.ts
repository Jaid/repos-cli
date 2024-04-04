import type {GlobalArgs} from '../cli.js'
import type {RepoData} from 'src/ExtendedOctokit.js'
import type {ArgumentsCamelCase, Argv, CommandBuilder} from 'yargs'

import {chalkifyPath} from 'lib/chalk.js'

import Context from '../Context.js'

export type Args = (typeof builder) extends CommandBuilder<any, infer U> ? ArgumentsCamelCase<U> : never

export const command = `list-remote`
export const description = `lists remote repos`
export const builder = (argv: Argv) => {
  return argv
    .options({
    })
}

const repoToSlug = (repo: RepoData) => {
  return repo.full_name
}
const filterReposPredicate = (repo: RepoData) => {
  return !repo.archived
}

export const handler = async (args: GlobalArgs & Args) => {
  const context = await Context.withConfig(args)
  const octokit = await context.getOctokit()
  const repos = await octokit.listRepos(args.githubUser)
  for (const repo of repos) {
    if (!filterReposPredicate(repo)) {
      continue
    }
    console.log(chalkifyPath(repoToSlug(repo)))
  }
}
