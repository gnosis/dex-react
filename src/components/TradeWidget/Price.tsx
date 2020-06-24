import React, { useCallback, useState } from 'react'
import styled from 'styled-components'
import { useFormContext } from 'react-hook-form'
import { invertPrice } from '@gnosis.pm/dex-js'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRetweet } from '@fortawesome/free-solid-svg-icons'

// types, utils
import { TokenDetails } from 'types'
import { parseBigNumber } from 'utils'
import { DEFAULT_PRECISION, MEDIA } from 'const'

// Components
import { OrderBookBtn } from 'components/OrderBookBtn'

// TradeWidget: subcomponents
import { TradeFormData } from 'components/TradeWidget'
import FormMessage, { FormInputError } from 'components/TradeWidget/FormMessage'
import { useNumberInput } from 'components/TradeWidget/useNumberInput'

const Wrapper = styled.div`
  display: flex;
  flex-flow: row wrap;
  width: 100%;
  margin: 1.6rem 0 0;
  justify-content: space-between;

  > strong {
    display: flex;
    align-items: center;
    text-transform: capitalize;
    color: var(--color-text-primary);
    width: 100%;
    margin: 0 0 1rem;
    padding: 0;
    box-sizing: border-box;
    font-size: 1.5rem;

    @media ${MEDIA.mobile} {
      font-size: 1.3rem;
    }

    > ${FormMessage} {
      width: min-content;
      white-space: nowrap;
      font-size: x-small;
      margin: 0 0.5rem;
    }

    > button {
      background: none;
      border: 0;
      outline: 0;
      color: var(--color-text-active);
    }

    > button:hover {
      text-decoration: underline;
    }
  }
`

export const PriceInputBox = styled.div<{ hidden?: boolean }>`
  display: ${(props): string => (props.hidden ? 'none' : 'flex')};
  flex-flow: column nowrap;
  margin: 0;
  width: 100%;
  position: relative;
  outline: 0;

  @media ${MEDIA.mobile} {
    width: 100%;
    margin: 0 0 1.6rem;
  }

  .swap-icon {
    padding: 0.7em 0.3em;
    cursor: pointer;
  }

  label {
    display: flex;
    width: auto;
    max-width: 100%;
    height: 5.6rem;
    position: relative;

    @media ${MEDIA.mobile} {
      width: 100%;
    }
  }

  label > div:not(.radio-container) {
    position: absolute;
    right: 1rem;
    top: 0;
    bottom: 0;
    margin: auto;
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    justify-content: space-evenly;
    opacity: 0.75;
    font-size: 1.1rem;
    color: var(--color-text-primary);
    letter-spacing: -0.05rem;
    text-align: right;
    font-weight: var(--font-weight-bold);

    @media ${MEDIA.mobile} {
      font-size: 1rem;
      letter-spacing: 0.03rem;
    }
    > small:not(:nth-child(2)) {
      font-size: inherit;
      max-width: 6ch;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }
    > small:nth-child(2) {
      margin: 0 0.3rem;
      font-size: 1rem;
    }
  }

  input:not([type='checkbox']) {
    margin: 0;
    width: 100%;
    max-width: 100%;
    background: var(--color-background-input);
    border-radius: 0.6rem 0.6rem 0 0;
    border: 0;
    font-size: 1.6rem;
    line-height: 1;
    box-sizing: border-box;
    border-bottom: 0.2rem solid transparent;
    font-weight: var(--font-weight-normal);
    padding: 0 15ch 0 1rem;
    outline: 0;

    @media ${MEDIA.mobile} {
      font-size: 1.3rem;
      width: 100%;
    }

    &:focus {
      border-bottom: 0.2rem solid var(--color-text-active);
      border-color: var(--color-text-active);
      color: var(--color-text-active);
    }

    &:focus::placeholder {
      color: transparent;
    }

    &.error {
      border-color: var(--color-error);
    }

    &.warning {
      border-color: orange;
    }

    &:disabled {
      box-shadow: none;
    }
  }
`

interface Props {
  sellToken: TokenDetails
  receiveToken: TokenDetails
  priceInputId: string
  priceInverseInputId: string
  tabIndex?: number
}

export function invertPriceFromString(priceValue: string): string {
  const price = parseBigNumber(priceValue)
  return price ? invertPrice(price).toString(10) : ''
}

const Price: React.FC<Props> = ({ sellToken, receiveToken, priceInputId, priceInverseInputId, tabIndex }) => {
  const { register, errors, setValue } = useFormContext<TradeFormData>()

  const [priceShown, setPriceShown] = useState<'INVERSE' | 'DIRECT'>('INVERSE')

  const swapPrices = (): void => {
    setPriceShown(oldPrice => (oldPrice === 'DIRECT' ? 'INVERSE' : 'DIRECT'))
  }

  const errorPrice = errors[priceInputId]
  const errorPriceInverse = errors[priceInverseInputId]
  const isError = errorPrice || errorPriceInverse

  const updateInversePrice = useCallback(
    (inverseInputId: string, event: React.ChangeEvent<HTMLInputElement>): void => {
      const priceValue = event.target.value
      const priceInverseValue = invertPriceFromString(priceValue)
      setValue(inverseInputId, priceInverseValue, true)
    },
    [setValue],
  )

  const onChangePrice = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      updateInversePrice(priceInverseInputId, e)
    },
    [updateInversePrice, priceInverseInputId],
  )

  const onChangePriceInverse = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      updateInversePrice(priceInputId, e)
    },
    [updateInversePrice, priceInputId],
  )

  const { onKeyPress: onKeyPressPrice, removeExcessZeros: removeExcessZerosPrice } = useNumberInput({
    inputId: priceInputId,
    precision: DEFAULT_PRECISION,
  })
  const { onKeyPress: onKeyPressPriceInverse, removeExcessZeros: removeExcessZerosPriceInverse } = useNumberInput({
    inputId: priceInverseInputId,
    precision: DEFAULT_PRECISION,
  })

  return (
    <Wrapper>
      <strong>
        Limit Price <OrderBookBtn baseToken={receiveToken} quoteToken={sellToken} />
      </strong>
      {/* using display: none to hide to avoid hook-form reregister */}
      <PriceInputBox hidden={priceShown !== 'DIRECT'}>
        <label>
          <input
            className={isError ? 'error' : ''}
            name={priceInputId}
            type="text"
            onChange={onChangePrice}
            ref={register}
            onKeyPress={onKeyPressPrice}
            onBlur={removeExcessZerosPrice}
            onFocus={(e): void => e.target.select()}
            tabIndex={tabIndex}
          />
          <div>
            <small title={receiveToken.symbol}>{receiveToken.symbol}</small>
            <small>per</small>
            <small title={sellToken.symbol}>{sellToken.symbol}</small>
            <span className="swap-icon" onClick={swapPrices}>
              <FontAwesomeIcon icon={faRetweet} />
            </span>
          </div>
        </label>
        <FormInputError errorMessage={errorPrice?.message} />
      </PriceInputBox>
      <PriceInputBox hidden={priceShown !== 'INVERSE'}>
        <label>
          <input
            name={priceInverseInputId}
            className={isError ? 'error' : ''}
            type="text"
            ref={register}
            onChange={onChangePriceInverse}
            onKeyPress={onKeyPressPriceInverse}
            onBlur={removeExcessZerosPriceInverse}
            onFocus={(e): void => e.target.select()}
            tabIndex={tabIndex}
          />
          <div>
            <small title={sellToken.symbol}>{sellToken.symbol}</small>
            <small>per</small>
            <small title={receiveToken.symbol}>{receiveToken.symbol}</small>
            <span className="swap-icon" onClick={swapPrices}>
              <FontAwesomeIcon icon={faRetweet} />
            </span>
          </div>
        </label>
        <FormInputError errorMessage={errorPriceInverse?.message} />
      </PriceInputBox>
      {/*  MAX SLIPPAGE CONTROL */}
    </Wrapper>
  )
}

export default Price
