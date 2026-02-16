import type {GlobalArgs} from '../cli.ts'
import type {ArgumentsCamelCase, Argv, CommandBuilder} from 'yargs'

import console from 'node:console'

import Context from '../Context.ts'

export type Args = (typeof builder) extends CommandBuilder<any, infer U> ? ArgumentsCamelCase<U> : never

export const command = 'delete-local <needle>'
export const description = 'finds a single repo on disk and deletes its folder'
export const builder = (argv: Argv) => {
  return argv
    .positional('needle', {
      required: true,
      type: 'string',
    })
    .options({
    })
}

export const handler = async (args: GlobalArgs & Args) => {
  const context = await Context.withConfig(args)
  const result = await context.findLocal()
  if (!result) {
    console.error(`No repo found for needle: ${args.needle}`)
    return
  }
}
