import { TokenDetails } from 'types'
import { AssertionError } from 'assert'
import { AuctionElement } from 'api/exchange/ExchangeApi'
import { batchIdToDate } from './time'
import { ONE_HUNDRED } from 'const'

export function assertNonNull<T>(val: T, message: string): asserts val is NonNullable<T> {
  if (val === undefined || val === null) {
    throw new AssertionError({ message })
  }
}

// eslint-disable-next-line
function noop(..._args: any[]): void {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const log = process.env.NODE_ENV === 'test' ? noop : (...args: any[]): void => console.log(...args)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const debug = process.env.NODE_ENV === 'development' ? noop : (...args: any[]): void => console.log(...args)

export function getToken<T extends TokenDetails, K extends keyof T>(
  key: K,
  value: string | number | undefined = '',
  tokens: T[] | undefined | null,
): T | undefined {
  return (tokens || []).find((token: T): boolean => {
    const tokenKeyValue = token[key]
    if (tokenKeyValue) {
      switch (typeof tokenKeyValue) {
        case 'string':
          return tokenKeyValue.toUpperCase() === (value as string).toUpperCase()
        case 'number':
          return tokenKeyValue === value
        default:
          return false
      }
    } else {
      return false
    }
  })
}

export const delay = <T>(ms = 100, result?: T): Promise<T> => new Promise(resolve => setTimeout(resolve, ms, result))

/**
 * Uses images from https://github.com/trustwallet/tokens
 */
export function getImageUrl(tokenAddress?: string): string | undefined {
  if (!tokenAddress) return undefined
  return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${tokenAddress}/logo.png`
}

export const isOrderActive = (order: AuctionElement, now: Date): boolean => batchIdToDate(order.validUntil) >= now

export function isOrderFilled(order: AuctionElement): boolean {
  // consider an oder filled when 99% or more is matched
  const onePercent = order.priceDenominator.divRound(ONE_HUNDRED)
  return !order.remainingAmount.gte(onePercent)
}
