import BN from 'bn.js'
import { AbiItem } from 'web3-utils'
import { Erc20Contract } from '@gnosis.pm/dex-js'
import erc20Abi from '@gnosis.pm/dex-js/build/contracts/abi/Erc20.json'

import { TxOptionalParams, Receipt } from 'types'
import { ZERO } from 'const'
import { toBN } from 'utils'

import Web3 from 'web3'

/**
 * Interfaces the access to ERC20 token
 *
 * See: https://theethereum.wiki/w/index.php/ERC20_Token_Standard
 */
export interface Erc20Api {
  balanceOf({ tokenAddress, userAddress }: { tokenAddress: string; userAddress: string }): Promise<BN>
  name({ tokenAddress }: { tokenAddress: string }): Promise<string>
  symbol({ tokenAddress }: { tokenAddress: string }): Promise<string>
  decimals({ tokenAddress }: { tokenAddress: string }): Promise<number>
  totalSupply({ tokenAddress }: { tokenAddress: string }): Promise<BN>

  allowance({
    tokenAddress,
    userAddress,
    spenderAddress,
  }: {
    tokenAddress: string
    userAddress: string
    spenderAddress: string
  }): Promise<BN>

  approve(
    {
      userAddress,
      tokenAddress,
      spenderAddress,
      amount,
    }: { userAddress: string; tokenAddress: string; spenderAddress: string; amount: BN },
    txOptionalParams?: TxOptionalParams,
  ): Promise<Receipt>

  transfer(
    {
      userAddress,
      tokenAddress,
      toAddress,
      amount,
    }: { userAddress: string; tokenAddress: string; toAddress: string; amount: BN },
    txOptionalParams?: TxOptionalParams,
  ): Promise<Receipt>

  transferFrom(
    {
      userAddress,
      tokenAddress,
      fromAddress,
      toAddress,
      amount,
    }: {
      userAddress: string
      tokenAddress: string
      fromAddress: string
      toAddress: string
      amount: BN
    },
    txOptionalParams?: TxOptionalParams,
  ): Promise<Receipt>
}

/**
 * Basic implementation of ERC20 API
 */
export class Erc20ApiImpl implements Erc20Api {
  private _contractPrototype: Erc20Contract

  private static _contractsCache: { [K: string]: Erc20Contract } = {}

  public constructor(web3: Web3) {
    this._contractPrototype = new web3.eth.Contract(erc20Abi as AbiItem[]) as Erc20Contract

    // TODO remove later
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).erc20 = this._contractPrototype
  }

  public async balanceOf({ tokenAddress, userAddress }: { tokenAddress: string; userAddress: string }): Promise<BN> {
    if (!userAddress || !tokenAddress) return ZERO

    const erc20 = this._getERC20AtAddress(tokenAddress)

    const result = await erc20.methods.balanceOf(userAddress).call()

    return toBN(result)
  }

  public async name({ tokenAddress }: { tokenAddress: string }): Promise<string> {
    const erc20 = this._getERC20AtAddress(tokenAddress)

    return await erc20.methods.name().call()
  }

  public async symbol({ tokenAddress }: { tokenAddress: string }): Promise<string> {
    const erc20 = this._getERC20AtAddress(tokenAddress)

    return await erc20.methods.symbol().call()
  }

  public async decimals({ tokenAddress }: { tokenAddress: string }): Promise<number> {
    const erc20 = this._getERC20AtAddress(tokenAddress)

    const decimals = await erc20.methods.decimals().call()

    return Number(decimals)
  }

  public async totalSupply({ tokenAddress }: { tokenAddress: string }): Promise<BN> {
    const erc20 = this._getERC20AtAddress(tokenAddress)

    const totalSupply = await erc20.methods.totalSupply().call()

    return toBN(totalSupply)
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
    if (!userAddress || !tokenAddress) return ZERO

    const erc20 = this._getERC20AtAddress(tokenAddress)

    const result = await erc20.methods.allowance(userAddress, spenderAddress).call()

    return toBN(result)
  }

  public async approve(
    {
      userAddress,
      tokenAddress,
      spenderAddress,
      amount,
    }: { userAddress: string; tokenAddress: string; spenderAddress: string; amount: BN },
    txOptionalParams?: TxOptionalParams,
  ): Promise<Receipt> {
    const erc20 = this._getERC20AtAddress(tokenAddress)

    // TODO: Remove temporal fix for web3. See https://github.com/gnosis/dex-react/issues/231
    const tx = erc20.methods.approve(spenderAddress, amount.toString()).send({
      from: userAddress,
    })

    if (txOptionalParams?.onSentTransaction) {
      tx.once('transactionHash', txOptionalParams.onSentTransaction)
    }

    return tx
  }

  public async transfer(
    {
      userAddress,
      tokenAddress,
      toAddress,
      amount,
    }: { userAddress: string; tokenAddress: string; toAddress: string; amount: BN },
    txOptionalParams?: TxOptionalParams,
  ): Promise<Receipt> {
    const erc20 = this._getERC20AtAddress(tokenAddress)

    // TODO: Remove temporal fix for web3. See https://github.com/gnosis/dex-react/issues/231
    const tx = erc20.methods.transfer(toAddress, amount.toString()).send({
      from: userAddress,
    })

    if (txOptionalParams?.onSentTransaction) {
      tx.once('transactionHash', txOptionalParams.onSentTransaction)
    }

    return tx
  }

  public async transferFrom(
    {
      userAddress,
      tokenAddress,
      fromAddress,
      toAddress,
      amount,
    }: { userAddress: string; tokenAddress: string; fromAddress: string; toAddress: string; amount: BN },
    txOptionalParams?: TxOptionalParams,
  ): Promise<Receipt> {
    const erc20 = this._getERC20AtAddress(tokenAddress)

    const tx = erc20.methods.transferFrom(userAddress, toAddress, amount.toString()).send({
      from: fromAddress,
    })

    if (txOptionalParams?.onSentTransaction) {
      tx.once('transactionHash', txOptionalParams.onSentTransaction)
    }

    return tx
  }

  /********************************    private methods   ********************************/

  private _getERC20AtAddress(address: string): Erc20Contract {
    const erc20 = Erc20ApiImpl._contractsCache[address]

    if (erc20) return erc20

    const newERC20 = this._contractPrototype.clone()
    newERC20.options.address = address

    return (Erc20ApiImpl._contractsCache[address] = newERC20)
  }
}

export default Erc20ApiImpl
