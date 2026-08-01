export const THEME_STORAGE_KEY = 'misfire-itops-theme-v1'

export const PARADIGMS = {
  opspiral: {
    id: 'opspiral',
    short: 'OPS',
    name: 'OPSPIRAL',
    descriptor: 'NOC at 3 AM',
    consoleLabel: 'Operations console',
    nav: {
      dashboard: 'Dashboard', tickets: 'Ticket Queue', cmdb: 'CMDB', prompts: 'AI Prompts',
      tips: 'Efficiency Tips', settings: 'Settings',
    },
    overview: 'system overview',
    engine: 'MTTR-9000',
  },
  tumbleweed: {
    id: 'tumbleweed',
    short: 'TMB',
    name: 'TUMBLEWEED',
    descriptor: 'Frontier service desk',
    consoleLabel: 'Bounty board',
    nav: {
      dashboard: 'Dispatch Board', tickets: 'Bounty Ledger', cmdb: 'Trophy Wall', prompts: 'Oracle Telegraph',
      tips: 'Trail Wisdom', settings: 'Camp Rules',
    },
    overview: 'territory dispatch',
    engine: 'SNAKEOIL-9000',
  },
  kindling: {
    id: 'kindling',
    short: 'KND',
    name: 'KINDLING™',
    descriptor: 'Guided operational serenity',
    consoleLabel: 'Employee success console',
    nav: {
      dashboard: 'Wellbeing Overview', tickets: 'Opportunity Queue', cmdb: 'Growth Registry', prompts: 'Guided Suggestions',
      tips: 'Enablement Tips', settings: 'Preferences',
    },
    overview: 'alignment pulse',
    engine: 'Corporate Clarity Copilot',
  },
}

export const COLOR_SCHEMES = ['light', 'dark']

export const TEXT_SCALES = [
  { value: '0.5', label: '0.5×', description: 'Tiny' },
  { value: '1', label: '1×', description: 'Normal' },
  { value: '1.5', label: '1.5×', description: 'Large' },
  { value: '2', label: '2×', description: 'Extra large' },
]

export function isParadigm(value) {
  return Object.hasOwn(PARADIGMS, value)
}

export function isColorScheme(value) {
  return COLOR_SCHEMES.includes(value)
}

export function isTextScale(value) {
  return TEXT_SCALES.some((option) => option.value === String(value))
}
