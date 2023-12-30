import type {FormatInputPathObject, ParsedPath} from 'node:path'

import pathNative from 'node:path'

// From: https://github.com/sindresorhus/slash/blob/98b618f5a3bfcb5dd374b204868818845b87bb2f/index.js#L1-9
export const slash = (fileOrFolder: string) => {
  const isExtendedLengthPath = fileOrFolder.startsWith(`\\\\?\\`) // See https://learn.microsoft.com/en-us/windows/win32/fileio/naming-a-file#win32-file-namespaces:~:text=file%20I/O%2C-,the%20%22%5C%5C%3F%5C%22%20prefix,-to%20a%20path
  if (isExtendedLengthPath) {
    return fileOrFolder
  }
  return fileOrFolder.replaceAll(`\\`, `/`)
}
export const normalize = (fileOrFolder: string): string => {
  return slash(pathNative.normalize(fileOrFolder))
}
export const join = (...pathSegments: string[]): string => {
  return slash(pathNative.join(...pathSegments))
}
export const resolve = (...pathSegments: string[]): string => {
  return slash(pathNative.resolve(...pathSegments))
}
export const isAbsolute = (fileOrFolder: string): boolean => {
  fileOrFolder = slash(fileOrFolder)
  return pathNative.isAbsolute(fileOrFolder)
}
export const relative = (from: string, to: string): string => {
  return slash(pathNative.relative(from, to))
}
export const dirname = (fileOrFolder: string): string => {
  return slash(pathNative.dirname(fileOrFolder))
}
export const basename = (fileOrFolder: string, suffix?: string): string => {
  return slash(pathNative.basename(fileOrFolder, suffix))
}
export const extname = (fileOrFolder: string): string => {
  return slash(pathNative.extname(fileOrFolder))
}
export const parse = (fileOrFolder: string): ParsedPath => {
  const data = pathNative.parse(fileOrFolder)
  data.root = slash(data.root)
  data.dir = slash(data.dir)
  data.base = slash(data.base)
  data.ext = slash(data.ext)
  data.name = slash(data.name)
  return data
}
export const format = (fileOrFolderObject: FormatInputPathObject): string => {
  return slash(pathNative.format(fileOrFolderObject))
}
export const toNamespacedPath = (fileOrFolder: string): string => {
  return slash(pathNative.toNamespacedPath(fileOrFolder))
}
export const path = {
  basename,
  dirname,
  extname,
  format,
  isAbsolute,
  join,
  normalize,
  parse,
  relative,
  resolve,
  toNamespacedPath,
}
export default path
