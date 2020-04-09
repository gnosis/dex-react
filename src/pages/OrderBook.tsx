import React, { useEffect } from 'react'
import { ContentPage } from 'components/Layout/PageWrapper'
import OrderBookWidget from 'components/OrderBookWidget'
import TokenSelector from 'components/TokenSelector'
import { useTokenList } from 'hooks/useTokenList'
import { useWalletConnection } from 'hooks/useWalletConnection'
import useSafeState from 'hooks/useSafeState'
import { TokenDetails } from 'types'
import styled from 'styled-components'
import { MEDIA } from 'const'

const OrderBookPage = styled(ContentPage)`
  padding: 2.4rem 0rem;
  min-height: initial;
`

const OrderBookWrapper = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  flex-flow: row wrap;
  padding: 0 1.6rem 1.6rem;
  justify-content: space-between;

  > h1 {
    margin: 0 auto 0 0;
    width: auto;

    @media ${MEDIA.mobile} {
      width: 100%;
      margin: 0 auto 1rem;
      text-align: center;
    }
  }

  > span {
    display: flex;
    flex-flow: row wrap;
    align-items: center;
  }

  > span:first-of-type::after {
    content: '⟶';
    margin: 0 1rem;

    @media ${MEDIA.mobile} {
      display: none;
    }
  }

  > span:first-of-type > p {
    margin: 0 1rem 0 0;
  }

  > span:last-of-type > p {
    margin: 0 0 0 1rem;
  }
`

const OrderBook: React.FC = () => {
  const { networkIdOrDefault } = useWalletConnection()
  const tokenList = useTokenList(networkIdOrDefault)
  const [baseToken, setBaseToken] = useSafeState<TokenDetails | null>(null)
  const [quoteToken, setQuoteToken] = useSafeState<TokenDetails | null>(null)

  const tokensLoaded = tokenList.length !== 0
  useEffect(() => {
    if (tokensLoaded) {
      if (baseToken === null) {
        setBaseToken(tokenList[0])
      }

      if (quoteToken === null) {
        setQuoteToken(tokenList[1])
      }
    }
  }, [baseToken, quoteToken, setBaseToken, setQuoteToken, tokenList, tokensLoaded])

  if (!tokensLoaded || baseToken === null || quoteToken === null) {
    return null
  }

  return (
    <OrderBookPage>
      <OrderBookWrapper>
        <h1>Order book</h1>
        <span>
          <p>Bid</p> <TokenSelector tokens={tokenList} selected={baseToken} onChange={setBaseToken} />
        </span>
        <span>
          <TokenSelector tokens={tokenList} selected={quoteToken} onChange={setQuoteToken} /> <p>Ask</p>
        </span>
      </OrderBookWrapper>

      <OrderBookWidget baseToken={baseToken} quoteToken={quoteToken} networkId={networkIdOrDefault} />
    </OrderBookPage>
  )
}

export default OrderBook
