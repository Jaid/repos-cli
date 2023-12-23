import type {LocalResult, Options} from './findAnywhere.js'

import {cloneFromFindResult} from './clone.js'
import {findAnywhere} from './findAnywhere.js'

export const findOrClone = async (args: Options, needle?: string) => {
  const result = await findAnywhere(args, needle)
  if (!result) {
    return
  }
  if (result.source === `local`) {
    return result
  }
  await cloneFromFindResult(args, result)
  const findAgainResult = await findAnywhere(args, needle)
  if (!findAgainResult) {
    throw new Error(`Could not find repo after cloning`)
  }
  return <LocalResult> findAgainResult
}
