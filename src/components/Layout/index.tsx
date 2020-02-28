import React from 'react'
import styled from 'styled-components'

import Header from './Header'
import Footer from './Footer'
import LegalBanner from '../LegalBanner'

import { MEDIA } from 'const'

const Wrapper = styled.div`
  width: 100%;
  display: flex;
  flex-flow: column wrap;

  main {
    flex: 1;
    margin: 2.4rem auto 5rem;
    width: auto;
    display: flex;
    flex-flow: row wrap;
    align-items: flex-start;
    justify-content: flex-start;
    font-size: 1.3rem;
    line-height: 1.2;

    @media ${MEDIA.mobile} {
      width: 100%;
    }

    > section {
      width: 100%;
      @media ${MEDIA.mobile} {
        width: 100%;
        overflow: initial;
      }
    }

    @media ${MEDIA.mobile} {
      margin: 1.6rem auto 3.2rem;
    }
  }
`

const navigation = [
  {
    label: 'Trade',
    to: '/trade',
    order: 1,
  },
  {
    label: 'Liquidity',
    to: '/liquidity',
    order: 2,
    withPastLocation: true,
  },
  {
    label: 'Orders',
    to: '/orders',
    order: 3,
    withPastLocation: true,
  },
  {
    label: 'Balances',
    to: '/wallet',
    order: 4,
    withPastLocation: true,
  },
]

const Layout: React.FC = ({ children }) => (
  <Wrapper>
    <LegalBanner useFull={false} title="💀 This project is in beta. Use at your own risk." />
    <Header navigation={navigation} />
    <main>{children}</main>
    <Footer />
  </Wrapper>
)

export default Layout
