import type {GlobalArgs} from '../cli.ts'
import type {ArgumentsCamelCase, Argv, CommandBuilder} from 'yargs'

import Context from '../Context.ts'

export type Args = (typeof builder) extends CommandBuilder<any, infer U> ? ArgumentsCamelCase<U> : never

export const command = 'find <needle>'
export const description = 'finds a single repo'
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
  const result = await context.findAnywhere()
  if (!result) {
    console.error(`No repo found for needle: ${args.needle}`)
    return
  }
  console.log(result.repo.toAnsiString())
}
