import type {ArgumentsCamelCase, Argv, CommandBuilder} from 'yargs'

import yargs from 'yargs'
import {hideBin} from 'yargs/helpers'

import * as collectInvokeImportsCommand from './command/edit.js'

const cli = yargs(hideBin(process.argv))
cli.detectLocale(false)
cli.strict()
cli.parserConfiguration({
  'strip-aliased': true,
  'strip-dashed': true,
})
cli.scriptName(process.env.npm_package_name!)
cli.completion()
cli.command(grabCommand)
cli.demandCommand()
cli.help()
cli.wrap(Math.min(100, cli.terminalWidth()))
cli.parse()
