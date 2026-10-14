export function fitParticipantGrid (
  count: number,
  width: number,
  height: number,
  gap: number
): { columns: number, width: number, height: number } {
  let best = { columns: 1, width: 0, height: 0 }
  let bestTileWidth = 0
  for (let columns = 1; columns <= count; columns++) {
    const rows = Math.ceil(count / columns)
    const tileWidth = Math.max(0, Math.min(
      (width - gap * (columns - 1)) / columns,
      (height - gap * (rows - 1)) / rows * 16 / 9
    ))
    if (tileWidth > bestTileWidth) {
      bestTileWidth = tileWidth
      best = {
        columns,
        width: tileWidth * columns + gap * (columns - 1),
        height: tileWidth * 9 / 16 * rows + gap * (rows - 1)
      }
    }
  }
  return best
}
