import { BigNumber } from 'bignumber.js'
import { logDebug } from './miscellaneous'

export const DEFAULT_GAS_PRICE = 40e9 // 40 Gwei
export const SUBSIDIZE_FACTOR = 1 // no subsidy

// account for a 20% change in the time it takes to mine the tx, and start the batch
export const BUFFER_MULTIPLIER = 1.2

export const SETTLEMENT_FACTOR = 1.5
export const FEE_FACTOR = 1000
export const TRADE_TX_GASLIMIT = 120000

const OWL_DECIMAL_UNITS = 1e18

interface CalcMinTradableAmountInOwlParams {
  gasPrice: number
  ethPriceInOwl: BigNumber
}

export const calcMinTradableAmountInOwl = ({
  gasPrice,
  ethPriceInOwl,
}: CalcMinTradableAmountInOwlParams): BigNumber => {
  const minEconomicalViableFeeInOwl = ethPriceInOwl
    .multipliedBy(TRADE_TX_GASLIMIT * gasPrice)
    .dividedBy(OWL_DECIMAL_UNITS)
  logDebug('MIN_ECONOMICAL_VIABLE_FEE_IN_OWL', minEconomicalViableFeeInOwl.toString(10))

  const minFee = minEconomicalViableFeeInOwl.multipliedBy(BUFFER_MULTIPLIER).dividedBy(SUBSIDIZE_FACTOR)
  return minFee.multipliedBy(FEE_FACTOR * SETTLEMENT_FACTOR)
}

export const ROUND_TO_NUMBER = 250 // 1234 -> 1250 $

export const roundToNext = (amount: BigNumber | number, roundTo: number = ROUND_TO_NUMBER): BigNumber => {
  const amountBN = BigNumber.isBigNumber(amount) ? amount : new BigNumber(amount)

  const remainder = amountBN.modulo(roundTo)

  if (remainder.isZero()) return amountBN

  const wholePart = amountBN.minus(remainder)

  return wholePart.plus(roundTo)
}
