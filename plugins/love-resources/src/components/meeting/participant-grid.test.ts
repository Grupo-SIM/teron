import { fitParticipantGrid } from './participant-grid'

describe('participant grid', () => {
  test('fits participants above controls across window sizes and participant counts', () => {
    for (const [width, height] of [[1256, 608], [1920, 900], [360, 480], [800, 250]]) {
      for (const count of [1, 2, 5, 6, 9, 16, 25, 64, 100]) {
        const grid = fitParticipantGrid(count, width, height, 16)
        expect(grid.width).toBeLessThanOrEqual(width + 0.001)
        expect(grid.height).toBeLessThanOrEqual(height + 0.001)
        expect(grid.width).toBeGreaterThan(0)
        const tileWidth = (grid.width - 16 * (grid.columns - 1)) / grid.columns
        const rows = Math.ceil(count / grid.columns)
        expect(grid.height).toBeCloseTo(tileWidth * 9 / 16 * rows + 16 * (rows - 1))
      }
    }
  })

  test('uses three columns for six participants in a wide room', () => {
    expect(fitParticipantGrid(6, 1256, 608, 16).columns).toBe(3)
  })

  test('handles empty rooms and containers before measurement', () => {
    expect(fitParticipantGrid(0, 1256, 608, 16)).toEqual({ columns: 1, width: 0, height: 0 })
    expect(fitParticipantGrid(6, 0, 0, 16)).toEqual({ columns: 1, width: 0, height: 0 })
  })
})
