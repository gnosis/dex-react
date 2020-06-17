import React from 'react'
import { TokenDetails, safeTokenName } from '@gnosis.pm/dex-js'
import { EtherscanLink } from 'components/EtherscanLink'

export function displayTokenSymbolOrLink(token: TokenDetails): React.ReactNode | string {
  const displayName = safeTokenName(token)
  if (displayName.startsWith('0x')) {
    return <EtherscanLink type="token" identifier={token.address} />
  }
  return displayName
}

export function computeMarketProp({
  sellToken,
  buyToken,
}: {
  sellToken: TokenDetails
  buyToken: TokenDetails
}): string | null {
  if (!sellToken || !buyToken) return null

  return `${safeTokenName(sellToken).toLowerCase()}-${safeTokenName(buyToken).toLowerCase()}`
}
