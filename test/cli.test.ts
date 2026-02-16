import {test} from 'bun:test'

import makeCli from 'src/makeCli.ts'

test('list command', async () => {
  const cli = makeCli()
  await cli(['list'])
})
