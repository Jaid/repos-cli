import type {YargsArgs} from 'lib/YargsArgs.js'
import type {FirstParameter} from 'more-types'

import os from 'node:os'

import * as path from 'forward-slash-path'
import {makeCli} from 'zeug'

import {defaultReposFolder} from 'lib/defaultReposFolder.js'

import * as findCommand from './command/find.js'
import * as goCommand from './command/go.js'
import * as listCommand from './command/list.js'
import * as listAccountsCommand from './command/listAccounts.js'
import * as listRemoteCommand from './command/listRemote.js'
import * as listSourcesCommand from './command/listSources.js'
import * as openInCodeCommand from './command/openInCode.js'

export type GlobalArgs = YargsArgs<typeof globalOptions>
const coerceStringArray = (input?: Array<string>) => {
  return input ?? []
}
const globalOptions = {
  alt: {
    array: true,
    coerce: coerceStringArray,
    description: 'alt account names to include',
    string: true,
  },
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

export default (additionalOptions: FirstParameter<typeof makeCli> = {}) => {
  return makeCli({
    command: [
      listCommand,
      findCommand,
      goCommand,
      openInCodeCommand,
      listSourcesCommand,
      listAccountsCommand,
      listRemoteCommand,
    ],
    strict: true,
    options: globalOptions,
    ...additionalOptions,
  })
}
