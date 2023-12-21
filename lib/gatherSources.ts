import type {SourceInput} from './Finder.js'
import type {GlobalArgs} from '~/src/cli.js'

import readFileYaml from 'read-file-yaml'

type GatherSourcesOptions = Pick<GlobalArgs, 'configFile' | 'glob' | 'parent' | 'source'>
type Config = {
  sources?: SourceInput[]
}

export const gatherSources = async (options: GatherSourcesOptions): Promise<SourceInput[]> => {
  const sources: SourceInput[] = []
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
