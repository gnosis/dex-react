import React from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'

const Wrapper = styled.footer`
  display: flex;
  flex-flow: row wrap;
  justify-content: center;
  align-items: center;
  padding 1.3em;
  text-align: center;
  position: relative;
  color: var(--color-text-secondary);
  font-size: 0.85rem;

  ul {
    display: flex;
    list-style-type: none;
    justify-content: center;
    white-space: nowrap;
  }

  li {
    margin: 0 1rem;
    a {
      color: var(--color-text-secondary);
    }
  }

  ul, .version {
    margin-left: auto;
  }

  .version {
    font-size: 0.85em;
  }
`

const Footer: React.FC = () => (
  <Wrapper>
    <ul>
      <li>
        <Link to="/about">About dFusion</Link>
      </li>
      <li>
        <Link to="/source-code">Source code</Link>
      </li>
    </ul>
    <div className="version">dFusion PoC v{VERSION}</div>
  </Wrapper>
)

export default Footer
