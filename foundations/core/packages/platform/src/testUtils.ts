import { Loader } from './i18n'
import { IntlMessageFormat } from 'intl-messageformat'

function makeLocaleMatcher (target: object): object {
  return Object.entries(target).reduce(
    (obj, [key, value]) => ({
      ...obj,
      [key]: typeof value === 'string' ? expect.any(String) : makeLocaleMatcher(value)
    }),
    {}
  )
}

const langs = ['en', 'ru', 'pt-br']

function getPlaceholders (message: string): string[] {
  type AstNode = {
    type: number
    value?: string
    options?: Record<string, { value: AstNode[] }>
    children?: AstNode[]
  }

  const placeholders = new Set<string>()
  const visit = (nodes: AstNode[]): void => {
    for (const node of nodes) {
      if (node.type >= 1 && node.type <= 6 && node.value !== undefined) placeholders.add(node.value)
      if (node.options !== undefined) Object.values(node.options).forEach((option) => visit(option.value))
      if (node.children !== undefined) visit(node.children)
    }
  }

  visit(new IntlMessageFormat(message, 'en-US', undefined, { ignoreTag: true }).getAst() as unknown as AstNode[])
  return [...placeholders].sort()
}

function checkPlaceholders (source: object, target: object): void {
  for (const [key, value] of Object.entries(source)) {
    const translated = (target as Record<string, unknown>)[key]

    if (typeof value === 'string') {
      expect(typeof translated).toBe('string')
      expect(getPlaceholders(translated as string)).toEqual(getPlaceholders(value))
    } else {
      expect(translated).toBeDefined()
      checkPlaceholders(value, translated as object)
    }
  }
}

/**
 * @public
 * @param loader -
 * @returns
 */
export function makeLocalesTest (loader: Loader) {
  return async () => {
    const [target, ...rest] = await Promise.all(langs.map(loader))
    const matcher = makeLocaleMatcher(target)
    rest.forEach((loc) => {
      expect(loc).toMatchObject(matcher)
      checkPlaceholders(target, loc)
    })
  }
}
