import styled from 'styled-components'
import { RESPONSIVE_SIZES } from 'const'

const { TABLET } = RESPONSIVE_SIZES

export const ModalBodyWrapper = styled.div`
  div > p {
    padding: 0 1em;
    color: #828282;
    font-size: 0.85em;
  }
`

export const TokenRow = styled.tr`
  // Each cell wrapper
  > * {
    margin: 0.1rem;
    padding: 0.7rem;
    text-align: center;
    transition: all 0.5s ease;

    > button {
      margin: 0.2rem;
    }

    &:first-child {
      display: grid;
      grid-template-columns: min-content max-content;
      grid-gap: 1em;
      align-items: center;

      > * {
        margin: 0.375rem;
      }

      > div:last-child {
        text-align: initial;
      }
    }

    &:last-child {
      display: flex;
      flex-flow: column;
    }
  }

  &.loading {
    background-color: #f7f7f7;
    border-bottom-color: #b9b9b9;
  }

  @media only screen and (max-width: ${TABLET}em) {
    > td {
      // Each item in each cell
      > * {
        margin-left: 0.625rem;
      }
      // Token
      &:first-child {
        grid-template-columns: 1fr max-content auto;

        > img {
          order: 2;
          margin-right: -0.5rem;
        }
      }
      // Actions
      &:last-child {
        border: none;
        flex-flow: row nowrap;
        padding: 0.7rem 0 0.7rem 0.7rem;

        > button:last-child {
          border-radius: 0 var(--border-radius) var(--border-radius);
        }
      }
    }
    &.selected {
      > div {
        border-bottom: 0.0625rem solid #ffffff40;
      }
    }
  }
`

export const RowClaimButton = styled.button`
  margin-bottom: 0;
`

export const RowClaimLink = styled.a`
  text-decoration: none;

  &.success {
    color: #63ab52;
  }
  &.disabled {
    color: currentColor;
    cursor: not-allowed;
    opacity: 0.5;
  }
`
export const LineSeparator = styled.div`
  border: 0.03125rem solid var(--color-text-primary);
  margin: auto;
  width: calc(100% - 1.5625rem);
`
