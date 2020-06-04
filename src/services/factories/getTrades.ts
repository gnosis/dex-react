import Web3 from 'web3'

import { TokenDetails, calculatePrice } from '@gnosis.pm/dex-js'

import ExchangeApiImpl, { ExchangeApi, Trade, Order, AuctionElement } from 'api/exchange/ExchangeApi'

import { getTokensFactory } from 'services/factories/tokenList'
import { addUnlistedTokensToUserTokenListByIdFactory } from 'services/factories/addUnlistedTokensToUserTokenListById'

import { dateToBatchId, calculateSettlingTimestamp, logDebug, isOrderDeleted } from 'utils'

interface GetTradesParams {
  networkId: number
  userAddress: string
  fromBlock?: number
  toBlock?: number | 'latest' | 'pending'
  orders: AuctionElement[]
}

export function getTradesFactory(factoryParams: {
  web3: Web3
  exchangeApi: ExchangeApi
  getTokens: ReturnType<typeof getTokensFactory>
  addUnlistedTokensToUserTokenListById: ReturnType<typeof addUnlistedTokensToUserTokenListByIdFactory>
}): (params: GetTradesParams) => Promise<Trade[]> {
  const { web3, exchangeApi, getTokens, addUnlistedTokensToUserTokenListById } = factoryParams

  async function getBlockTimePair(blockNumber: number): Promise<[number, number]> {
    // js timestamp == unix timestamp * 1000
    return [blockNumber, +(await web3.eth.getBlock(blockNumber)).timestamp * 1000]
  }

  async function getTrades(params: GetTradesParams): Promise<Trade[]> {
    const { userAddress, networkId, orders: existingOrders } = params

    const tradeEvents = await exchangeApi.getPastTrades(params)

    // Minor optimization: return early when empty
    if (tradeEvents.length === 0) {
      return []
    }

    const blocksSet = new Set<number>()
    const orderIdsMap = new Map<string, { buyTokenId: number; sellTokenId: number; blockNumber: number }>()
    const tokenIdsSet = new Set<number>()

    tradeEvents.forEach(event => {
      const { blockNumber, sellTokenId, buyTokenId, orderId } = event

      blocksSet.add(blockNumber)
      orderIdsMap.set(orderId, {
        buyTokenId,
        sellTokenId,
        blockNumber,
      })
      tokenIdsSet.add(buyTokenId)
      tokenIdsSet.add(sellTokenId)
    })

    // ### ORDERS ###
    const orders = new Map<string, Order>()
    // Add all existing orders to map. No problem to have more than what we need since it'll be picked by id later.
    existingOrders.forEach(order => orders.set(order.id, order))

    // Fetch from contract the ones we don't have locally, and add it to the map
    await Promise.all(
      Array.from(orderIdsMap.keys()).map(async orderId => {
        // We already have this order, ignore
        // Keep in mind the global state filters out deleted orders
        if (orders.has(orderId)) {
          return
        }

        let order: Order | undefined

        // Fetch order from contract
        try {
          order = await exchangeApi.getOrder({
            userAddress,
            networkId,
            orderId,
          })

          // Store in the orders map
        } catch (e) {
          logDebug(`[services:getTrades] failed to fetch order ${orderId}: ${e.message}`)
        }

        // Load additional info
        const orderInfo = orderIdsMap.get(orderId)

        // In case order was deleted from the contract, or failed to fetch it
        // try to get it from OrderPlacement events instead
        if (orderInfo && (!order || isOrderDeleted(order))) {
          const { buyTokenId, sellTokenId, blockNumber } = orderInfo
          try {
            order = await exchangeApi.getOrderFromOrderPlacementEvent({
              userAddress,
              networkId,
              orderId,
              // Parameters bellow not required, but help narrow down the search
              buyTokenId,
              sellTokenId,
              toBlock: blockNumber,
            })
          } catch (e) {
            logDebug(`[services:getTrades] Placement event not found for order ${orderId}`, e)
          }
        }
        // Store in the orders map, if found
        order && orders.set(orderId, order)
      }),
    )

    // ### BLOCKS ###
    const blockTimes = new Map<number, number>(await Promise.all(Array.from(blocksSet).map(getBlockTimePair)))

    // ### TOKENS ###
    // Add whatever token might be missing. Will not try to add tokens already in the list.
    await addUnlistedTokensToUserTokenListById(Array.from(tokenIdsSet))

    // Create tokens map. No need to do the extra hop to filter, since it'll be picked by id later
    const tokens = new Map(getTokens(networkId).map(token => [token.id, token]))

    // ### TRADES ###
    // Final step, put all together into Trade objects
    const trades = tradeEvents.reduce<Trade[]>((acc, event) => {
      const timestamp = blockTimes.get(event.blockNumber) as number
      const batchId = dateToBatchId(timestamp)

      const buyToken = tokens.get(event.buyTokenId) as TokenDetails
      const sellToken = tokens.get(event.sellTokenId) as TokenDetails

      // Maybe we couldn't find the order /shrug
      const order = orders.get(event.orderId)

      const trade: Trade = {
        ...event,
        batchId,
        timestamp,
        settlingTimestamp: calculateSettlingTimestamp(batchId),
        revertKey: ExchangeApiImpl.buildTradeRevertKey(batchId, event.orderId),
        buyToken,
        sellToken,
        limitPrice:
          order &&
          calculatePrice({
            numerator: { amount: order.priceNumerator, decimals: buyToken.decimals },
            denominator: { amount: order.priceDenominator, decimals: sellToken.decimals },
          }),
        fillPrice: calculatePrice({
          numerator: { amount: event.buyAmount, decimals: buyToken.decimals },
          denominator: { amount: event.sellAmount, decimals: sellToken.decimals },
        }),
        remainingAmount: order && order.priceDenominator.sub(event.sellAmount),
      }
      acc.push(trade)

      return acc
    }, [])

    return trades
  }

  return getTrades
}
