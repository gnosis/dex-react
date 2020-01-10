import BN from 'bn.js'

import { Receipt } from 'types'

import {
  Erc20Api,
  NameParams,
  SymbolParams,
  DecimalsParams,
  TotalSupplyParams,
  BalanceOfParams,
  AllowanceParams,
  ApproveParams,
  TransferParams,
  TransferFromParams,
} from './Erc20Api'
import { CacheProxy } from 'api/proxy'

export class Erc20ApiProxy extends CacheProxy<Erc20Api> implements Erc20Api {
  public name(params: NameParams): Promise<string> {
    return this.fetchWithCache('name', params)
  }

  public symbol(params: SymbolParams): Promise<string> {
    return this.fetchWithCache('symbol', params)
  }

  public decimals(params: DecimalsParams): Promise<number> {
    return this.fetchWithCache('decimals', params)
  }

  public totalSupply(params: TotalSupplyParams): Promise<BN> {
    return this.fetchWithCache('totalSupply', params)
  }

  // guess we shouldn't cache these two either, or at best cache only for a few seconds
  public balanceOf(params: BalanceOfParams): Promise<BN> {
    return this.api.balanceOf(params)
  }

  public allowance(params: AllowanceParams): Promise<BN> {
    return this.api.allowance(params)
  }

  // pass through methods, cache doesn't apply to these
  public approve(params: ApproveParams): Promise<Receipt> {
    return this.api.approve(params)
  }

  public transfer(params: TransferParams): Promise<Receipt> {
    return this.api.transfer(params)
  }

  public transferFrom(params: TransferFromParams): Promise<Receipt> {
    return this.api.transfer(params)
  }
}
