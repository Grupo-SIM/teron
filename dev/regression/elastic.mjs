import { execFileSync, spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { rmSync } from 'node:fs'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const require = createRequire(resolve(root, 'dev/tool/package.json'))
const docker = (...args) => execFileSync('docker', args, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim()
const suffix = String(process.pid)
const name = `teron-0004-elastic-${suffix}`
const network = `${name}-local`
const bundle = `/tmp/${name}.cjs`
const image = 'elasticsearch:7.14.2'
docker('image', 'inspect', image, '--format', '{{.Id}}')
try {
  require('esbuild').buildSync({ entryPoints: [resolve(root, 'foundations/server/packages/elastic/src/tests/literal-search.integration.ts')], bundle: true, platform: 'node', outfile: bundle, external: ['*.node'] })
  docker('network', 'create', '--internal', network)
  docker('run', '--pull=never', '--rm', '-d', '--name', name, '--network', network, '-e', 'discovery.type=single-node', '-e', 'xpack.security.enabled=false', '-e', 'ingest.geoip.downloader.enabled=false', '-e', 'ES_JAVA_OPTS=-Xms512m -Xmx512m', image)
  const result = spawnSync('docker', ['run', '--pull=never', '--rm', '--network', network,
    '-v', `${bundle}:/regression.cjs:ro`, '-e', `TERON_ELASTIC_URL=http://${name}:9200`,
    'hardcoreeng/base-slim:v20250916', 'node', '/regression.cjs'], { cwd: root, stdio: 'inherit' })
  if (result.status !== 0) { console.error(docker('logs', '--tail', '40', name)); process.exitCode = result.status ?? 1 }

} finally {
  try { docker('rm', '-f', '-v', name) } catch {}
  try { docker('network', 'rm', network) } catch {}
  rmSync(bundle, { force: true })
}
