export const monthLabels = [
  'Ianuarie',
  'Februarie',
  'Martie',
  'Aprilie',
  'Mai',
  'Iunie',
  'Iulie',
  'August',
  'Septembrie',
  'Octombrie',
  'Noiembrie',
  'Decembrie',
]

export function monthToLabel(month: number) {
  return monthLabels[month - 1] ?? `Luna ${month}`
}

export function labelToMonth(label: string) {
  const index = monthLabels.findIndex((entry) => entry === label)
  return index >= 0 ? index + 1 : new Date().getMonth() + 1
}

export function getMonthOptions() {
  return monthLabels.map((label, index) => ({
    value: index + 1,
    label,
  }))
}
