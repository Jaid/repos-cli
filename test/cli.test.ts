import {test} from 'bun:test'

import makeCli from 'src/makeCli.js'

test('list command', async () => {
  const cli = makeCli()
  await cli(['list'])
})
