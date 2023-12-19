import type {InferredOptionTypes} from 'yargs'

import os from 'node:os'

import yargs from 'yargs'
import {hideBin} from 'yargs/helpers'

import * as findCommand from './command/find.js'
import * as listCommand from './command/list.js'
import * as listSourcesCommand from './command/listSources.js'
import * as openInCodeCommand from './command/openInCode.js'

export type YargsOptions = Parameters<ReturnType<typeof yargs>['options']>[0]
export type GlobalArgs = InferredOptionTypes<typeof globalOptions>
const globalOptions = {
  configFile: {
    default: `${os.homedir()}/.config/repos-cli/config.yml`,
    string: true,
  },
  glob: {
    array: true,
    string: true,
  },
  parent: {
    array: true,
    string: true,
  },
  source: {
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
cli.command(openInCodeCommand)
cli.command(listSourcesCommand)
cli.demandCommand()
cli.help()
cli.showHelpOnFail(false)
cli.wrap(Math.min(100, cli.terminalWidth()))
await cli.parseAsync()
