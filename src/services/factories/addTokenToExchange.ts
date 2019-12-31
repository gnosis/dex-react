import Web3 from 'web3'

import { log, getImageUrl } from 'utils'

import { getErc20Info } from '../helpers'
import { ExchangeApi } from 'api/exchange/ExchangeApi'
import { Erc20Api } from 'api/erc20/Erc20Api'

interface Params {
  exchangeApi: ExchangeApi
  erc20Api: Erc20Api
  web3: Web3
}

/**
 * Factory of addTokenToExchange
 * Takes as input API instances
 * Returns async function to add tokenAddress to exchange
 */
export function addTokenToExchangeFactory(factoryParams: Params): (tokenAddress: string) => Promise<boolean> {
  const { exchangeApi } = factoryParams

  return async (tokenAddress: string): Promise<boolean> => {
    const erc20Info = getErc20Info({ ...factoryParams, tokenAddress })

    if (!erc20Info) {
      log('Address %s does not contain a valid ERC20 token', tokenAddress)
      return false
    }

    try {
      await exchangeApi.addToken(tokenAddress)
    } catch (e) {
      log('Failed to add token (%s) to exchange', tokenAddress)
      return false
    }

    // TODO: I guess we might want to return the token and leave the proxy/cache layer to deal with it.
    // Revisit once we add it to the interface
    try {
      const id = exchangeApi.getTokenIdByAddress(tokenAddress)

      const token = {
        ...erc20Info,
        id,
        image: getImageUrl(tokenAddress),
      }

      // TODO: cache new token
      log('new token: ', token)
    } catch (e) {
      log('Failed to add new token (%s) to local list of tokens', tokenAddress, e)
      return false
    }

    return true
  }
}
