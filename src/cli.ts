import type {InferredOptionTypes} from 'yargs'

import yargs from 'yargs'
import {hideBin} from 'yargs/helpers'

import * as findCommand from './command/find.js'
import * as listCommand from './command/list.js'

export type YargsOptions = Parameters<ReturnType<typeof yargs>['options']>[0]
export type GlobalArgs = InferredOptionTypes<typeof globalOptions>
const globalOptions = {
  glob: {
    array: true,
    string: true,
  },
  parent: {
    array: true,
    string: true,
  },
}
const cli = yargs(hideBin(process.argv))
cli.detectLocale(false)
cli.strict()
cli.parserConfiguration({
  'greedy-arrays': false,
  'strip-aliased': true,
  'strip-dashed': true,
})
cli.scriptName(process.env.npm_package_name!)
cli.version(process.env.npm_package_version!)
cli.completion()
cli.options(globalOptions)
cli.command(listCommand)
cli.command(findCommand)
cli.demandCommand()
cli.help()
cli.wrap(Math.min(100, cli.terminalWidth()))
await cli.parseAsync()
