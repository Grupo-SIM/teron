import { translate } from '@hcengineering/platform'
import { inlineCommandsConfig, mInsertTable } from './extensions'

jest.mock('@hcengineering/platform', () => {
  const actual = jest.requireActual('@hcengineering/platform')
  return {
    ...actual,
    translate: jest.fn(async (label: string) => label.split(':').pop())
  }
})

jest.mock('@hcengineering/theme', () => ({
  themeStore: { subscribe: (run: any) => { run({ language: 'pt-br' }); return () => {} } }
}))
jest.mock('@hcengineering/ui', () => ({ IconScribble: {} }))
jest.mock('@hcengineering/view', () => ({
  __esModule: true,
  default: { icon: {} }
}))
jest.mock('./InlineCommandsList.svelte', () => ({}))
jest.mock('./node-view', () => ({ SvelteRenderer: jest.fn() }))
jest.mock('svelte/store', () => ({
  get: (store: any) => {
    let value: any
    store.subscribe((current: any) => { value = current })()
    return value
  }
}))

describe('inline command labels', () => {
  it('translates every command using a defined public string identifier', async () => {
    const config = inlineCommandsConfig(jest.fn())
    const items = await config.suggestion?.items?.({} as any)

    expect(items).toHaveLength(7)
    expect(items?.map((item: any) => item.text)).toEqual([
      'Image', 'Table', 'CodeBlock', 'SeparatorLine', 'TodoItem', 'DrawingBoard', 'MermaidDiargram'
    ])
    expect(translate).toHaveBeenCalledWith('text-editor:string:Image', {}, 'pt-br')
  })

  it('keeps table size labels from the resource catalog', () => {
    expect(mInsertTable).toHaveLength(10)
    expect(mInsertTable.every(({ label }) => typeof label === 'string' && label.length > 0)).toBe(true)
  })

  it('excludes commands unavailable in the editor', async () => {
    const config = inlineCommandsConfig(jest.fn(), ['image'])
    const items = await config.suggestion?.items?.({} as any)

    expect(items).toHaveLength(6)
    expect(items?.some((item: any) => item.id === 'image')).toBe(false)
  })
})
