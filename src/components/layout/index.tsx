import React from 'react'
import Header from './Header'
import Footer from './Footer'
import styled from 'styled-components'

const Wrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;

  main {
    flex: 1;
    margin: auto;
  }
`

const Layout: React.FC = ({ children }) => (
  <Wrapper>
    <Header />
    <main>{children}</main>
    <Footer />
  </Wrapper>
)

export default Layout
