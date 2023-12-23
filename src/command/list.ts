import type {GlobalArgs} from '../cli.js'
import type {ArgumentsCamelCase, Argv, CommandBuilder} from 'yargs'

import {chalkifyPath} from '~/lib/chalk.js'
import {gatherSources} from '~/lib/gatherSources.js'
import {LocalFinder} from '~/lib/LocalFinder.js'

export type Args = (typeof builder) extends CommandBuilder<any, infer U> ? ArgumentsCamelCase<U> : never

export const command = `list`
export const description = `load tasks from a YAML file`
export const builder = (argv: Argv) => {
  return argv
    .options({
      gitStatus: {
        boolean: true,
        default: false,
        description: `show git status`,
      },
    })
}

export const handler = async (args: GlobalArgs & Args) => {
  const sources = await gatherSources(args)
  const finder = LocalFinder.fromSources(sources)
  const repoFolders = await finder.getAllRepos()
  for (const repoFolder of repoFolders) {
    console.log(chalkifyPath(repoFolder))
  }
}
