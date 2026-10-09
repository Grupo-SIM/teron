import type { Plugin } from '@hcengineering/platform'
import type { Doc, Mixin, PluginConfiguration, Ref } from './classes'
import core from './component'
import { TxFactory } from './tx'
import { pluginFilterTx } from './utils'

describe('plugin model transaction filtering', () => {
  const factory = new TxFactory(core.account.System)
  const id = 'disabled:model:doc' as Ref<Doc>
  const create = factory.createTxCreateDoc(core.class.Doc, core.space.Model, {}, id)
  const update = factory.createTxUpdateDoc(core.class.Doc, core.space.Model, id, {})
  const mixin = factory.createTxMixin(id, core.class.Doc, core.space.Model, 'test:mixin' as Ref<Mixin<Doc>>, {})
  const remove = factory.createTxRemoveDoc(core.class.Doc, core.space.Model, id)
  const config = {
    _id: 'test:config',
    pluginId: 'disabled' as Plugin,
    transactions: [create._id],
    enabled: false
  } as PluginConfiguration
  const configs = new Map([[config._id, config]])

  it('drops later workspace updates, mixins and removal of excluded model documents', () => {
    expect(pluginFilterTx([config], configs, [create, update, mixin, remove])).toEqual([])
  })

  it('preserves genuine missing-document transactions and unrelated documents', () => {
    const other = factory.createTxCreateDoc(core.class.Doc, core.space.Model, {})
    expect(pluginFilterTx([config], configs, [update, mixin, remove, other])).toEqual([
      update, mixin, remove, other
    ])
  })

  it('preserves a retained recreation and its subsequent updates', () => {
    const recreate = factory.createTxCreateDoc(core.class.Doc, core.space.Model, {}, id)
    expect(pluginFilterTx([config], configs, [create, update, remove, recreate, update])).toEqual([
      recreate, update
    ])
  })

  it('respects class filters when the create transaction remains included', () => {
    const filteredConfig = { ...config, classFilter: [core.class.Space] }
    expect(pluginFilterTx([filteredConfig], new Map([[config._id, filteredConfig]]), [create, update])).toEqual([
      create, update
    ])
  })
})
