import type {GlobalArgs} from '../cli.js'
import type {ArgumentsCamelCase, Argv, CommandBuilder} from 'yargs'

import {Finder} from '~/lib/Finder.js'
import {gatherSources} from '~/lib/gatherSources.js'

export type Args = (typeof builder) extends CommandBuilder<any, infer U> ? ArgumentsCamelCase<U> : never

export const command = `find <needle>`
export const description = `finds a single repo`
export const builder = (argv: Argv) => {
  return argv
    .positional(`needle`, {
      type: `string`,
    })
    .options({
    })
}

export const handler = async (args: GlobalArgs & Args) => {
  const sources = await gatherSources(args)
  const finder = Finder.fromSources(sources)
  const repoFolder = await finder.findSingle(args.needle!)
  if (!repoFolder) {
    console.error(`No repo found for needle: ${args.needle}`)
    return
  }
  console.log(repoFolder.toColorString())
}
