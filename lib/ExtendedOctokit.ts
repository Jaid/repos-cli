import {Octokit} from '@octokit/rest'

export type Repo = (ReturnType<typeof ExtendedOctokit.prototype.repos.listForAuthenticatedUser> extends Promise<infer U> ? U : never)['data'][0]

export class ExtendedOctokit extends Octokit {
  hasToken: boolean
  constructor(octokitOptions: ConstructorParameters<typeof Octokit>[0] = {}, token?: string) {
    const options = {
      ...octokitOptions,
    }
    if (token) {
      options.auth = token
    }
    super(options)
    this.hasToken = Boolean(token)
  }
  async listRepos(githubUser?: string): Promise<Repo[]> {
    if (this.hasToken) {
      const remoteRepoNames = await this.paginate(this.rest.repos.listForAuthenticatedUser, {
        per_page: 100,
      }, response => {
        return response.data
      })
      return remoteRepoNames
    }
    if (!githubUser) {
      throw new Error(`No GitHub user specified – Either specify $GITHUB_USER or $GITHUB_TOKEN or --github-user`)
    }
    const remoteRepoNames = await this.paginate(this.repos.listForUser, {
      per_page: 100,
      username: githubUser,
    }, response => {
      return response.data
    })
    // @ts-expect-error
    return remoteRepoNames
  }
}
