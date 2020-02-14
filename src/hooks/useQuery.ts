import { useLocation } from 'react-router'
import { useMemo } from 'react'
import { sanitizeInput, sanitizeNegativeAndMakeMultipleOf } from 'utils'

export function useQuery(): { sellAmount: string; buyAmount: string; validUntil?: string } {
  const { search } = useLocation()

  return useMemo(() => {
    const query = new URLSearchParams(search)

    return {
      sellAmount: sanitizeInput(query.get('sell')),
      buyAmount: sanitizeInput(query.get('buy')),
      validUntil: sanitizeNegativeAndMakeMultipleOf(query.get('expires'), '30'),
    }
  }, [search])
}

/**
 * Syntactic sugar to build search queries
 *
 * @param params object with key:value strings for the search query
 */
export function buildSearchQuery(params: { [key in string]: string }): URLSearchParams {
  return new URLSearchParams(params)
}
