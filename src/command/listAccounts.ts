import type {GlobalArgs} from '../makeCli.ts'
import type {ArgumentsCamelCase, Argv, CommandBuilder} from 'yargs'

import Context from '../Context.ts'
import {LocalFinder} from '../LocalFinder.ts'

export type Args = (typeof builder) extends CommandBuilder<any, infer U> ? ArgumentsCamelCase<U> : never

export const command = 'list-accounts'
export const description = 'list all accounts (main + alts) with repo counts'
export const builder = (argv: Argv) => {
  return argv
    .options({
    })
}

export const handler = async (args: GlobalArgs & Args) => {
  const context = await Context.withConfig(args)
  const altAccounts = await context.getAlt()
  const githubUser = context.githubUser
  // Collect all accounts
  const accounts = new Map<string, number>
  // Add main account
  if (githubUser) {
    accounts.set(githubUser, 0)
  }
  // Add alt accounts
  for (const altAccount of altAccounts) {
    accounts.set(altAccount, 0)
  }
  // Get all local repos and count them by owner
  const sources = await context.gatherSources()
  const finder = LocalFinder.fromSources(sources)
  const matches = await finder.getAllMatches()
  for (const match of matches) {
    const repo = match.repo
    // Try to determine the owner from the repo
    if (repo.githubRepo) {
      const owner = repo.githubRepo.owner.login
      if (accounts.has(owner)) {
        accounts.set(owner, accounts.get(owner)! + 1)
      }
    } else {
      // For local repos without remote info, check folder structure
      const folderPath = repo.asFolder()
      let counted = false
      // Check if it's in an alt folder
      for (const [account] of accounts) {
        if (account !== githubUser && (folderPath.includes(`/.as/${account}/`) || folderPath.includes(`\\.as\\${account}\\`))) {
          accounts.set(account, accounts.get(account)! + 1)
          counted = true
          break
        }
      }
      // If not counted yet and it's in the main repos folder, count it for main user
      if (!counted && githubUser && folderPath.startsWith(context.reposFolder)) {
        const isInAltFolder = folderPath.includes('/.as/') || folderPath.includes('\\.as\\')
        const isInFork = folderPath.includes('/.fork') || folderPath.includes(String.raw`\.fork`)
        const isInGist = folderPath.includes('/.gist') || folderPath.includes(String.raw`\.gist`)
        const isInForeign = folderPath.includes('/.foreign') || folderPath.includes(String.raw`\.foreign`)
        if (!isInAltFolder && !isInFork && !isInGist && !isInForeign) {
          accounts.set(githubUser, accounts.get(githubUser)! + 1)
        }
      }
    }
  }
  // Display results
  console.log('\nAccounts:')
  console.log('─'.repeat(50))
  let totalRepos = 0
  for (const [account, count] of accounts) {
    const isMain = account === githubUser
    const label = isMain ? `${account} (main)` : account
    console.log(`${label.padEnd(30)} ${count.toString().padStart(5)} repos`)
    totalRepos += count
  }
  console.log('─'.repeat(50))
  console.log(`${'Total'.padEnd(30)} ${totalRepos.toString().padStart(5)} repos`)
}
