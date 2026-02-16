import type {GlobalArgs} from '../cli.ts'
import type {RepoData} from 'src/ExtendedOctokit.ts'
import type {ArgumentsCamelCase, Argv, CommandBuilder} from 'yargs'

import {chalkifyPath} from 'lib/chalk.ts'

import Context from '../Context.ts'

export type Args = (typeof builder) extends CommandBuilder<any, infer U> ? ArgumentsCamelCase<U> : never

export const command = 'list-remote'
export const description = 'lists remote repos'
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
