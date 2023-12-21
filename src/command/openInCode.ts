import type {GlobalArgs} from '../cli.js'
import type {ArgumentsCamelCase, Argv, CommandBuilder} from 'yargs'

import {execa} from 'execa'

import {Finder} from '~/lib/Finder.js'
import {gatherSources} from '~/lib/gatherSources.js'

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
  const sources = await gatherSources(args)
  const finder = Finder.fromSources(sources)
  const repoFolder = await finder.expectSingle(args.needle!)
  if (!repoFolder) {
    return
  }
  const codeArgs = [`--new-window`, `--goto`, repoFolder.toString()]
  const result = await execa(args.codePath!, codeArgs, {
    stdio: `inherit`,
  })
  console.log(result.escapedCommand)
}
