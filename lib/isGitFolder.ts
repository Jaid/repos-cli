import * as path from 'forward-slash-path'
import fs from 'fs-extra'

export const isGitFolder = async (folder: string) => {
  const gitFolder = path.join(folder, '.git', 'HEAD')
  return fs.pathExists(gitFolder)
}
