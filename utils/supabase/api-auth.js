import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export async function getApiAuthSession() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { user: null, profile: null }
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: profile } = await supabaseAdmin
    .from('karyawan')
    .select('role, id, email')
    .eq('email', user.email)
    .maybeSingle()

  return { user, profile }
}

export async function requireRole(allowedRoles = ['admin', 'hr']) {
  const { user, profile } = await getApiAuthSession()
  if (!user) {
    return { error: 'Unauthorized', status: 401 }
  }
  if (!profile || !allowedRoles.includes(profile.role)) {
    return { error: 'Forbidden', status: 403 }
  }
  return { user, profile, error: null }
}

export async function requireAuth() {
  const { user, profile } = await getApiAuthSession()
  if (!user) {
    return { error: 'Unauthorized', status: 401 }
  }
  return { user, profile, error: null }
}

// --- IP Verification for Office Attendance ---

export async function getClientIp() {
  const headerList = await headers()
  let clientIp = headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                 headerList.get('x-real-ip') ||
                 '127.0.0.1'
  if (clientIp.includes('::ffff:')) clientIp = clientIp.replace('::ffff:', '')
  return clientIp
}

/**
 * Expand a shortened IPv6 address to its full 8-group form.
 * e.g. "2001:448a:50ac:6fc8::1" -> "2001:448a:50ac:6fc8:0000:0000:0000:0001"
 */
function expandIPv6(ip) {
  // Remove zone ID if present (e.g. %17)
  ip = ip.split('%')[0]
  
  let groups = ip.split(':')
  const emptyIdx = groups.indexOf('')
  
  if (emptyIdx !== -1) {
    // Handle :: expansion
    const before = groups.slice(0, emptyIdx)
    const after = groups.slice(emptyIdx + 1).filter(g => g !== '')
    const missing = 8 - before.length - after.length
    const fill = Array(missing).fill('0000')
    groups = [...before, ...fill, ...after]
  }
  
  return groups.map(g => g.padStart(4, '0')).join(':')
}

/**
 * Check if a client IP belongs to the office network.
 * 
 * Supports:
 * - Exact IPv4/IPv6 match (OFFICE_IP=192.168.1.1)
 * - IPv6 prefix/CIDR match (OFFICE_IP=2001:448a:50ac:6fc8::/64)
 * - Multiple IPs comma-separated (OFFICE_IP=192.168.1.1,2001:448a:50ac:6fc8::/64)
 * - Local dev loopback (127.0.0.1, ::1)
 */
export function checkIsAtOffice(clientIp) {
  // Always allow local development
  if (clientIp === '127.0.0.1' || clientIp === '::1') return true

  const officeIpRaw = process.env.OFFICE_IP
  if (!officeIpRaw) return true // If not configured, allow all (dev mode)

  const officeEntries = officeIpRaw.split(',').map(e => e.trim())

  for (const entry of officeEntries) {
    // Case 1: CIDR notation (e.g. 2001:448a:50ac:6fc8::/64)
    if (entry.includes('/')) {
      const [network, prefixLenStr] = entry.split('/')
      const prefixLen = parseInt(prefixLenStr, 10)

      if (entry.includes(':')) {
        // IPv6 CIDR
        const fullClient = expandIPv6(clientIp)
        const fullNetwork = expandIPv6(network)
        // Compare the first N hex characters (prefixLen / 4)
        const charsToCompare = Math.ceil(prefixLen / 4)
        const clientHex = fullClient.replace(/:/g, '')
        const networkHex = fullNetwork.replace(/:/g, '')
        if (clientHex.substring(0, charsToCompare) === networkHex.substring(0, charsToCompare)) {
          return true
        }
      }
      // IPv4 CIDR can be added here in the future
    }
    // Case 2: Exact match
    else if (clientIp === entry) {
      return true
    }
  }

  return false
}
