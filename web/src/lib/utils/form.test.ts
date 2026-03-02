import { describe, it, expect, vi } from 'vitest'
import { ApiError } from '@/lib/api/client'
import { filterEmptyStrings, setFormErrors, extractFieldErrors } from './form'

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

  describe('setFormErrors', () => {
    it('calls setError for each field when error is ApiError with fieldErrors', () => {
      const setError = vi.fn()
      const error = new ApiError(422, '校验失败', {
        errors: [
          { field: 'body.name', message: '必填' },
          { field: 'body.phone', message: '格式错误' },
        ],
      })
      setFormErrors(setError, error)
      expect(setError).toHaveBeenCalledTimes(2)
      expect(setError).toHaveBeenCalledWith('name', { type: 'server', message: '必填' })
      expect(setError).toHaveBeenCalledWith('phone', { type: 'server', message: '格式错误' })
    })

    it('strips body. prefix from field name', () => {
      const setError = vi.fn()
      const error = new ApiError(422, 'err', {
        errors: [{ field: 'body.address', message: '地址无效' }],
      })
      setFormErrors(setError, error)
      expect(setError).toHaveBeenCalledWith('address', { type: 'server', message: '地址无效' })
    })

    it('does not call setError when error is not ApiError', () => {
      const setError = vi.fn()
      setFormErrors(setError, new Error('network error'))
      expect(setError).not.toHaveBeenCalled()
    })

    it('does not call setError when ApiError has no fieldErrors', () => {
      const setError = vi.fn()
      const error = new ApiError(400, 'Bad request', null)
      setFormErrors(setError, error)
      expect(setError).not.toHaveBeenCalled()
    })
  })

  describe('extractFieldErrors', () => {
    it('returns record of field to message when ApiError has fieldErrors', () => {
      const error = new ApiError(422, 'err', {
        errors: [
          { field: 'body.name', message: '必填' },
          { field: 'body.phone', message: '格式错误' },
        ],
      })
      const result = extractFieldErrors(error)
      expect(result).toEqual({ name: '必填', phone: '格式错误' })
    })

    it('strips body. prefix from keys', () => {
      const error = new ApiError(422, 'err', {
        errors: [{ field: 'body.email', message: '无效邮箱' }],
      })
      expect(extractFieldErrors(error)).toEqual({ email: '无效邮箱' })
    })

    it('returns empty object when error is not ApiError', () => {
      expect(extractFieldErrors(new Error('x'))).toEqual({})
    })

    it('returns empty object when ApiError has no fieldErrors', () => {
      const error = new ApiError(400, 'Bad request', null)
      expect(extractFieldErrors(error)).toEqual({})
    })
  })
})
