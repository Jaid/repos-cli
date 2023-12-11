import type {GlobalArgs} from '../cli.js'
import type {ArgumentsCamelCase, Argv, CommandBuilder} from 'yargs'

import * as lodash from 'lodash-es'

import {Finder} from '~/lib/Finder.js'

export type Args = (typeof builder) extends CommandBuilder<any, infer U> ? ArgumentsCamelCase<U> : never

export const command = `find <needle>`
export const description = `finds a single repo`
export const builder = (argv: Argv) => {
  return argv
    .positional(`needle`, {
      type: `string`,
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
  const repoFolder = await finder.findSingle(args.needle!)
  console.log(repoFolder.toColorString())
}
