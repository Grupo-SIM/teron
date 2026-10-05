import { execFileSync, spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { rmSync } from 'node:fs'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const require = createRequire(resolve(root, 'dev/tool/package.json'))
const docker = (...args) => execFileSync('docker', args, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim()
const name = `teron-0004-roles-${process.pid}`
const network = `${name}-local`
const bundle = `/tmp/${name}.cjs`
const containers = []
for (const image of ['postgres:16', 'mongo:latest', 'hardcoreeng/base-slim:v20250916']) docker('image', 'inspect', image, '--format', '{{.Id}}')
try {
  require('esbuild').buildSync({ entryPoints: [resolve(root, 'server/account/src/tests/legacy-roles.integration.ts')], bundle: true, platform: 'node', outfile: bundle, external: ['*.node', 'snappy'] })
  docker('network', 'create', '--internal', network)
  for (const [suffix, image, args] of [['pg', 'postgres:16', ['-e', 'POSTGRES_PASSWORD=regression']], ['mongo', 'mongo:latest', []]]) {
    const container = `${name}-${suffix}`
    docker('run', '--pull=never', '--rm', '-d', '--name', container, '--network', network, ...args, image)
    containers.push(container)
  }
  let ready = false
  for (let attempt = 0; attempt < 120; attempt++) {
    try { docker('exec', `${name}-pg`, 'pg_isready', '-U', 'postgres'); docker('exec', `${name}-mongo`, 'mongosh', '--quiet', '--eval', 'db.runCommand({ping:1})'); ready = true; break } catch { await new Promise((resolve) => setTimeout(resolve, 1000)) }
  }
  if (!ready) throw new Error('Disposable role databases did not become ready.')
  const result = spawnSync('docker', ['run', '--pull=never', '--rm', '--network', network, '-v', `${bundle}:/regression.cjs:ro`,
    '-e', `TERON_ROLE_POSTGRES_URL=postgres://postgres:regression@${name}-pg:5432/postgres`, '-e', `TERON_ROLE_MONGO_URL=mongodb://${name}-mongo:27017`,
    'hardcoreeng/base-slim:v20250916', 'node', '/regression.cjs'], { cwd: root, stdio: 'inherit' })
  if (result.status !== 0) process.exitCode = result.status ?? 1
} finally {
  for (const container of containers.reverse()) { try { docker('rm', '-f', '-v', container) } catch {} }
  try { docker('network', 'rm', network) } catch {}
  rmSync(bundle, { force: true })
}
