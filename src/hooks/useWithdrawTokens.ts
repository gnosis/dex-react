import { useState, useEffect, useRef } from 'react'
import { TxResult, TokenBalanceDetails, TxOptionalParams } from 'types'
import assert from 'assert'
import { depositApi, walletApi } from 'api'

interface Params {
  tokenBalances: TokenBalanceDetails
  txOptionalParams?: TxOptionalParams
}

interface Result {
  withdrawing: boolean
  highlight: boolean
  withdraw(): Promise<TxResult<void>>
}

export const useWithdrawTokens = (params: Params): Result => {
  const {
    tokenBalances: { enabled, address: tokenAddress, withdrawable },
  } = params
  const [withdrawing, setWithdrawing] = useState(false)
  const [highlight, setHighlight] = useState(false)
  const mounted = useRef(true)

  useEffect(() => {
    return function cleanUp(): void {
      mounted.current = false
    }
  }, [])

  async function withdraw(): Promise<TxResult<void>> {
    assert(enabled, 'Token not enabled')
    assert(withdrawable, 'Withdraw not ready')

    setWithdrawing(true)

    try {
      // TODO: Remove connect once login is done
      await walletApi.connect()

      const userAddress = await walletApi.getAddress()
      return await depositApi.withdraw(userAddress, tokenAddress, params.txOptionalParams)
    } finally {
      if (mounted.current) {
        setWithdrawing(false)

        setHighlight(true)
        setTimeout(() => {
          if (mounted.current) {
            setHighlight(false)
          }
        }, 5000)
      }
    }
  }

  return { withdrawing, highlight, withdraw }
}
