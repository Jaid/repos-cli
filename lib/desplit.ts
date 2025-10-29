/**
 * Split a string by comma, trim whitespace, and filter out empty strings
 */
export const desplit = (input: string): Array<string> => {
  return input.split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

export default desplit
