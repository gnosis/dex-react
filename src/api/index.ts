import { Network } from 'types'
import { WalletApiMock } from './wallet/WalletApiMock'
import { WalletApiImpl, WalletApi } from './wallet/WalletApi'
import { TokenListApiImpl, TokenList } from './tokenList/TokenListApi'
import { TokenListApiMock } from './tokenList/TokenListApiMock'
import { Erc20ApiMock } from './erc20/Erc20ApiMock'
import { Erc20ApiImpl, Erc20Api } from './erc20/Erc20Api'
import { DepositApiMock } from './deposit/DepositApiMock'
import { DepositApiImpl, DepositApi } from './deposit/DepositApi'
import { ExchangeApiImpl, ExchangeApi } from './exchange/ExchangeApi'
import { ExchangeApiMock } from './exchange/ExchangeApiMock'
import {
  tokenList,
  exchangeBalanceStates,
  erc20Balances,
  erc20Allowances,
  FEE_TOKEN,
  exchangeOrders,
  unregisteredTokens,
  TOKEN_8,
} from '../../test/data'
import Web3 from 'web3'
import { INITIAL_INFURA_ENDPOINT } from 'const'

const isWeb3Mock = process.env.MOCK_WEB3 === 'true'
const isWalletMock = process.env.MOCK_WALLET === 'true'
const isTokenListMock = process.env.MOCK_TOKEN_LIST === 'true'
const isErc20Mock = process.env.MOCK_ERC20 === 'true'
const isDepositMock = process.env.MOCK_DEPOSIT === 'true'
const isExchangeMock = process.env.MOCK_EXCHANGE === 'true'

// TODO connect to mainnet if we need AUTOCONNECT at all
export const getDefaultProvider = (): string | null =>
  process.env.NODE_ENV === 'test' ? null : INITIAL_INFURA_ENDPOINT

function createWeb3Api(): Web3 {
  // TODO: Create an `EthereumApi` https://github.com/gnosis/dex-react/issues/331
  const web3 = new Web3(getDefaultProvider())

  if (isWeb3Mock) {
    // Only function that needs to be mocked so far. We can add more and add extra logic as needed
    web3.eth.getCode = async (address: string): Promise<string> => address
  }
  return web3
}

function createWalletApi(web3: Web3): WalletApi {
  let walletApi
  if (isWalletMock) {
    walletApi = new WalletApiMock()
  } else {
    walletApi = new WalletApiImpl(web3)
  }
  window['walletApi'] = walletApi // register for convenience
  return walletApi
}

function createErc20Api(web3: Web3): Erc20Api {
  let erc20Api
  if (isErc20Mock) {
    erc20Api = new Erc20ApiMock({ balances: erc20Balances, allowances: erc20Allowances, tokens: unregisteredTokens })
  } else {
    erc20Api = new Erc20ApiImpl(web3)
  }
  window['erc20Api'] = erc20Api // register for convenience
  return erc20Api
}

function createDepositApi(erc20Api: Erc20Api, web3: Web3): DepositApi {
  let depositApi
  if (isDepositMock) {
    depositApi = new DepositApiMock(exchangeBalanceStates, erc20Api)
  } else {
    depositApi = new DepositApiImpl(web3)
  }
  window['depositApi'] = depositApi // register for convenience
  return depositApi
}

function createExchangeApi(erc20Api: Erc20Api, web3: Web3): ExchangeApi {
  let exchangeApi
  if (isExchangeMock) {
    const tokens = [FEE_TOKEN, ...tokenList.map(token => token.address), TOKEN_8]
    exchangeApi = new ExchangeApiMock({
      balanceStates: exchangeBalanceStates,
      erc20Api,
      registeredTokens: tokens,
      ordersByUser: exchangeOrders,
    })
  } else {
    exchangeApi = new ExchangeApiImpl(web3)
  }
  window['exchangeApi'] = exchangeApi
  return exchangeApi
}

function createTokenListApi(): TokenList {
  const networks = [Network.Mainnet, Network.Rinkeby]

  let tokenListApi: TokenList
  if (isTokenListMock) {
    tokenListApi = new TokenListApiMock(tokenList)
  } else {
    tokenListApi = new TokenListApiImpl(networks)
  }

  window['tokenListApi'] = tokenListApi // register for convenience
  return tokenListApi
}

// Build APIs
export const web3: Web3 = createWeb3Api()
export const walletApi: WalletApi = createWalletApi(web3)
export const erc20Api: Erc20Api = createErc20Api(web3)
export const depositApi: DepositApi = createDepositApi(erc20Api, web3)
export const exchangeApi: ExchangeApi = createExchangeApi(erc20Api, web3)
export const tokenListApi: TokenList = createTokenListApi()
