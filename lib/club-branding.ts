export type ClubThemeKey = 'viitorul-onesti' | 'royal-blue' | 'sunset-red'

export interface ClubTheme {
  key: ClubThemeKey
  label: string
  description: string
  logoPath?: string
  vars: Record<string, string>
}

export const clubThemes: ClubTheme[] = [
  {
    key: 'viitorul-onesti',
    label: 'Viitorul Verde',
    description: 'Alb, verde și accente premium pentru FC Viitorul Onești.',
    logoPath: '/fc-viitorul-onesti-logo.png',
    vars: {
      '--brand-50': '242 250 244',
      '--brand-100': '221 242 227',
      '--brand-200': '185 225 196',
      '--brand-300': '136 198 156',
      '--brand-400': '72 162 110',
      '--brand-500': '12 100 52',
      '--brand-600': '7 93 47',
      '--brand-700': '5 76 39',
      '--brand-800': '6 58 33',
      '--brand-900': '6 44 27',
      '--pitch': '5 50 29',
      '--surface': '245 249 245',
      '--surface-accent': '233 244 236',
      '--card': '255 255 255',
      '--muted-ring': '6 90 49',
    },
  },
  {
    key: 'royal-blue',
    label: 'Royal Blue',
    description: 'Temă rece pentru cluburi cu identitate albastru-alb.',
    vars: {
      '--brand-50': '242 246 255',
      '--brand-100': '220 232 255',
      '--brand-200': '186 209 255',
      '--brand-300': '140 177 255',
      '--brand-400': '84 137 249',
      '--brand-500': '42 102 230',
      '--brand-600': '31 80 191',
      '--brand-700': '28 65 153',
      '--brand-800': '26 53 119',
      '--brand-900': '22 43 93',
      '--pitch': '17 29 58',
      '--surface': '244 247 252',
      '--surface-accent': '231 238 250',
      '--card': '255 255 255',
      '--muted-ring': '42 102 230',
    },
  },
  {
    key: 'sunset-red',
    label: 'Sunset Red',
    description: 'Variantă energică pentru cluburi cu identitate roșu-negru.',
    vars: {
      '--brand-50': '255 245 243',
      '--brand-100': '255 227 223',
      '--brand-200': '255 199 190',
      '--brand-300': '255 160 145',
      '--brand-400': '250 104 82',
      '--brand-500': '224 70 48',
      '--brand-600': '186 51 34',
      '--brand-700': '145 42 31',
      '--brand-800': '117 38 31',
      '--brand-900': '87 31 27',
      '--pitch': '34 18 17',
      '--surface': '250 246 245',
      '--surface-accent': '244 234 231',
      '--card': '255 255 255',
      '--muted-ring': '186 51 34',
    },
  },
]

export function getDefaultThemeKeyForClub(clubName: string) {
  const normalized = clubName.toLowerCase()

  if (normalized.includes('viitorul onești') || normalized.includes('viitorul onesti')) {
    return 'viitorul-onesti' as const
  }

  return 'royal-blue' as const
}

export function getThemeByKey(key?: string | null) {
  return clubThemes.find((theme) => theme.key === key) ?? clubThemes[0]
}
