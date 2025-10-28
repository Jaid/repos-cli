import fs from 'fs-extra'

import path from 'lib/commonPath.js'

export const isGitFolder = async (folder: string) => {
  const gitFolder = path.join(folder, '.git', 'HEAD')
  return fs.pathExists(gitFolder)
}
