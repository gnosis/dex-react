import React from 'react'
import styled from 'styled-components'
import BN from 'bn.js'
import { toast } from 'react-toastify'

import { TokenBalanceDetails } from 'types'
import unknownTokenImg from 'img/unknown-token.png'

const WrapperRow = styled.tr`
  img {
    width: 30px;
    height: 30px;
  }
`

function loadFallbackTokenImage(event: React.FormEvent<HTMLImageElement>): void {
  const image = event.target as HTMLImageElement
  image.src = unknownTokenImg
}

export interface RowProps {
  tokenBalances: TokenBalanceDetails
}

function formatBN(number: BN): string {
  return number.toString()
}

export const Row: React.FC<RowProps> = (props: RowProps) => {
  const tokenBalances = props.tokenBalances

  return (
    <WrapperRow data-address={tokenBalances.address} data-address-mainnet={tokenBalances.addressMainnet}>
      <td>
        <img src={tokenBalances.image} alt={tokenBalances.name} onError={loadFallbackTokenImage} />
      </td>
      <td>{tokenBalances.name}</td>
      <td>{formatBN(tokenBalances.exchangeBalance)}</td>
      <td>{formatBN(tokenBalances.depositingBalance)}</td>
      <td>{formatBN(tokenBalances.withdrawingBalance)}</td>
      <td>
        {tokenBalances.enabled ? (
          <>
            <button onClick={(): any => toast.info('Hello!!')}>+ Deposit</button>
            <button onClick={(): any => toast.error('Hello!!')} className="danger">
              - Withdraw
            </button>
          </>
        ) : (
          <button className="success">✓ Enable {tokenBalances.symbol}</button>
        )}
      </td>
    </WrapperRow>
  )
}

export default Row
