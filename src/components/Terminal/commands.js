import { CONFIG } from '../../data/config.js'
import { PROJECTS as PROJ } from '../../data/projects.js'

function progressBar(value, max = 100, width = 20) {
  const filled = Math.round((value / max) * width)
  return '[' + '█'.repeat(filled) + '░'.repeat(width - filled) + '] ' + value + '%'
}

export const COMMANDS = {
  help: () => `
┌──────────────────────────────────────────────┐
│              AVAILABLE COMMANDS               │
├──────────────────┬───────────────────────────┤
│ WHOAMI           │ About me                  │
│ PROJECTS         │ List all projects         │
│ PROJECT <n>      │ Show project detail       │
│ SKILLS           │ Skill level chart         │
│ CONTACT          │ Get in touch              │
│ STATUS           │ System status             │
│ CLEAR            │ Clear terminal            │
│ HACK             │ Try to hack me            │
│ HIRE ME          │ Make an offer             │
│ WINDOWS          │ Load Windows              │
│ MATRIX           │ Go deeper                 │
│ HELP             │ This screen               │
└──────────────────┴───────────────────────────┘
`,

  whoami: () => `
> USER PROFILE
  ┌────────────────────────────────┐
  │ NAME     : ${CONFIG.name.padEnd(20)} │
  │ ROLE     : ${CONFIG.role.padEnd(20)} │
  │ LOCATION : ${CONFIG.location.padEnd(20)} │
  └────────────────────────────────┘

  ${CONFIG.bio}

  "${CONFIG.tagline}"
`,

  projects: () => {
    let out = '\n> PROJECT DATABASE\n\n'
    PROJ.forEach((p, i) => {
      const statusColor = p.status === 'Complete' ? '✓' : '⟳'
      out += `  [${i + 1}] ${statusColor} ${p.name}\n`
      out += `      ${p.desc}\n\n`
    })
    out += '  Type PROJECT <number> for details.\n'
    return out
  },

  project: (args) => {
    const n = parseInt(args[0])
    if (!n || n < 1 || n > PROJ.length) return `\n  ERROR: Invalid project number. Use PROJECTS to list.\n`
    const p = PROJ[n - 1]
    return `
> PROJECT ${n}: ${p.name}
  ┌─────────────────────────────────────────┐
  │ STATUS  : ${p.status.padEnd(30)} │
  │ STACK   : ${p.stack.join(', ').padEnd(30)} │
  └─────────────────────────────────────────┘

  DESCRIPTION:
  ${p.desc}

  GITHUB  : ${p.github}
  DEMO    : ${p.demo}
`
  },

  skills: () => {
    let out = '\n> SKILL MATRIX\n\n'
    Object.entries(CONFIG.skills).forEach(([skill, level]) => {
      out += `  ${skill.padEnd(14)} ${progressBar(level)}\n`
    })
    return out + '\n'
  },

  contact: () => `
> CONTACT CHANNELS
  ┌────────────────────────────────────────┐
  │                                        │
  │  GITHUB  : ${CONFIG.github.padEnd(28)} │
  │  EMAIL   : ${CONFIG.email.padEnd(28)} │
  │  LINKED  : ${CONFIG.linkedin.padEnd(28)} │
  │                                        │
  └────────────────────────────────────────┘

  Open any link by clicking it.
`,

  status: () => {
    const uptime = Math.floor(Math.random() * 9999) + 1000
    const memory = Math.floor(Math.random() * 400) + 200
    const cpu = Math.floor(Math.random() * 30) + 5
    return `
> SYSTEM STATUS
  ┌──────────────────────────────┐
  │ OS       : PORTFOLIO OS v2.0 │
  │ UPTIME   : ${String(uptime).padEnd(20)} │
  │ MEMORY   : ${memory}MB / 640K          │
  │ CPU      : ${String(cpu + '%').padEnd(21)} │
  │ PROCS    : ${String(Math.floor(Math.random() * 20) + 5).padEnd(20)} │
  │ TEMP     : ${String(Math.floor(Math.random() * 20) + 60) + '°C'}                   │
  │ STATUS   : ALL SYSTEMS NOMINAL      │
  └──────────────────────────────┘
`
  },

  hack: () => '__HACK__',
  'hire me': () => '__HIRE__',
  hirme: () => '__HIRE__',

  doom: () => `\n  BAD COMMAND OR FILE NAME: "DOOM"\n  Type HELP for available commands.\n`,
  doompls: () => '__DOOM__',

  windows: () => `
> FATAL ERROR: Windows not found.
  This IS Windows.
  Wait...

  Recursive OS detected. Aborting.
  Please consult your nearest philosophy department.
`,

  matrix: () => '__MATRIX__',

  clear: () => '__CLEAR__',
}

export function parseCommand(input) {
  const trimmed = input.trim().toLowerCase()
  if (!trimmed) return null

  if (COMMANDS[trimmed]) return COMMANDS[trimmed]([])

  const parts = trimmed.split(/\s+/)
  const cmd = parts[0]
  const args = parts.slice(1)

  if (COMMANDS[cmd]) return COMMANDS[cmd](args)

  // Multi-word commands
  if (trimmed === 'hire me') return COMMANDS['hire me']([])

  return `\n  BAD COMMAND OR FILE NAME: "${input.toUpperCase()}"\n  Type HELP for available commands.\n`
}
