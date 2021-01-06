import React from 'react'
import styled from 'styled-components'

import TokenPairSelector from 'components/TokenPairSelector'
import OrderBuySell from 'components/OrderBuySell'

const Wrapper = styled.div`
  display: flex;
  background: none;
  width: 31rem;
  flex-flow: column wrap;
  position: relative;
  height: 100%;
  border-right: 0.1rem solid var(--color-border);
`

const OrderForm: React.FC = () => (
  <Wrapper>
    <TokenPairSelector selectedPair="ETH/USDC" selectLabel="Select Pair" />
    <OrderBuySell />
  </Wrapper>
)

export default OrderForm
