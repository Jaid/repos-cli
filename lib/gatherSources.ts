import type {SourceInput} from './LocalFinder.js'
import type {GlobalArgs} from '~/src/cli.js'

import readFileYaml from 'read-file-yaml'

type GatherSourcesOptions = Pick<GlobalArgs, 'configFile' | 'foreignReposFolder' | 'forksFolder' | 'gistFolder' | 'glob' | 'parent' | 'reposFolder' | 'source'>
type Config = {
  sources?: SourceInput[]
}

export const gatherSources = async (options: GatherSourcesOptions): Promise<SourceInput[]> => {
  const sources: SourceInput[] = []
  if (options.reposFolder) {
    sources.push({
      input: options.reposFolder,
      type: `parent`,
    })
  }
  if (options.forksFolder) {
    sources.push({
      input: options.forksFolder,
      type: `parent`,
    })
  }
  if (options.gistFolder) {
    sources.push({
      input: options.gistFolder,
      type: `parent`,
    })
  }
  if (options.foreignReposFolder) {
    sources.push({
      input: `${options.foreignReposFolder}/*/*`,
      type: `glob`,
    })
  }
  for (const parent of options.parent ?? []) {
    sources.push({
      input: parent,
      type: `parent`,
    })
  }
  for (const glob of options.glob ?? []) {
    sources.push({
      input: glob,
      type: `glob`,
    })
  }
  for (const source of options.source ?? []) {
    sources.push(source)
  }
  if (options.configFile) {
    const config = <Config | undefined> await readFileYaml.default(options.configFile)
    if (config) {
      for (const source of config.sources ?? []) {
        sources.push(source)
      }
    }
  }
  return sources
}
