import BN from 'bn.js'
import { DepositApiImpl, DepositApi } from 'api/deposit/DepositApi'
import { Receipt, TxOptionalParams } from 'types'
import { log } from 'utils'
import Web3 from 'web3'
import { decodeAuctionElements } from './utils/decodeAuctionElements'

export interface GetOrdersParams {
  userAddress: string
}

export interface GetTokenAddressByIdParams {
  tokenId: number
}

export interface GetTokenIdByAddressParams {
  tokenAddress: string
}

export interface AddTokenParams {
  userAddress: string
  tokenAddress: string
}

export interface PlaceOrderParams {
  userAddress: string
  buyTokenId: number
  sellTokenId: number
  validUntil: number
  buyAmount: BN
  sellAmount: BN
}

export interface CancelOrdersParams {
  userAddress: string
  orderIds: number[]
}

export interface ExchangeApi extends DepositApi {
  getNumTokens(): Promise<number>
  getFeeDenominator(): Promise<number>

  getOrders(params: GetOrdersParams): Promise<AuctionElement[]>

  getTokenAddressById(params: GetTokenAddressByIdParams): Promise<string> // tokenAddressToIdMap
  getTokenIdByAddress(params: GetTokenIdByAddressParams): Promise<number>

  addToken(params: AddTokenParams, txOptionalParams?: TxOptionalParams): Promise<Receipt>
  placeOrder(params: PlaceOrderParams, txOptionalParams?: TxOptionalParams): Promise<Receipt>
  cancelOrders(params: CancelOrdersParams, txOptionalParams?: TxOptionalParams): Promise<Receipt>
}

export interface AuctionElement extends Order {
  user: string
  sellTokenBalance: BN
  id: string // string because we might need natural ids
}

export interface Order {
  buyTokenId: number
  sellTokenId: number
  validFrom: number
  validUntil: number
  priceNumerator: BN
  priceDenominator: BN
  remainingAmount: BN
}

/**
 * Basic implementation of Stable Coin Converter API
 */
export class ExchangeApiImpl extends DepositApiImpl implements ExchangeApi {
  public constructor(web3: Web3) {
    super(web3)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).exchange = this._contractPrototype
  }

  public async getOrders({ userAddress }: GetOrdersParams): Promise<AuctionElement[]> {
    const contract = await this._getContract()
    log(`[ExchangeApiImpl] Getting Orders for account ${userAddress}`)

    const encodedOrders = await contract.methods.getEncodedUserOrders(userAddress).call()

    // is null if Contract returns empty bytes
    if (!encodedOrders) return []

    return decodeAuctionElements(encodedOrders)
  }

  public async getNumTokens(): Promise<number> {
    const contract = await this._getContract()
    const numTokens = await contract.methods.numTokens().call()
    return +numTokens
  }

  /**
   * Fee is 1/fee_denominator.
   * i.e. 1/1000 = 0.1%
   */
  public async getFeeDenominator(): Promise<number> {
    const contract = await this._getContract()
    const feeDenominator = await contract.methods.FEE_DENOMINATOR().call()
    return +feeDenominator
  }

  public async getTokenAddressById({ tokenId }: GetTokenAddressByIdParams): Promise<string> {
    const contract = await this._getContract()
    return contract.methods.tokenIdToAddressMap(tokenId).call()
  }

  public async getTokenIdByAddress({ tokenAddress }: GetTokenIdByAddressParams): Promise<number> {
    const contract = await this._getContract()
    const tokenId = await contract.methods.tokenAddressToIdMap(tokenAddress).call()
    return +tokenId
  }

  public async addToken(
    { userAddress, tokenAddress }: AddTokenParams,
    txOptionalParams?: TxOptionalParams,
  ): Promise<Receipt> {
    const contract = await this._getContract()
    const tx = contract.methods.addToken(tokenAddress).send({ from: userAddress })

    if (txOptionalParams && txOptionalParams.onSentTransaction) {
      tx.once('transactionHash', txOptionalParams.onSentTransaction)
    }

    log(`[ExchangeApiImpl] Added Token ${tokenAddress}`)

    return tx
  }

  public async placeOrder(params: PlaceOrderParams, txOptionalParams?: TxOptionalParams): Promise<Receipt> {
    const { userAddress, buyTokenId, sellTokenId, validUntil, buyAmount, sellAmount } = params

    const contract = await this._getContract()

    // TODO: Remove temporal fix for web3. See https://github.com/gnosis/dex-react/issues/231
    const tx = contract.methods
      .placeOrder(buyTokenId, sellTokenId, validUntil, buyAmount.toString(), sellAmount.toString())
      .send({ from: userAddress })

    if (txOptionalParams && txOptionalParams.onSentTransaction) {
      tx.once('transactionHash', txOptionalParams.onSentTransaction)
    }

    log(
      `[ExchangeApiImpl] Placed Order to 
      SELL ${sellAmount.toString()} tokenId ${sellTokenId} for ${buyAmount.toString()} tokenId ${buyTokenId}
      order valid until ${validUntil}
      `,
    )

    return tx
  }

  public async cancelOrders(
    { userAddress, orderIds }: CancelOrdersParams,
    txOptionalParams?: TxOptionalParams,
  ): Promise<Receipt> {
    const contract = await this._getContract()
    const tx = contract.methods.cancelOrders(orderIds).send({ from: userAddress })

    if (txOptionalParams && txOptionalParams.onSentTransaction) {
      tx.once('transactionHash', txOptionalParams.onSentTransaction)
    }

    log(`[ExchangeApiImpl] Cancelled Orders ${orderIds}`)

    return tx
  }
}

export default ExchangeApiImpl
