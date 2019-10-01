import { useState, useEffect } from 'react'
import { TxResult, TokenBalanceDetails, TxOptionalParams } from 'types'
import assert from 'assert'
import { depositApi, walletApi } from 'api'
import { ZERO } from 'const'

interface Params {
  tokenBalances: TokenBalanceDetails
  txOptionalParams?: TxOptionalParams
}

interface Result {
  withdrawable: boolean
  withdrawing: boolean
  withdraw(): Promise<TxResult<void>>
  error: boolean
}

export const useWithdrawTokens = (params: Params): Result => {
  const {
    tokenBalances: { enabled, address: tokenAddress, withdrawingBalance },
  } = params
  const [withdrawable, setWithdrawable] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function checkWithdrawable(): Promise<boolean> {
      if (!withdrawingBalance.gt(ZERO)) {
        return false
      }
      // TODO: Remove connect once login is done
      await walletApi.connect()

      const userAddress = await walletApi.getAddress()
      const [withdrawBatchId, currentBatchId] = await Promise.all([
        depositApi.getPendingWithdrawBatchId(userAddress, tokenAddress),
        depositApi.getCurrentBatchId(),
      ])

      return withdrawBatchId < currentBatchId
    }

    checkWithdrawable()
      .then(withdrawable => setWithdrawable(withdrawable))
      .catch(error => {
        console.error('Error checking withdraw state', error)
        setError(true)
      })
  }, [tokenAddress, withdrawingBalance])

  async function withdraw(): Promise<TxResult<void>> {
    assert(enabled, 'Token not enabled')
    assert(withdrawable, 'Withdraw not ready')

    setWithdrawing(true)

    try {
      // TODO: Remove connect once login is done
      await walletApi.connect()

      const userAddress = await walletApi.getAddress()
      const result = await depositApi.withdraw(userAddress, tokenAddress, params.txOptionalParams)

      console.debug(`Is withdrawing? ${withdrawing}`)
      return result
    } finally {
      setWithdrawing(false)
    }
  }

  return { withdrawable, withdrawing, withdraw, error }
}
