import type {GlobalArgs} from '../cli.js'
import type {ArgumentsCamelCase, Argv, CommandBuilder} from 'yargs'

import Context from '../Context.js'
import {LocalFinder} from '../LocalFinder.js'

export type Args = (typeof builder) extends CommandBuilder<any, infer U> ? ArgumentsCamelCase<U> : never

export const command = 'list-sources'
export const description = 'list sources'
export const builder = (argv: Argv) => {
  return argv
    .options({
    })
}

export const handler = async (args: GlobalArgs & Args) => {
  const context = await Context.withConfig(args)
  const sources = await context.gatherSources()
  const finder = LocalFinder.fromSources(sources)
  for (const source of finder.baseSources) {
    console.log(`${source.type.padEnd(6, ' ')} ${source.input}`)
  }
}
