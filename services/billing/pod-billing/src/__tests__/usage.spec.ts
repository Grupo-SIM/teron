//
// Copyright © 2026 Hardcore Engineering Inc.
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

import { computeLimitsExceededSince, isUsageLimitExceeded } from '../usage'

describe('computeLimitsExceededSince', () => {
  const now = 1_700_000_000_000

  it('returns undefined when not exceeded', () => {
    expect(computeLimitsExceededSince(undefined, false, now)).toBeUndefined()
  })

  it('clears the timestamp when usage drops back under the limit', () => {
    expect(computeLimitsExceededSince(now - 60_000, false, now)).toBeUndefined()
  })

  it('starts the timestamp at "now" on the first over-limit observation', () => {
    expect(computeLimitsExceededSince(undefined, true, now)).toBe(now)
  })

  it('preserves the existing timestamp on subsequent over-limit observations', () => {
    const earlier = now - 60_000
    expect(computeLimitsExceededSince(earlier, true, now)).toBe(earlier)
  })
})

describe('isUsageLimitExceeded', () => {
  it('treats zero as unlimited', () => {
    expect(isUsageLimitExceeded(Number.MAX_SAFE_INTEGER, 0)).toBe(false)
  })

  it('enforces positive limits', () => {
    expect(isUsageLimitExceeded(10, 10)).toBe(false)
    expect(isUsageLimitExceeded(11, 10)).toBe(true)
  })
})
