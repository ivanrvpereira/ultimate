import type { RunningProject } from './refs.ts'

/**
 * Where a project's tile links: its loopback URL on a page opened on this machine, its tailnet URL on one opened over
 * Tailscale, where loopback would be the visiting device's own. Nothing when it is not published there.
 */
export function link(project: RunningProject, hostname: string) {
  return ['127.0.0.1', 'localhost', '[::1]'].includes(hostname) ? project.url : project.tailnet
}
