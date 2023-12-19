import type {SourceInput} from './Finder.js'
import type {GlobalArgs} from '~/src/cli.js'

import readFileYaml from 'read-file-yaml'

type GatherSourcesOptions = {
  configFile?: string
  globSources?: string[]
  parentSources?: string[]
  typelessSources?: string[]
}
type Config = {
  sources?: SourceInput[]
}

export const gatherSources = async (options: GatherSourcesOptions): Promise<SourceInput[]> => {
  const sources: SourceInput[] = []
  for (const parent of options.parentSources ?? []) {
    sources.push({
      input: parent,
      type: `parent`,
    })
  }
  for (const glob of options.globSources ?? []) {
    sources.push({
      input: glob,
      type: `glob`,
    })
  }
  for (const source of options.typelessSources ?? []) {
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

export const gatherSourcesFromArgs = async (args: GlobalArgs): Promise<SourceInput[]> => {
  return gatherSources({
    configFile: args.configFile,
    globSources: <string[]> args.glob,
    parentSources: <string[]> args.parent,
    typelessSources: <string[]> args.source,
  })
}
