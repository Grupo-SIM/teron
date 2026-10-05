import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cpSync, rmSync, writeFileSync } from 'node:fs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const require = createRequire(resolve(root, 'dev/tool/package.json'))
const esbuild = require('esbuild')

function run (args, cwd = root, env = {}) {
  const result = spawnSync(process.execPath, args, {
    cwd,
    env: { ...process.env, ...env },
    stdio: 'inherit'
  })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

// Installed dependencies only. No image build/push, deployment or database command.
run(['common/scripts/install-run-rush.js', 'build',
  '--to', '@hcengineering/pod-account', '--to', '@hcengineering/pod-workspace',
  '--to', '@hcengineering/pod-server', '--to', '@hcengineering/pod-front',
  '--to', '@hcengineering/pod-collaborator', '--to', '@hcengineering/tool'])

for (const pod of ['account', 'workspace', 'server', 'front', 'collaborator']) {
  run(['../../common/scripts/esbuild.js', '--entry=src/__start.ts', '--keep-names=true',
    '--define=MODEL_VERSION', '--define=VERSION', '--sourcemap=external',
    '--external=*.node', '--external=snappy', '--external=sharp'], resolve(root, `pods/${pod}`))
}

const modelFile = resolve(root, 'pods/server/bundle/get-model.js')
esbuild.buildSync({
  entryPoints: [resolve(root, 'pods/server/src/get-model.ts')],
  bundle: true,
  platform: 'node',
  outfile: modelFile,
  define: { 'process.env.MODEL_VERSION': '"0.7.426"', 'process.env.VERSION': '"regression"' }
})
const model = spawnSync(process.execPath, [modelFile], { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
if (model.status !== 0) throw new Error(model.stderr)
JSON.parse(model.stdout)
writeFileSync(resolve(root, 'pods/server/bundle/model.json'), model.stdout)
rmSync(modelFile)

run(['node_modules/webpack-cli/bin/cli.js', '--config', '../regression/webpack.config.cjs', '--stats=errors-warnings'],
  resolve(root, 'dev/prod'), {
    NODE_PATH: resolve(root, 'dev/prod/node_modules'),
    NODE_ENV: 'production',
    NODE_OPTIONS: '--max-old-space-size=3072'
  })

cpSync(resolve(root, 'dev/prod/public/teron'), resolve(root, 'dev/prod/dist/teron'), { recursive: true })
cpSync(resolve(root, 'dev/regression/branding.json'), resolve(root, 'dev/prod/dist/regression-branding.json'))

for (const suite of ['simplification', 'adjustments', 'office-invite-fixture']) esbuild.buildSync({
  entryPoints: [resolve(root, `dev/tool/tests/${suite}.ts`)],
  bundle: true,
  platform: 'node',
  outfile: resolve(root, `dev/tool/bundle/${suite}.cjs`),
  external: ['*.node', 'snappy'],
  define: { 'process.env.MODEL_VERSION': '"0.7.426"' }
})
