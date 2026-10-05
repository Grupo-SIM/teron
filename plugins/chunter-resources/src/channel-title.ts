import chunter, { type Channel } from '@hcengineering/chunter'

export function getChannelDisplayName (channel: Channel): string {
  return channel._id === chunter.space.Random && channel.name === 'random' ? 'Aleatório' : channel.name
}
