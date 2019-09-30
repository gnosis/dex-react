import BN from 'bn.js'
import { TEN } from 'const'

const DEFAULT_DECIMALS = 4
const DEFAULT_PRECISION = 18

function _getLocaleSymbols(): { thousands: string; decimals: string } {
  // Check number representation in default locale
  const formattedNumber = new Intl.NumberFormat(undefined).format(1000.1)
  return {
    thousands: formattedNumber[1],
    decimals: formattedNumber[5],
  }
}
const { thousands: THOUSANDS_SYMBOL, decimals: DECIMALS_SYMBOL } = _getLocaleSymbols()

function _formatNumber(num: string): string {
  return num.replace(/(\d)(?=(?:\d{3})+(?!\d))/g, '$1' + THOUSANDS_SYMBOL)
}

function _decomposeBn(amount: BN, amountPrecision: number, decimals: number): { integerPart: BN; decimalPart: BN } {
  // Discard the decimals we don't need
  //  i.e. for WETH (precision=18, decimals=4) --> amount / 1e14
  //        16.5*1e18 ---> 165000
  if (decimals > amountPrecision) {
    throw new Error('The decimals cannot be bigger than the precission')
  }
  const amountRaw = amount.divRound(TEN.pow(new BN(amountPrecision - decimals)))
  const integerPart = amountRaw.div(TEN.pow(new BN(decimals))) // 165000 / 10000 = 16
  const decimalPart = amountRaw.mod(TEN.pow(new BN(decimals))) // 165000 % 10000 = 5000

  // Discard the decimals we don't need
  //  i.e. for WETH (precision=18, decimals=4) --> amount / 1e14
  //        1, 18:  16.5*1e18 ---> 165000

  return { integerPart, decimalPart }
}

export function formatAmount(
  amount?: BN,
  amountPrecision = DEFAULT_PRECISION,
  decimals = DEFAULT_DECIMALS,
  thousandSeparator: boolean = true,
): string | null {
  if (!amount) {
    return null
  }
  const actualDecimals = Math.min(amountPrecision, decimals)
  const { integerPart, decimalPart } = _decomposeBn(amount, amountPrecision, actualDecimals)

  const integerPartFmt = thousandSeparator ? _formatNumber(integerPart.toString()) : integerPart.toString()

  if (decimalPart.isZero()) {
    // Return just the integer part
    return integerPartFmt
  } else {
    const decimalFmt = decimalPart
      .toString()
      .padStart(actualDecimals, '0') // Pad the decimal part with leading zeros
      .replace(/0+$/, '') // Remove the right zeros

    // Return the formated integer plus the decimal
    return integerPartFmt + DECIMALS_SYMBOL + decimalFmt
  }
}

export function formatAmountFull(
  amount?: BN,
  amountPrecision = DEFAULT_PRECISION,
  thousandSeparator: boolean = true,
): string | null {
  if (!amount) {
    return null
  }

  return formatAmount(amount, amountPrecision, amountPrecision, thousandSeparator)
}

export function parseAmount(amountFmt: string, amountPrecision = DEFAULT_PRECISION): BN | null {
  if (!amountFmt) {
    return null
  }

  const groups = /^(\d+)(?:\.(\d+))?$/.exec(amountFmt)
  if (groups) {
    const [, integerPart, decimalPart = ''] = groups
    if (decimalPart.length > amountPrecision) {
      return null
    }

    const decimalBN = new BN(decimalPart.padEnd(amountPrecision, '0'))
    const factor = TEN.pow(new BN(amountPrecision))
    return new BN(integerPart).mul(factor).add(decimalBN)
  } else {
    return null
  }
}
