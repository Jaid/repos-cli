import type {Match} from 'super-regex'
import type {OverrideProperties} from 'type-fest'

export type MatchFromObject<T> = OverrideProperties<Match, {
  namedGroups: T
}>

export type MatchFromKeys<T extends string> = MatchFromObject<Record<T, string>>
