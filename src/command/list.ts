import type {GlobalArgs} from '../cli.js'
import type {ArgumentsCamelCase, Argv, CommandBuilder} from 'yargs'

import * as lodash from 'lodash-es'

import {chalkifyPath} from '~/lib/chalk.js'
import {Finder} from '~/lib/Finder.js'

export type Args = (typeof builder) extends CommandBuilder<any, infer U> ? ArgumentsCamelCase<U> : never

export const command = `list`
export const description = `load tasks from a YAML file`
export const builder = (argv: Argv) => {
  return argv
    .options({
    })
}

export const handler = async (args: GlobalArgs & Args) => {
  const finder = new Finder
  for (const parentFolder of lodash.toArray(args.parent)) {
    finder.addParentSource(parentFolder)
  }
  for (const glob of lodash.toArray(args.glob)) {
    finder.addGlobSource(glob)
  }
  const repoFolders = await finder.getAllRepos()
  for (const repoFolder of repoFolders) {
    console.log(chalkifyPath(repoFolder))
  }
}
