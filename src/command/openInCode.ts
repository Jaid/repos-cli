import type {GlobalArgs} from '../cli.js'
import type {ArgumentsCamelCase, Argv, CommandBuilder} from 'yargs'

import {execa} from 'execa'

import {findOrClone} from '~/lib/findOrClone.js'

export type Args = (typeof builder) extends CommandBuilder<any, infer U> ? ArgumentsCamelCase<U> : never

export const command = `open-in-code <needle>`
export const description = `finds a single repo and opens it in VS Code`
export const builder = (argv: Argv) => {
  return argv
    .positional(`needle`, {
      type: `string`,
    })
    .options({
      codePath: {
        default: `code`,
        description: `path to the code executable`,
        string: true,
      },
    })
}

export const handler = async (args: GlobalArgs & Args) => {
  const needle = args.needle
  const findResult = await findOrClone(args, needle)
  if (!findResult) {
    return
  }
  const codeArgs = [`--new-window`, `--goto`, findResult.match.toString()]
  const execaResult = await execa(args.codePath!, codeArgs, {
    stdio: `inherit`,
  })
  console.log(execaResult.escapedCommand)
}
