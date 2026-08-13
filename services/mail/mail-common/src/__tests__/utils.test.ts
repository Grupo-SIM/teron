//
// Copyright © 2025 Hardcore Engineering Inc.
//
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
//

import { getEmailMessageIdFromTeronId, getTeronIdFromEmailMessageId, isTeronEmailMessageId } from '../utils'

describe('Email Message ID Conversion', () => {
  describe('getEmailMessageIdFromTeronId', () => {
    it('should convert Teron ID to email Message-ID format', () => {
      const teronId = 'msg_123456789abcdef'
      const email = 'user@example.com'
      const result = getEmailMessageIdFromTeronId(teronId, email)
      expect(result).toBe('<msg_123456789abcdef@example.com>')
    })

    it('should handle different domains', () => {
      const teronId = 'teron_message_001'
      const email = 'admin@company.org'
      const result = getEmailMessageIdFromTeronId(teronId, email)
      expect(result).toBe('<teron_message_001@company.org>')
    })

    it('should handle subdomain emails', () => {
      const teronId = 'test_msg'
      const email = 'support@mail.example.com'
      const result = getEmailMessageIdFromTeronId(teronId, email)
      expect(result).toBe('<test_msg@mail.example.com>')
    })

    it('should handle complex Teron IDs', () => {
      const teronId = 'channel_123_thread_456_msg_789'
      const email = 'team@startup.io'
      const result = getEmailMessageIdFromTeronId(teronId, email)
      expect(result).toBe('<channel_123_thread_456_msg_789@startup.io>')
    })

    it('should throw error for invalid email', () => {
      const teronId = 'msg_123'
      const invalidEmail = 'not-an-email'
      expect(() => getEmailMessageIdFromTeronId(teronId, invalidEmail)).toThrow('Invalid email address')
    })
  })

  describe('getTeronIdFromEmailMessageId', () => {
    it('should extract Teron ID from email Message-ID', () => {
      const messageId = '<msg_123456789abcdef@example.com>'
      const email = 'user@example.com'
      const result = getTeronIdFromEmailMessageId(messageId, email)
      expect(result).toBe('msg_123456789abcdef')
    })

    it('should handle Message-ID without angle brackets', () => {
      const messageId = 'msg_123456789abcdef@example.com'
      const email = 'user@example.com'
      const result = getTeronIdFromEmailMessageId(messageId, email)
      expect(result).toBe('msg_123456789abcdef')
    })

    it('should return undefined for non-matching domain', () => {
      const messageId = '<msg_123@example.com>'
      const email = 'user@different.com'
      const result = getTeronIdFromEmailMessageId(messageId, email)
      expect(result).toBeUndefined()
    })

    it('should handle complex domains', () => {
      const messageId = '<channel_123_thread_456@mail.company.org>'
      const email = 'admin@mail.company.org'
      const result = getTeronIdFromEmailMessageId(messageId, email)
      expect(result).toBe('channel_123_thread_456')
    })

    it('should handle empty Teron ID part', () => {
      const messageId = '<@example.com>'
      const email = 'user@example.com'
      const result = getTeronIdFromEmailMessageId(messageId, email)
      expect(result).toBe('')
    })

    it('should return undefined for standard email Message-IDs', () => {
      const messageId = '<CABc1234567890abcdef@mail.gmail.com>'
      const email = 'user@example.com'
      const result = getTeronIdFromEmailMessageId(messageId, email)
      expect(result).toBeUndefined()
    })

    it('should handle multiple @ symbols in Message-ID', () => {
      const messageId = '<msg@test@example.com>'
      const email = 'user@example.com'
      const result = getTeronIdFromEmailMessageId(messageId, email)
      expect(result).toBe('msg@test')
    })

    it('should throw error for invalid email', () => {
      const messageId = '<msg_123@example.com>'
      const invalidEmail = 'not-an-email'
      expect(() => getTeronIdFromEmailMessageId(messageId, invalidEmail)).toThrow('Invalid email address')
    })
  })

  describe('isTeronEmailMessageId', () => {
    it('should return true for valid Teron Message-ID', () => {
      const messageId = '<msg_123456789abcdef@example.com>'
      const email = 'user@example.com'
      const result = isTeronEmailMessageId(messageId, email)
      expect(result).toBe(true)
    })

    it('should return false for non-matching domain', () => {
      const messageId = '<msg_123@example.com>'
      const email = 'user@different.com'
      const result = isTeronEmailMessageId(messageId, email)
      expect(result).toBe(false)
    })

    it('should return false for standard email Message-IDs', () => {
      const messageId = '<CABc1234567890abcdef@mail.gmail.com>'
      const email = 'user@example.com'
      const result = isTeronEmailMessageId(messageId, email)
      expect(result).toBe(false)
    })

    it('should return true for Message-ID without angle brackets', () => {
      const messageId = 'msg_123456789abcdef@example.com'
      const email = 'user@example.com'
      const result = isTeronEmailMessageId(messageId, email)
      expect(result).toBe(true)
    })
  })

  describe('Round-trip conversion', () => {
    it('should preserve Teron ID through round-trip conversion', () => {
      const originalTeronId = 'msg_123456789abcdef'
      const email = 'user@example.com'

      const messageId = getEmailMessageIdFromTeronId(originalTeronId, email)
      const extractedTeronId = getTeronIdFromEmailMessageId(messageId, email)

      expect(extractedTeronId).toBe(originalTeronId)
    })

    it('should work with complex Teron IDs', () => {
      const originalTeronId = 'channel_abc123_thread_def456_msg_789xyz'
      const email = 'team@company.com'

      const messageId = getEmailMessageIdFromTeronId(originalTeronId, email)
      const extractedTeronId = getTeronIdFromEmailMessageId(messageId, email)

      expect(extractedTeronId).toBe(originalTeronId)
    })

    it('should work with subdomain emails', () => {
      const originalTeronId = 'notification_001'
      const email = 'alerts@mail.platform.io'

      const messageId = getEmailMessageIdFromTeronId(originalTeronId, email)
      const extractedTeronId = getTeronIdFromEmailMessageId(messageId, email)

      expect(extractedTeronId).toBe(originalTeronId)
    })
  })

  describe('Edge cases', () => {
    it('should handle Teron ID with special characters', () => {
      const teronId = 'msg-123_test.001'
      const email = 'user@example.com'

      const messageId = getEmailMessageIdFromTeronId(teronId, email)
      expect(messageId).toBe('<msg-123_test.001@example.com>')

      const extractedTeronId = getTeronIdFromEmailMessageId(messageId, email)
      expect(extractedTeronId).toBe(teronId)
    })

    it('should handle very long Teron IDs', () => {
      const teronId = 'very_long_teron_id_with_many_segments_and_characters_123456789abcdef'
      const email = 'user@example.com'

      const messageId = getEmailMessageIdFromTeronId(teronId, email)
      const extractedTeronId = getTeronIdFromEmailMessageId(messageId, email)

      expect(extractedTeronId).toBe(teronId)
    })

    it('should handle empty Teron ID', () => {
      const teronId = ''
      const email = 'user@example.com'

      const messageId = getEmailMessageIdFromTeronId(teronId, email)
      expect(messageId).toBe('<@example.com>')

      const extractedTeronId = getTeronIdFromEmailMessageId(messageId, email)
      expect(extractedTeronId).toBe('')
    })
  })
})
