import type {GlobalArgs} from '../makeCli.ts'
import type {ArgumentsCamelCase, Argv, CommandBuilder} from 'yargs'

import open from 'open'

import Context from '../Context.ts'

export type Args = (typeof builder) extends CommandBuilder<any, infer U> ? ArgumentsCamelCase<U> : never

export const command = 'go <needle>'
export const description = 'opens the GitHub repo in the default browser'
export const builder = (argv: Argv) => {
  return argv
    .positional('needle', {
      describe: 'repository name to open',
      type: 'string',
    })
    .options({
      printOnly: {
        description: 'only print the URL instead of opening it',
        boolean: true,
        default: false,
      },
    })
}

export const handler = async (args: GlobalArgs & Args) => {
  const context = await Context.withConfig(args)
  const result = await context.findAnywhere(args.needle)
  if (!result) {
    console.error(`Repository “${args.needle}” not found`)
    process.exit(1)
  }
  const repo = result.repo
  const url = repo.getGithubUrl()
  if (!url) {
    console.error(`Repository “${args.needle}” does not have a GitHub URL`)
    process.exit(1)
  }
  if (args.printOnly) {
    console.log(url)
  } else {
    return open(url)
  }
}
