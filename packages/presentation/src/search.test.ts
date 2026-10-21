import type { ObjectSearchCategory } from './types'

jest.mock('@hcengineering/platform', () => ({ getResource: jest.fn() }))
jest.mock('./plugin', () => ({ __esModule: true, default: { class: { ObjectSearchCategory: 'category' } } }))
jest.mock('./utils', () => ({ getClient: jest.fn() }))

const { getResource } = require('@hcengineering/platform')
const { getClient } = require('./utils')
const { searchFor } = require('./search') as typeof import('./search')

const category = {
  _id: 'employees',
  classToSearch: 'employee-mixin',
  query: 'employee-query'
} as unknown as ObjectSearchCategory
const employees = Array.from({ length: 7 }, (_, index) => ({
  doc: { _id: `person-${index}`, _class: 'person', createdOn: 0 },
  title: `Employee ${index}`
}))
const queryEmployees = jest.fn()
const client = {
  findAll: jest.fn().mockResolvedValue([category]),
  getHierarchy: () => ({ isMixin: () => true }),
  searchFulltext: jest.fn().mockResolvedValue({ docs: [] })
}

beforeEach(() => {
  jest.clearAllMocks()
  getClient.mockReturnValue(client)
  getResource.mockResolvedValue(queryEmployees)
  queryEmployees.mockResolvedValue(employees)
})

test('bare @ lists employees without relying on the fulltext index', async () => {
  const result = await searchFor('mention', '')
  expect(queryEmployees).toHaveBeenCalledWith(client, '')
  expect(result.items).toHaveLength(5)
  expect(result.items[0]).toEqual({
    num: 0,
    category,
    item: { id: 'person-0', doc: employees[0].doc, title: 'Employee 0' }
  })
  expect(client.searchFulltext).not.toHaveBeenCalled()
})

test('employee name search preserves query and explicit limit', async () => {
  const result = await searchFor('mention', 'José', category._id, 2)
  expect(queryEmployees).toHaveBeenCalledWith(client, 'José')
  expect(result.query).toBe('José')
  expect(result.items).toHaveLength(2)
})

test('empty employee results remain empty', async () => {
  queryEmployees.mockResolvedValue([])
  expect((await searchFor('mention', 'unknown', category._id)).items).toEqual([])
})

test('ordinary classes keep fulltext search', async () => {
  client.getHierarchy = () => ({ isMixin: () => false })
  await searchFor('mention', 'task')
  expect(queryEmployees).not.toHaveBeenCalled()
  expect(client.searchFulltext).toHaveBeenCalledWith(
    { query: 'task*', classes: [category.classToSearch] },
    { limit: 5 }
  )
})
