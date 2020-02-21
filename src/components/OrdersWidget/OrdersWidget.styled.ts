import styled from 'styled-components'
import { MEDIA } from 'const'

export const OrdersWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-flow: column wrap;
  position: relative;

  @media ${MEDIA.mobile} {
    background: #ffffff;
    box-shadow: 0 -1rem 4rem 0 rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.02) 0 0.276726rem 0.221381rem 0,
      rgba(0, 0, 0, 0.027) 0 0.666501rem 0.532008rem 0, rgba(0, 0, 0, 0.035) 0 1.25216rem 1.0172rem 0,
      rgba(0, 0, 0, 0.043) 0 2.23363rem 1.7869rem 0, rgba(0, 0, 0, 0.05) 0 4.17776rem 3.34221rem 0,
      rgba(0, 0, 0, 0.07) 0 10rem 8rem 0;
    border-radius: 0.6rem;
  }

  > div {
    width: 100%;
    position: relative;
    display: flex;
    flex-flow: column wrap;
    flex: 1 1 auto;
  }

  > a {
    margin-bottom: -2em;
  }
`

export const ButtonWithIcon = styled.button`
  min-width: 10rem;
  width: 100%;

  > b {
    margin: 0 1rem 0 0;
    font-weight: var(--font-weight-bold);
    font-family: initial;
  }

  > strong {
    padding: 0.5rem 1rem;
    border-radius: 6rem;
    border: 0.1rem solid #a71409;
    transition: background 0.2s ease-in-out, color 0.2s ease-in-out;
  }

  > strong:hover {
    background: #a71409;
    color: #ffffff;
  }

  > svg {
    margin: 0 0.25rem;
  }
`

export const CreateButtons = styled.div`
  margin: 2rem 0 0;
  display: grid;

  &.withOrders {
    justify-items: start;
    grid-gap: 0.25em 0.75em;
    grid:
      'tradeBtn strategyBtn'
      '.        strategyInfo'
      / 1fr 1fr;

    .tradeBtn {
      justify-self: end;
    }
  }

  &.withoutOrders {
  }

  .noOrdersInfo {
    line-height: 1.4;
    text-align: center;
    font-size: 1.4rem;
  }
  .tradeBtn {
    grid-area: tradeBtn;
  }
  .strategyBtn {
    grid-area: strategyBtn;
  }
  .strategyInfo {
    grid-area: strategyInfo;
  }

  button {
    // resetting button margins to help with alignment
    margin: 0;
  }
`

export const OrdersForm = styled.div`
  .infoContainer {
    margin: 1rem auto 0;
    display: flex;
    flex-flow: row nowrap;
    width: 100%;
    justify-content: center;
    height: 6.4rem;
    border-bottom: 0.1rem solid #9fb4c9;
    align-items: center;

    @media ${MEDIA.mobile} {
      margin: 0 auto;
    }

    .warning {
    }

    .countContainer {
      display: flex;
      width: 100%;
      height: 100%;
      margin: 0 0 -0.1rem;
      align-items: center;

      > button {
        font-weight: var(--font-weight-medium);
        font-size: 1.5rem;
        color: #9fb4c9;
        letter-spacing: 0;
        text-align: center;
        background: transparent;
        flex: 1;
        height: 100%;
        outline: 0;
        text-transform: uppercase;
        display: flex;
        width: 100%;
        justify-content: center;
        transition: border 0.2s ease-in-out;
        align-items: center;
        border-bottom: 0.3rem solid transparent;
      }

      > button > i {
        height: 1.8rem;
        font-weight: inherit;
        font-size: 1.1rem;
        color: #ffffff;
        letter-spacing: -0.046rem;
        text-align: center;
        background: #9fb4c9;
        border-radius: 6rem;
        padding: 0 0.75rem;
        box-sizing: border-box;
        line-height: 1.8rem;
        font-style: normal;
        display: inline-block;
        height: 1.8rem;
        margin: 0 0 0 0.5rem;
      }

      > button.selected {
        border-bottom: 0.3rem solid #218dff;
        color: #218dff;
      }

      > button.selected > i {
        background: #218dff;
      }
    }

    .total {
    }

    .expired {
    }
  }

  .ordersContainer {
    display: grid;
    padding: 0 0 5rem;
    box-sizing: border-box;
  }

  .checked {
    display: flex;
    justify-content: left;
    align-items: center;

    > input {
      // width: auto;
    }
  }

  .deleteContainer {
    display: flex;
    flex-direction: column;
    position: sticky;
    top: 4rem;
    z-index: 10;
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;

    > button {
      background: #ffd4d1;
      color: #a71409;
      height: 4.2rem;
      text-align: left;
      padding: 0 0.9rem;
      opacity: 1;
      font-size: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.05rem;
      transition: height 0.2s ease-in-out, opacity 0.2s ease-in-out;
      outline: 0;
    }

    > button:disabled,
    > button[disabled] {
      height: 0;
      overflow: hidden;
      padding: 0 0.9rem;
      opacity: 0;
    }
  }

  .noOrders {
    padding: 3em;
    display: flex;
    justify-content: center;

    @media ${MEDIA.mobile} {
      font-size: 1.4rem;
      min-height: 20rem;
    }
  }

  .warning {
    color: orange;
  }
`
