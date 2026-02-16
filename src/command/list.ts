import type {GlobalArgs} from '../makeCli.ts'
import type {ArgumentsCamelCase, Argv, CommandBuilder} from 'yargs'

import getFolderSize from 'get-folder-size'
import * as lodash from 'lodash-es'

import {chalk, makeBubble} from 'lib/chalk.ts'
import {desplit} from 'lib/desplit.ts'

import Context from '../Context.ts'
import {LocalFinder} from '../LocalFinder.ts'
import {Repo} from '../Repo.ts'

export type Args = (typeof builder) extends CommandBuilder<any, infer U> ? ArgumentsCamelCase<U> : never

export const command = 'list'
export const description = 'load tasks from a YAML file'
export const builder = (argv: Argv) => {
  return argv
    .options({
      extended: {
        description: 'extended output that contains git status and fork status. Can be true or a comma-separated list of bubble IDs (behind,ahead,conflicts,modified,archived,inactive,large,fork-behind)',
        string: true,
        coerce: (value: boolean | string | undefined) => {
          // If not provided or empty string, return true (show all bubbles)
          if (value === undefined || value === '' || value === true) {
            return true
          }
          //  If explicitly false, return false
          if (value === 'false' || value === false) {
            return false
          }
          // Otherwise, it's a string list
          return value
        },
      },
      onlyDirty: {
        boolean: true,
        default: false,
        description: 'only show dirty repos',
      },
      onlyUnsync: {
        boolean: true,
        default: false,
        description: 'only show unsynced repos',
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
  let enabledBubbles: Array<string> | 'all' = 'all'
  if (typeof args.extended === 'string') {
    enabledBubbles = desplit(args.extended)
  } else if (!args.extended) {
    enabledBubbles = []
  }
  const isBubbleEnabled = (bubbleId: string) => {
    if (enabledBubbles === 'all') {
      return true
    }
    return enabledBubbles.includes(bubbleId)
  }
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
          process.stdout.write(' | ')
          process.stdout.write(chalk.ansi256(color)(text))
          return
        }
        process.stdout.write(' ')
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
        const bubbleData: Record<string, {color: number
          icon?: string
          text: string} | null> = {
          behind: status.behind ? {
            text: String(status.behind),
            icon: '󰜮',
            color: 81,
          } : null,
          ahead: status.ahead ? {
            text: String(status.ahead),
            icon: '󰜷',
            color: 85,
          } : null,
          conflicts: !lodash.isEmpty(status.conflicted) ? {
            text: String(status.conflicted.length),
            icon: '󰞇',
            color: 160,
          } : null,
          modified: modifiedLength ? {
            text: String(modifiedLength),
            icon: '',
            color: 210,
          } : null,
          archived: repo.githubRepo?.archived ? {
            text: 'RIP',
            icon: '🪦',
            color: 240,
          } : null,
          inactive: null,
          large: null,
          'fork-behind': null,
        }
        if (repo.githubRepo?.pushed_at) {
          const lastPushDate = new Date(repo.githubRepo.pushed_at)
          const now = new Date
          const yearsSinceLastPush = (now.getTime() - lastPushDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
          if (yearsSinceLastPush >= 1) {
            const years = Math.floor(yearsSinceLastPush)
            bubbleData.inactive = {
              text: `${years}y`,
              icon: '💤',
              color: 39,
            }
          }
        }
        const repoFolder = repo.asFolder()
        if (repoFolder) {
          const folderSize = await getFolderSize.loose(repoFolder)
          const sizeInGb = folderSize / 1_000_000_000
          if (sizeInGb >= 1) {
            bubbleData.large = {
              text: `${sizeInGb.toFixed(1)} gb`,
              icon: '⚖️',
              color: 202,
            }
          }
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
          const isForeign = await context.isRepoForeign(githubRepo)
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
          bubbleData['fork-behind'] = {
            text: String(behindBy),
            icon: '',
            color: 81,
          }
        }
        const bubbleOrder = enabledBubbles === 'all' ? ['behind', 'ahead', 'conflicts', 'modified', 'archived', 'inactive', 'large', 'fork-behind'] : enabledBubbles
        for (const bubbleId of bubbleOrder) {
          if (isBubbleEnabled(bubbleId) && bubbleData[bubbleId]) {
            const bubble = bubbleData[bubbleId]
            addSegment(bubble.text, bubble.icon, bubble.color)
          }
        }
      }
    }
    process.stdout.write('\n')
  }
}
