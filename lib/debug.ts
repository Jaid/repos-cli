import type {Debugger} from 'debug'

import createDebug from 'debug'

const isVscode = process.env.VSCODE_PID !== undefined || process.env.VSCODE_INSPECTOR_OPTIONS !== undefined
if (!process.env.npm_package_name) {
  throw new Error('npm_package_name not set – script needs to run from an npm script')
}

type Debug2 = Debugger & {
  dir: (...input: Array<unknown>) => void
  prop: (name: string, value: unknown) => void
  run: (runner: () => void) => void
  runAsync: (runner: () => Promise<void>) => void
}
type Debug = Debugger & {
  dir: (...input: Array<unknown>) => void
  prop: (name: string, value: unknown) => void
  run: (runner: () => void) => void
  runAsync: (runner: () => Promise<void>) => void
}

const getTypeLabel = (value: unknown) => {
  if (Array.isArray(value)) {
    return `Array(${value.length})`
  }
  const valueType = typeof value
  if (valueType === 'object') {
    return `Object(${Object.keys((value as object)).length})`
  }
  if (value instanceof Set) {
    return `Set(${value.size})`
  }
  if (value instanceof Map) {
    return `Map(${value.size})`
  }
  if (valueType === 'string') {
    return `String(${(value as string).length})`
  }
  return valueType
}
const debug = createDebug(process.env.npm_package_name) as Debug
if (isVscode) {
  debug.log = console.debug
}
debug.run = (runner: () => void) => {
  if (!debug.enabled) {
    return
  }
  runner()
}
debug.runAsync = async (runner: () => Promise<any>) => {
  if (!debug.enabled) {
    return
  }
  await runner()
}
debug.dir = (...input) => {
  if (!debug.enabled) {
    return
  }
  console.dir(...input)
}
debug.prop = (name: string, value: unknown) => {
  if (!debug.enabled) {
    return
  }
  if (isVscode) {
    const typeLabel = getTypeLabel(value)
    console.groupCollapsed(`${name}: ${typeLabel}`)
    console.dir(value)
    console.groupEnd()
    return
  }
  debug.log('%s: %O', name, value)
}

export default debug
