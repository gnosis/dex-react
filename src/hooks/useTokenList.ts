import { useEffect } from 'react'
import { TokenDetails } from 'types'
import useSafeState from './useSafeState'
import { getTokens, subscribeToTokenList } from 'services'
import { EMPTY_ARRAY } from 'const'

export const useTokenList = (networkId?: number): TokenDetails[] => {
  // sync get tokenList
  const tokens = networkId === undefined ? EMPTY_ARRAY : getTokens(networkId)

  // force update with a new value each time
  const [, forceUpdate] = useSafeState({})

  useEffect(() => {
    return subscribeToTokenList(() => forceUpdate({}))
  }, [forceUpdate])

  return tokens
}
