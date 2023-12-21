import os from 'node:os'

export const defaultReposFolder = process.env.reposFolder ?? `${os.homedir()}/git`
