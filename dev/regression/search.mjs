import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import assert from 'node:assert/strict'

const root = new URL('../../', import.meta.url)
const require = createRequire(new URL('foundations/core/packages/core/package.json', root))
const ts = require('typescript')
const search = {}
const source = readFileSync(new URL('foundations/core/packages/core/src/search.ts', root), 'utf8')
runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText, { exports: search })
const docker = (...args) => execFileSync('docker', args, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim()
const mongoImage = process.env.TERON_SEARCH_MONGO_IMAGE ?? 'mongo:latest'
const postgresImage = process.env.TERON_SEARCH_POSTGRES_IMAGE ?? 'postgres:16'
// Inspect first: this runner never downloads images or touches existing DBs.
for (const image of [mongoImage, postgresImage]) docker('image', 'inspect', image, '--format', '{{.Id}}')
const suffix = String(process.pid)
const mongo = `teron-0004-search-mongo-${suffix}`
const postgres = `teron-0004-search-postgres-${suffix}`
const started = []
const quote = (value) => `'${value.replaceAll("'", "''")}'`
async function ready (name, args) {
  for (let count = 0; count < 40; count++) {
    try { docker('exec', name, ...args); return } catch { await new Promise((resolve) => setTimeout(resolve, 500)) }
  }
  throw new Error(`Disposable database ${name} did not start`)
}
try {
  docker('run', '--pull=never', '--rm', '-d', '--network=none', '--name', mongo, mongoImage)
  started.push(mongo)
  docker('run', '--pull=never', '--rm', '-d', '--network=none', '--name', postgres, '-e', 'POSTGRES_PASSWORD=regression', postgresImage)
  started.push(postgres)
  await Promise.all([
    ready(mongo, ['mongosh', '--quiet', '--eval', 'db.runCommand({ ping: 1 })']),
    ready(postgres, ['pg_isready', '-U', 'postgres'])
  ])
  const rows = [
    { _id: '1', text: 'Ação Café 50% [x].*', space: 'visible' },
    { _id: '2', text: 'Ação Café 50% [x].*', space: 'private' },
    { _id: '3', text: 'Ação CAFÉ 50% [x].*', space: 'visible' },
    { _id: '4', text: 'acao cafe 500 xxx', space: 'visible' }
  ]
  docker('exec', mongo, 'mongosh', '--quiet', '--eval', `db.fixture.insertMany(${JSON.stringify(rows)})`)
  docker('exec', postgres, 'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', '-c',
    `CREATE TABLE fixture (id text, text text, space text); INSERT INTO fixture VALUES ${rows.map((row) => `(${quote(row._id)},${quote(row.text)},${quote(row.space)})`).join(',')}`)
  for (const query of ['acao', 'ÇÃO', 'CAFÉ', '50% [x].*', '[x].*', '%', '_', '\\', "'", '500']) {
    const expected = rows.filter((row) => row.space === 'visible' && search.containsSearch(row.text, query)).map((row) => row._id)
    const mongoQuery = { text: { $regex: search.searchLiteralPattern(query), $options: 'i' }, space: 'visible' }
    const mongoResult = JSON.parse(docker('exec', mongo, 'mongosh', '--quiet', '--eval', `print(JSON.stringify(db.fixture.find(${JSON.stringify(mongoQuery)}).sort({_id:1}).toArray().map(row=>row._id)))`))
    assert.deepEqual(mongoResult, expected, `Mongo ${query}`)
    const condition = `space='visible' AND strpos(lower(regexp_replace(normalize(text, NFD), '[̀-ͯ]', '', 'g')), ${quote(search.normalizeSearch(query))}) > 0`
    const sqlResult = docker('exec', postgres, 'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', '-At', '-c', `SELECT id FROM fixture WHERE ${condition} ORDER BY id`)
    assert.deepEqual(sqlResult === '' ? [] : sqlResult.split('\n'), expected, `PostgreSQL ${query}`)
    const sqlPage = docker('exec', postgres, 'psql', '-U', 'postgres', '-At', '-c', `SELECT id FROM fixture WHERE ${condition} ORDER BY id LIMIT 1 OFFSET 1`)
    assert.equal(sqlPage, expected[1] ?? '', `PostgreSQL pagination ${query}`)
    const mongoPage = JSON.parse(docker('exec', mongo, 'mongosh', '--quiet', '--eval', `print(JSON.stringify(db.fixture.find(${JSON.stringify(mongoQuery)}).sort({_id:1}).skip(1).limit(1).toArray().map(row=>row._id)))`))
    assert.deepEqual(mongoPage, expected.slice(1, 2), `Mongo pagination ${query}`)
  }
  console.log('Literal search: 10 queries passed on disposable MongoDB and PostgreSQL, including filters and pagination.')
} finally {
  for (const name of started.reverse()) docker('rm', '-fv', name)
}
