import chunter, { type Channel } from '@hcengineering/chunter'
import { getChannelDisplayName } from './channel-title'

describe('channel display names without the model plugin', () => {
  const channel = (_id: string, name: string): Channel => ({ _id, name } as Channel)

  it('localizes the legacy default channel using its public ID', () => {
    expect(getChannelDisplayName(channel('chunter:space:Random', 'random'))).toBe('Aleatório')
    expect(chunter.space.Random).toBe('chunter:space:Random')
    expect(chunter.space.General).toBe('chunter:space:General')
  })

  it('preserves custom channel names, including channels named random', () => {
    expect(getChannelDisplayName(channel('custom-channel', 'random'))).toBe('random')
    expect(getChannelDisplayName(channel('custom-channel', 'Equipe'))).toBe('Equipe')
    expect(getChannelDisplayName(channel('chunter:space:Random', 'Renomeado'))).toBe('Renomeado')
    expect(getChannelDisplayName(channel('chunter:space:General', 'general'))).toBe('general')
  })
})
