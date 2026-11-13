import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { expect, it } from 'vitest'
import { list } from '../server.ts'
import { link } from '../link.ts'
import type { ExtensionHost } from '../../../server/extensions.ts'

it('lists running projects and this one, with their own counts, another instance’s from its status, and one that fails without them', async () => {
  const other = createServer((request, response) => {
    response.setHeader('Content-Type', 'application/json')
    response.end(JSON.stringify({ result: { busy: 2, questions: { count: 1 } } }))
  })
  await new Promise<void>((done) => other.listen(0, '127.0.0.1', done))
  const url = `http://127.0.0.1:${(other.address() as AddressInfo).port}`
  const host = {
    projects: async () => [
      { name: 'down', current: false, running: { pid: 1, url: 'http://127.0.0.1:1' } },
      { name: 'stopped', current: false },
      { name: 'here', current: true },
      { name: 'other', current: false, running: { pid: 3, url } },
    ],
    system: () => ({ process: { url: 'http://127.0.0.1:4747' } }),
    conversations: () => [{ busy: true }, { busy: false }],
    need: () => ({ openQuestions: async () => [{}, {}, {}] }),
    want: () => undefined,
  } as unknown as ExtensionHost
  try {
    expect(await list(host, new AbortController().signal)).toEqual([
      { name: 'down', url: 'http://127.0.0.1:1', current: false },
      { name: 'here', url: 'http://127.0.0.1:4747', current: true, busy: 1, questions: 3 },
      { name: 'other', url, current: false, busy: 2, questions: 1 },
    ])
  } finally {
    other.close()
  }
})

// A page opened over Tailscale linked every tile to 127.0.0.1, the visiting device's own loopback (#1009).
it('links tiles to their tailnet URLs on a page opened over Tailscale, and leaves out the unpublished', async () => {
  // Each instance answers its `tailscale` status as it stands: one published, one with Tailscale off.
  const instance = async (tailscale: object) => {
    const server = createServer((request, response) => {
      response.setHeader('Content-Type', 'application/json')
      response.end(
        JSON.stringify({
          result: request.url?.includes('/tailscale/')
            ? tailscale
            : { busy: 0, questions: { count: 0 } },
        }),
      )
    })
    await new Promise<void>((done) => server.listen(0, '127.0.0.1', done))
    return { server, url: `http://127.0.0.1:${(server.address() as AddressInfo).port}` }
  }
  const published = await instance({ state: 'ready', url: 'https://box.example.ts.net:4750' })
  const off = await instance({ state: 'disabled', allow: [] })
  const host = {
    projects: async () => [
      { name: 'here', current: true },
      { name: 'published', current: false, running: { pid: 2, url: published.url } },
      { name: 'off', current: false, running: { pid: 3, url: off.url } },
    ],
    system: () => ({ process: { url: 'http://127.0.0.1:4747' } }),
    conversations: () => [],
    need: () => ({ openQuestions: async () => [] }),
    want: () => ({ status: () => ({ state: 'ready', url: 'https://box.example.ts.net:4747' }) }),
  } as unknown as ExtensionHost
  try {
    const projects = await list(host, new AbortController().signal)
    expect(projects.map((project) => link(project, 'box.example.ts.net'))).toEqual([
      'https://box.example.ts.net:4747',
      'https://box.example.ts.net:4750',
      undefined,
    ])
    expect(projects.map((project) => link(project, '127.0.0.1'))).toEqual([
      'http://127.0.0.1:4747',
      published.url,
      off.url,
    ])
  } finally {
    published.server.close()
    off.server.close()
  }
})
