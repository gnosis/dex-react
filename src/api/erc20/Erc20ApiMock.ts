import { Erc20Api, TxOptionalParams, Receipt } from 'types'
import BN from 'bn.js'
import assert from 'assert'
import { ZERO } from 'const'
import { RECEIPT } from '../../../test/data'
import { log } from 'utils'
import { waitAndSendReceipt } from 'utils/mock'

interface Balances {
  [userAddress: string]: { [tokenAddress: string]: BN }
}

interface Allowances {
  [userAddress: string]: { [tokenAddress: string]: { [spenderAddress: string]: BN } }
}

/**
 * Basic implementation of Wallet API
 */
export class Erc20ApiMock implements Erc20Api {
  private _balances: Balances
  private _allowances: Allowances

  public constructor({ balances = {}, allowances = {} } = {}) {
    this._balances = balances
    this._allowances = allowances
  }

  public async balanceOf({ tokenAddress, userAddress }: { tokenAddress: string; userAddress: string }): Promise<BN> {
    const userBalances = this._balances[userAddress]
    if (!userBalances) {
      return ZERO
    }

    const balance = userBalances[tokenAddress]
    return balance ? balance : ZERO
  }

  public async allowance({
    tokenAddress,
    userAddress,
    spenderAddress,
  }: {
    tokenAddress: string
    userAddress: string
    spenderAddress: string
  }): Promise<BN> {
    const userAllowances = this._allowances[userAddress]
    if (!userAllowances) {
      return ZERO
    }

    const tokenAllowances = userAllowances[tokenAddress]
    if (!tokenAllowances) {
      return ZERO
    }

    const allowance = tokenAllowances[spenderAddress]
    return allowance ? allowance : ZERO
  }

  public async approve(
    {
      senderAddress,
      tokenAddress,
      spenderAddress,
      amount,
    }: {
      senderAddress: string
      tokenAddress: string
      spenderAddress: string
      amount: BN
    },
    txOptionalParams?: TxOptionalParams,
  ): Promise<Receipt> {
    await waitAndSendReceipt({ txOptionalParams })

    this._initAllowances({ userAddress: senderAddress, tokenAddress, spenderAddress })
    this._allowances[senderAddress][tokenAddress][spenderAddress] = amount
    log(
      `[Erc20ApiMock] Approved ${amount} for the spender ${spenderAddress} on the token ${tokenAddress}. User ${senderAddress}`,
    )

    return RECEIPT
  }

  /**
   * Transfers from `senderAddress`. No allowance required.
   *
   * @param senderAddress The sender of the tx
   * @param tokenAddress The token being transferred
   * @param toAddress The recipient's address
   * @param amount The amount transferred
   * @param txOptionalParams Optional params
   */
  public async transfer(
    {
      senderAddress,
      tokenAddress,
      toAddress,
      amount,
    }: {
      senderAddress: string
      tokenAddress: string
      toAddress: string
      amount: BN
    },
    txOptionalParams?: TxOptionalParams,
  ): Promise<Receipt> {
    await waitAndSendReceipt({ txOptionalParams })
    this._initBalances({ userAddress: senderAddress, tokenAddress })
    this._initBalances({ userAddress: toAddress, tokenAddress })

    const balance = this._balances[senderAddress][tokenAddress]
    assert(balance.gte(amount), "The user doesn't have enough balance")

    this._balances[senderAddress][tokenAddress] = balance.sub(amount)
    this._balances[toAddress][tokenAddress] = this._balances[toAddress][tokenAddress].add(amount)

    log(
      `[Erc20ApiMock:transfer] Transferred ${amount} of the token ${tokenAddress} from ${senderAddress} to ${toAddress}`,
    )

    return RECEIPT
  }

  /**
   * Transfers on behalf of `fromAddress` if `senderAddress` has allowance
   *
   * @param senderAddress The sender of the tx
   * @param tokenAddress The token being transferred
   * @param fromAddress The source of the tokens
   * @param toAddress The recipient's address
   * @param amount The amount transferred
   * @param txOptionalParams Optional params
   */
  public async transferFrom(
    {
      senderAddress,
      tokenAddress,
      fromAddress,
      toAddress,
      amount,
    }: {
      senderAddress: string
      tokenAddress: string
      fromAddress: string
      toAddress: string
      amount: BN
    },
    txOptionalParams?: TxOptionalParams,
  ): Promise<Receipt> {
    await waitAndSendReceipt({ txOptionalParams })
    this._initBalances({ userAddress: fromAddress, tokenAddress })
    this._initBalances({ userAddress: toAddress, tokenAddress })
    this._initAllowances({ userAddress: fromAddress, tokenAddress, spenderAddress: senderAddress })

    const balance = this._balances[fromAddress][tokenAddress]
    assert(balance.gte(amount), "The user doesn't have enough balance")

    assert(
      this._hasAllowance({ fromAddress, tokenAddress, spenderAddress: senderAddress, amount }),
      'Not allowed to perform this transfer',
    )
    const allowance = this._allowances[fromAddress][tokenAddress][senderAddress]
    this._allowances[fromAddress][tokenAddress][senderAddress] = allowance.sub(amount)
    log(
      `[Erc20ApiMock:transferFrom] Updated allowance: ${allowance} => ${this._allowances[fromAddress][tokenAddress][senderAddress]}`,
    )

    this._balances[fromAddress][tokenAddress] = balance.sub(amount)
    this._balances[toAddress][tokenAddress] = this._balances[toAddress][tokenAddress].add(amount)

    log(
      `[Erc20ApiMock:transferFrom] Transferred ${amount} of the token ${tokenAddress} from ${fromAddress} to ${toAddress} by the spender ${senderAddress}`,
    )

    return RECEIPT
  }

  /********************************    private methods   ********************************/
  private _hasAllowance({
    fromAddress,
    tokenAddress,
    spenderAddress,
    amount,
  }: {
    fromAddress: string
    tokenAddress: string
    spenderAddress: string
    amount: BN
  }): boolean {
    const allowance = this._allowances[fromAddress][tokenAddress][spenderAddress]
    return allowance.gte(amount)
  }

  private _initBalances({ userAddress, tokenAddress }: { userAddress: string; tokenAddress: string }): BN {
    let userBalances = this._balances[userAddress]
    if (!userBalances) {
      userBalances = {}
      this._balances[userAddress] = userBalances
    }

    let tokenBalance = userBalances[tokenAddress]
    if (!tokenBalance) {
      tokenBalance = ZERO
      userBalances[tokenAddress] = tokenBalance
    }

    return tokenBalance
  }

  private _initAllowances({
    userAddress,
    tokenAddress,
    spenderAddress,
  }: {
    userAddress: string
    tokenAddress: string
    spenderAddress: string
  }): BN {
    let userAllowances = this._allowances[userAddress]
    if (!userAllowances) {
      userAllowances = {}
      this._allowances[userAddress] = userAllowances
    }

    let userTokenAllowances = userAllowances[tokenAddress]
    if (!userTokenAllowances) {
      userTokenAllowances = {}
      userAllowances[tokenAddress] = userTokenAllowances
    }

    let spenderAllowance = userTokenAllowances[spenderAddress]
    if (!spenderAllowance) {
      spenderAllowance = ZERO
      userTokenAllowances[spenderAddress] = spenderAllowance
    }

    return spenderAllowance
  }
}

export default Erc20ApiMock
