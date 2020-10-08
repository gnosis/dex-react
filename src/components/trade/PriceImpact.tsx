import React from 'react'
import BigNumber from 'bignumber.js'
import styled from 'styled-components'

import { PriceSuggestionsWrapper } from './PriceSuggestions/PriceSuggestions'
import { HelpTooltip } from 'components/Tooltip'

import { usePriceEstimationWithSlippage } from 'hooks/usePriceEstimation'

import { ONE_HUNDRED_BIG_NUMBER, ONE_BIG_NUMBER } from 'const'
import { TokenDetails } from 'types'
import { parseBigNumber } from 'utils'

const BoldColourTag = styled.strong`
  &.highImpact {
    color: var(--color-button-danger);
  }

  &.lowImpact {
    color: var(--color-button-success);
  }

  > span {
    color: var(--color-text-primary);
    margin-right: 0.5rem;
  }
`

const PriceImpactTooltip = 'The difference between the market price and the estimated price due to trade size'

interface PriceImpactProps {
  baseToken: TokenDetails
  quoteToken: TokenDetails
  limitPrice: string | null
  networkId: number
}

// Limit as to where price colour changes
const HIGH_PRICE_IMPACT_THRESHOLD = new BigNumber(3)
const LOW_PRICE_IMPACT_THRESHOLD = ONE_BIG_NUMBER

// sets colour of strong tag presenting price impact
const getImpactColourClass = (impact: BigNumber | null): string => {
  let className = ''
  if (impact) {
    if (impact.gt(HIGH_PRICE_IMPACT_THRESHOLD)) {
      className = 'highImpact'
    } else if (impact.lt(LOW_PRICE_IMPACT_THRESHOLD)) {
      className = 'lowImpact'
    }
  }

  return className
}

function calculatePriceImpact({
  limitPrice,
  bestAskPrice,
}: {
  limitPrice: string | null
  bestAskPrice: BigNumber | null
}): BigNumber | null {
  const limitPriceBigNumber = limitPrice && parseBigNumber(limitPrice)
  if (!bestAskPrice || !limitPriceBigNumber) return null

  // PRICE_IMPACT = 100 - (BEST_ASK / LIMIT_PRICE * 100)
  return ONE_BIG_NUMBER.minus(bestAskPrice.div(limitPriceBigNumber)).times(ONE_HUNDRED_BIG_NUMBER)
}

function PriceImpact({ limitPrice, baseToken, quoteToken, networkId }: PriceImpactProps): React.ReactElement | null {
  const { id: baseTokenId, decimals: baseTokenDecimals } = baseToken
  const { id: quoteTokenId, decimals: quoteTokenDecimals } = quoteToken

  // TODO: useBestAskPrice hook here
  const { priceEstimation: bestAskPrice } = usePriceEstimationWithSlippage({
    networkId,
    amount: '0',
    baseTokenId,
    baseTokenDecimals,
    quoteTokenId,
    quoteTokenDecimals,
  })

  const { priceImpact, className } = React.useMemo(() => {
    const priceImpact = calculatePriceImpact({ bestAskPrice, limitPrice })
    const className = getImpactColourClass(priceImpact)

    return {
      priceImpact,
      className,
    }
  }, [bestAskPrice, limitPrice])

  if (!priceImpact) return null

  return (
    <PriceSuggestionsWrapper>
      <div className="container">
        <span>
          <span>Price impact </span>
          <BoldColourTag className={className}>
            <HelpTooltip tooltip={PriceImpactTooltip} /> {priceImpact.toFixed(2)}%
          </BoldColourTag>
        </span>
      </div>
    </PriceSuggestionsWrapper>
  )
}

export default PriceImpact