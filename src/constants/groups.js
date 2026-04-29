export const GROUP_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

export const GROUP_OPTIONS = GROUP_LETTERS.map((letter) => ({
  value: letter,
  label: `Grupo ${letter}`,
}))

export function getGroupStageName(groupLetter) {
  return `GRUPO ${groupLetter}`
}
