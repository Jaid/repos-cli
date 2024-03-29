import {Chalk} from 'chalk'

export const chalk = new Chalk

export const ansiDarkOrange3 = chalk.ansi256(166)
export const ansiGold3 = chalk.ansi256(178)

export const chalkifyPath = (fileOrFolder: string): string => {
  if (!fileOrFolder.includes(`/`) && !fileOrFolder.includes(`\\`)) {
    return fileOrFolder
  }
  const lastOccurenceOfSlash = Math.max(fileOrFolder.lastIndexOf(`/`), fileOrFolder.lastIndexOf(`\\`))
  const end = fileOrFolder.slice(lastOccurenceOfSlash + 1)
  const start = fileOrFolder.slice(0, lastOccurenceOfSlash + 1)
  return `${ansiDarkOrange3(start)}${ansiGold3(end)}`
}

export const makeBubble = (text: string, color: number, paddingText: string = ``): string => {
  const frontSegment = chalk.ansi256(color)(``)
  const paddingSegment = chalk.bgAnsi256(color)(paddingText)
  const textSegment = chalk.bgAnsi256(color).black(text)
  const backSegment = chalk.ansi256(color)(``)
  return frontSegment + paddingSegment + textSegment + paddingSegment + backSegment
}
