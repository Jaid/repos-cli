import type {ArgumentsCamelCase, Argv, CommandBuilder} from 'yargs'

export type Args = (typeof builder) extends CommandBuilder<any, infer U> ? ArgumentsCamelCase<U> : never

export const command = `list`
export const description = `load tasks from a YAML file`
export const builder = (argv: Argv) => {
  return argv
    .options({
      glob: {
        array: true,
        string: true,
      },
    })
}

export const handler = async (args: Args) => {
  const api = new InvokeServer
  const data = <InvokeTaskOptions> await readFileYaml.default(args.file)
  if (!data) {
    throw new Error(`No data in ${args.file}`)
  }
  const dataMerged = {
    ...args,
    ...data,
  }
  const batch = InvokeTaskBatch.fromData(dataMerged)
  console.log(`Sending ${batch.tasks.length} tasks to ${api.options.domain}`)
  await api.queueAllOptimized(batch)
}
