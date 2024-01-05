import type {GlobalArgs} from '../cli.js'
import type {ArgumentsCamelCase, Argv, CommandBuilder} from 'yargs'

import * as lodash from 'lodash-es'

import {chalk, makeBubble} from '~/lib/chalk.js'
import {LocalFinder} from '~/src/LocalFinder.js'

import Context from '../Context.js'
import {Repo} from '../Repo.js'

export type Args = (typeof builder) extends CommandBuilder<any, infer U> ? ArgumentsCamelCase<U> : never

export const command = `list`
export const description = `load tasks from a YAML file`
export const builder = (argv: Argv) => {
  return argv
    .options({
      extended: {
        boolean: true,
        default: false,
        description: `extended output that contains git status and fork status`,
      },
      onlyDirty: {
        boolean: true,
        default: false,
        description: `only show dirty repos`,
      },
      onlyUnsync: {
        boolean: true,
        default: false,
        description: `only show unsynced repos`,
      },
    })
}

export const handler = async (args: GlobalArgs & Args) => {
  const context = await Context.withConfig(args)
  const sources = await context.gatherSources()
  const finder = LocalFinder.fromSources(sources)
  const matches = await finder.getAllMatches()
  const needsGitStatus = args.extended || args.onlyDirty || args.onlyUnsync
  const useBubbles = true
  for (const match of matches) {
    const repo = match.repo
    process.stdout.write(repo.getAnsiFolder())
    if (needsGitStatus) {
      const addSegment = (segment: string, icon?: string, color?: number) => {
        const text = icon ? `${icon} ${segment}` : segment
        if (!color) {
          addSegment(text, icon, 0)
          return
        }
        if (!useBubbles) {
          process.stdout.write(` | `)
          process.stdout.write(chalk.ansi256(color)(text))
          return
        }
        process.stdout.write(` `)
        process.stdout.write(makeBubble(text, color))
      }
      const git = repo.getSimpleGit()
      const status = await git.status()
      if (args.onlyUnsync && !status.behind && !status.ahead) {
        continue
      }
      const modifiedLength = status.modified.length + status.created.length + status.deleted.length + status.renamed.length + status.not_added.length
      if (args.onlyDirty && !modifiedLength) {
        continue
      }
      if (args.extended) {
        if (status.behind) {
          addSegment(String(status.behind), `󰜮`, 81)
        }
        if (status.ahead) {
          addSegment(String(status.ahead), `󰜷`, 85)
        }
        if (!lodash.isEmpty(status.conflicted)) {
          addSegment(String(status.conflicted.length), `󰞇`, 160)
        }
        if (modifiedLength) {
          addSegment(String(modifiedLength), ``, 210)
        }
        const getCommitsBehindCount = async () => {
          const githubSlug = await repo.getGithubSlug()
          if (!githubSlug) {
            return
          }
          const octokit = await context.getOctokit()
          const foundRepo = await octokit.findRepo(githubSlug.repo, githubSlug.owner)
          if (!foundRepo) {
            return
          }
          const githubRepo = Repo.fromRemote(foundRepo)
          const isForeign = context.isRepoForeign(githubRepo)
          if (isForeign) {
            return
          }
          if (!githubRepo.isFork()) {
            return
          }
          const comparison = await octokit.repos.compareCommitsWithBasehead({
            basehead: githubRepo.getBasehead()!,
            owner: githubSlug.owner,
            repo: githubSlug.repo,
          })
          const behindBy = comparison.data.behind_by
          return behindBy
        }
        const behindBy = await getCommitsBehindCount()
        if (behindBy) {
          addSegment(String(behindBy), ``, 81)
        }
      }
    }
    process.stdout.write(`\n`)
  }
}
