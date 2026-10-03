import assert from 'node:assert/strict'
import { Client } from '@elastic/elasticsearch'
import { MeasureMetricsContext, type Doc, type Ref, type WorkspaceUuid } from '@hcengineering/core'
import { ElasticAdapter } from '../adapter'

async function main (): Promise<void> {
  const url = process.env.TERON_ELASTIC_URL ?? 'http://localhost:30192'
  if (!['localhost', '127.0.0.1'].includes(new URL(url).hostname) && !new URL(url).hostname.startsWith('teron-0004-elastic-')) throw new Error('Regression requires a local disposable endpoint.')
  let ready = false
  for (let attempt = 0; attempt < 300; attempt++) {
    try { const response = await fetch(`${url}/_cluster/health`, { signal: AbortSignal.timeout(2000) }); if (response.ok) { ready = true; break } } catch {}
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  if (!ready) throw new Error('Disposable Elasticsearch did not become ready.')
  const client = new Client({ node: url })
  const adapter = new ElasticAdapter(client, 'teron_regression_literal', 'v2')
  const ctx = new MeasureMetricsContext('literal-search', {})
  const workspace = 'local-workspace' as WorkspaceUuid
  const klass = 'local:class:Document' as any
  const make = (id: string, searchTitle: string, space = 'visible') => ({ id: id as Ref<Doc>, _class: [klass], space: space as any, searchTitle, modifiedOn: 1, modifiedBy: 'local' as any })
  try {
    assert.equal(await adapter.initMapping(ctx), true)
    const rows = [make('one', 'Ação Café [100%] a+b:(c) *?\\'), make('two', 'CAFÉ final'), make('private', 'Café privado', 'hidden')]
    await adapter.updateMany(ctx, workspace, rows)
    for (const [query, ids] of [['acao', ['one']], ['ÇÃO', ['one']], ['FÉ', ['one', 'two']], ['final', ['two']], ['[100%]', ['one']], ['a+b:(c)', ['one']], ['*?\\', ['one']]] as Array<[string, string[]]>) {
      const result = await adapter.searchString(ctx, workspace, { query, spaces: ['visible'] as any }, { limit: 100 })
      assert.deepEqual(result.docs.map((doc) => doc.id).sort(), [...ids].sort(), query)
    }
    const first = await adapter.search(ctx, workspace, [klass], { $search: 'cafe', space: 'visible' as any }, 1, 0)
    const second = await adapter.search(ctx, workspace, [klass], { $search: 'cafe', space: 'visible' as any }, 1, 1)
    assert.equal(first.length, 1)
    assert.equal(second.length, 1)
    assert.notEqual(first[0].id, second[0].id)
    // Simulate a pre-migration record, then rebuild twice without replacing its index/source.
    await client.index({ index: 'teron_regression_literal_v2', id: `legacy@${workspace}`, refresh: true, body: { ...make('legacy', 'Relatório legádo'), workspaceId: workspace } })
    assert.equal(await adapter.rebuildLiteralSearch(), 1)
    assert.equal(await adapter.rebuildLiteralSearch(), 0)
    const found = await adapter.searchString(ctx, workspace, { query: 'LATOR', spaces: ['visible'] as any }, { limit: 10 })
    assert.deepEqual(found.docs.map((doc) => doc.id), ['legacy'])
    assert.equal(found.docs[0].searchTitle, 'Relatório legádo')
    await adapter.update(ctx, workspace, 'legacy' as Ref<Doc>, { searchTitle: 'Correção nova' })
    await client.indices.refresh({ index: 'teron_regression_literal_v2' })
    assert.equal((await adapter.searchString(ctx, workspace, { query: 'RECAO' }, { limit: 10 })).docs[0].id, 'legacy')
    console.log('Literal fulltext: substring, accents/case, special characters, access filters, pagination and repeated reconstruction passed.')
  } finally {
    await adapter.close()
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1 })
