import { describe, it, expect } from 'vitest'
import { filterEmptyStrings } from './form'

describe('form utils', () => {
  describe('filterEmptyStrings', () => {
    it('removes empty string values from object', () => {
      const input = {
        name: 'test',
        email: '',
        phone: '123',
        address: '',
      }

      const result = filterEmptyStrings(input)

      expect(result).toEqual({
        name: 'test',
        phone: '123',
      })
    })

    it('preserves null and undefined values', () => {
      const input = {
        name: 'test',
        email: null,
        phone: undefined,
        age: 0,
      }

      const result = filterEmptyStrings(input)

      // filterEmptyStrings only removes empty strings, not null/undefined
      expect(result).toEqual({
        name: 'test',
        email: null,
        phone: undefined,
        age: 0,
      })
    })

    it('handles empty object', () => {
      const result = filterEmptyStrings({})
      expect(result).toEqual({})
    })

    it('preserves falsy numbers', () => {
      const input = {
        zero: 0,
        emptyString: '',
        validNumber: 42,
      }

      const result = filterEmptyStrings(input)

      expect(result).toEqual({
        zero: 0,
        validNumber: 42,
      })
    })
  })
})
