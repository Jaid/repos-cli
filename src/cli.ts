import type {InferredOptionTypes} from 'yargs'

import os from 'node:os'

import * as path from 'forward-slash-path'
import yargs from 'yargs'
import {hideBin} from 'yargs/helpers'

import {defaultReposFolder} from 'lib/defaultReposFolder.js'

import * as findCommand from './command/find.js'
import * as goCommand from './command/go.js'
import * as listCommand from './command/list.js'
import * as listAccountsCommand from './command/listAccounts.js'
import * as listRemoteCommand from './command/listRemote.js'
import * as listSourcesCommand from './command/listSources.js'
import * as openInCodeCommand from './command/openInCode.js'

export type YargsOptions = Parameters<ReturnType<typeof yargs>['options']>[0]
export type GlobalArgs = InferredOptionTypes<typeof globalOptions>
const coerceStringArray = (input?: Array<string>) => {
  return input ?? []
}
const globalOptions = {
  asFolder: {
    default: path.join(defaultReposFolder, '.as'),
    description: 'folder where alt accounts repos are stored in',
    string: true,
  },
  configFile: {
    default: `${os.homedir()}/.config/repos-cli/config.yml`,
    string: true,
  },
  foreignReposFolder: {
    default: path.join(defaultReposFolder, '.foreign'),
    string: true,
  },
  forksFolder: {
    default: path.join(defaultReposFolder, '.fork'),
    string: true,
  },
  gistFolder: {
    default: path.join(defaultReposFolder, '.gist'),
    string: true,
  },
  githubCloneBackend: {
    choices: ['ssh', 'https'],
    default: 'ssh',
    string: true,
  },
  githubUser: {
    default: process.env.GITHUB_USER,
    description: 'name of the GitHub user for remote retrieval',
    string: true,
  },
  glob: {
    array: true,
    coerce: coerceStringArray,
    string: true,
  },
  parent: {
    array: true,
    coerce: coerceStringArray,
    string: true,
  },
  reposFolder: {
    default: defaultReposFolder,
    string: true,
  },
  source: {
    array: true,
    coerce: coerceStringArray,
    string: true,
  },
}
export const cli = yargs(hideBin(process.argv))
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
cli.command(goCommand)
cli.command(openInCodeCommand)
cli.command(listSourcesCommand)
cli.command(listAccountsCommand)
cli.command(listRemoteCommand)
cli.demandCommand()
cli.help()
cli.showHelpOnFail(false)
cli.wrap(Math.min(100, cli.terminalWidth()))
await cli.parseAsync()
