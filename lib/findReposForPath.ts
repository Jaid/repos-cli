import fs from 'fs-extra'
import {globbyStream} from 'globby'

export const findReposForPath = async (parentFolder: string): Promise<string[]> => {
  // Find all directory names in given parentFolder
  const entries = await fs.readdir(parentFolder)
  const repoFolders: string[] = []
  for (const entry of entries) {
    const entryPath = `${parentFolder}/${entry}`
    const gitFolder = `${entryPath}/.git`
    const stat = await fs.stat(gitFolder)
    if (stat.isDirectory()) {
      repoFolders.push(entry)
    }
  }
  return repoFolders
}

export const findReposInGlob = async (glob: string): Promise<string[]> => {
  const repoFolders: string[] = []
  for await (const entry of globbyStream(glob)) {
    const gitFolder = `${entry}/.git`
    const stat = await fs.stat(gitFolder)
    if (stat.isDirectory()) {
      repoFolders.push(entry.toString())
    }
  }
  return repoFolders
}
