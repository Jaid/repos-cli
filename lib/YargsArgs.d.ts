import type {OmitIndexSignature, Simplify} from 'type-fest'
import type {ArgumentsCamelCase, Argv, InferredOptionTypes} from 'yargs'

export type YargsArgs<Builder>
  = Builder extends (argv: Argv<any>) => Argv<infer InferredArgs>
    ? Simplify<Omit<OmitIndexSignature<ArgumentsCamelCase<InferredArgs>>, DefaultKeys>>
    : Builder extends Record<string, unknown>
      ? Simplify<Omit<OmitIndexSignature<ArgumentsCamelCase<InferredOptionTypes<Builder>>>, DefaultKeys>>
      : never

type DefaultKeys = '$0' | '_'
