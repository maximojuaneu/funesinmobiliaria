import { getAgents as getTokkoAgents, getAgentById } from './tokko'

export function toUsername(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents: á→a, é→e, etc.
    .replace(/\s+/g, '')             // remove all spaces
    .replace(/[^a-z0-9]/g, '')       // only alphanumeric
}

function toPassword(username: string): string {
  return username + '1234'
}

function getAdminNames(): string[] {
  if (process.env.ADMIN_NAMES) {
    try { return JSON.parse(process.env.ADMIN_NAMES) } catch { /* fall through */ }
  }
  return ['Maximo Juaneu', 'Fabio Juaneu']
}

const DEFAULT_TOKKO_AVATAR = 'https://static.tokkobroker.com/static/img/user.png'

function validPicture(url: string | undefined): string | null {
  if (!url || url === DEFAULT_TOKKO_AVATAR) return null
  return url
}

export interface ResolvedUser {
  username: string
  name: string
  role: 'admin' | 'agent' | 'designer'
  tokkoId: number | null
  picture: string | null
}

// Tokko users with no assigned properties — fetched individually
const DESIGNER_IDS = [43426] // Laureano Montederisia

export async function resolveLogin(username: string, password: string): Promise<ResolvedUser | null> {
  const u = username.toLowerCase().trim()

  // Always fetch Tokko agents once — used for both admin photo lookup and agent auth
  const tokkoAgents = await getTokkoAgents()

  // Admins: Maximo Juaneu, Fabio Juaneu (or ADMIN_NAMES env override)
  for (const name of getAdminNames()) {
    const adminUser = toUsername(name)
    const adminPassword = process.env.ADMIN_PASSWORD ?? 'maximo01'
    if (adminUser === u && adminPassword === password) {
      // Try to find their Tokko profile for photo
      const tokkoMatch = tokkoAgents.find(a => toUsername(a.name) === adminUser)
      return {
        username: adminUser,
        name,
        role:     'admin',
        tokkoId:  tokkoMatch?.id ?? null,
        picture:  validPicture(tokkoMatch?.picture),
      }
    }
  }

  // Regular agents: resolved live from Tokko — admins excluded
  const adminUsernames = getAdminNames().map(toUsername)
  for (const agent of tokkoAgents) {
    const agentUser = toUsername(agent.name)
    if (adminUsernames.includes(agentUser)) continue
    if (agentUser === u && toPassword(agentUser) === password) {
      return {
        username: agentUser,
        name:     agent.name,
        role:     'agent',
        tokkoId:  agent.id,
        picture:  validPicture(agent.picture),
      }
    }
  }

  // Designer accounts: Tokko users without property assignments
  for (const id of DESIGNER_IDS) {
    const agent = await getAgentById(id)
    if (!agent) continue
    const agentUser = toUsername(agent.name)
    if (agentUser === u && toPassword(agentUser) === password) {
      return {
        username: agentUser,
        name:     agent.name,
        role:     'designer',
        tokkoId:  agent.id,
        picture:  validPicture(agent.picture),
      }
    }
  }

  return null
}
