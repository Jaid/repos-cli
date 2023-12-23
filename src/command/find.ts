import type {GlobalArgs} from '../cli.js'
import type {ArgumentsCamelCase, Argv, CommandBuilder} from 'yargs'

import {chalkifyPath} from '~/lib/chalk.js'
import {findAnywhere} from '~/lib/findAnywhere.js'

export type Args = (typeof builder) extends CommandBuilder<any, infer U> ? ArgumentsCamelCase<U> : never

export const command = `find <needle>`
export const description = `finds a single repo`
export const builder = (argv: Argv) => {
  return argv
    .positional(`needle`, {
      required: true,
      type: `string`,
    })
    .options({
    })
}

export const handler = async (args: GlobalArgs & Args) => {
  const result = await findAnywhere(args)
  if (!result) {
    console.error(`No repo found for needle: ${args.needle}`)
    return
  }
  if (result.source === `local`) {
    console.log(result.match.toAnsiString())
  } else {
    console.log(chalkifyPath(result.repo.html_url))
  }
}
