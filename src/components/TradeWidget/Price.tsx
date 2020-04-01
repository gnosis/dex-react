import React from 'react'
import styled from 'styled-components'
import { useFormContext } from 'react-hook-form'
import { invertPrice } from '@gnosis.pm/dex-js'

import { TokenDetails } from 'types'
import { parseBigNumber } from 'utils'
import { DEFAULT_PRECISION, MEDIA } from 'const'

import { TradeFormData } from '.'
import { FormInputError } from './FormMessage'
import { useNumberInput } from './useNumberInput'

const Wrapper = styled.div`
  display: flex;
  flex-flow: row wrap;
  width: 100%;
  margin: 1.6rem 0 0;
  justify-content: space-between;

  > strong {
    text-transform: capitalize;
    color: #2f3e4e;
    width: 100%;
    margin: 0 0 1rem;
    padding: 0;
    box-sizing: border-box;
    font-size: 1.5rem;
    @media ${MEDIA.mobile} {
      font-size: 1.3rem;
    }
  }
`

export const PriceInputBox = styled.div`
  display: flex;
  flex-flow: column nowrap;
  margin: 0;
  width: 50%;
  width: calc(50% - 0.8rem);
  position: relative;
  outline: 0;

  @media ${MEDIA.mobile} {
    width: 100%;
    margin: 0 0 1.6rem;
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

  label > small {
    position: absolute;
    right: 1rem;
    top: 0;
    bottom: 0;
    margin: auto;
    display: flex;
    align-items: center;
    opacity: 0.75;
    font-size: 1.2rem;
    color: #476481;
    letter-spacing: -0.05rem;
    text-align: right;
    font-weight: var(--font-weight-bold);

    @media ${MEDIA.mobile} {
      font-size: 1rem;
      letter-spacing: 0.03rem;
    }
  }

  input:not([type='checkbox']) {
    margin: 0;
    width: auto;
    max-width: 100%;
    background: #e7ecf3;
    border-radius: 0.6rem 0.6rem 0 0;
    border: 0;
    font-size: 1.6rem;
    line-height: 1;
    box-sizing: border-box;
    border-bottom: 0.2rem solid transparent;
    font-weight: var(--font-weight-normal);
    padding: 0 8.5rem 0 1rem;
    outline: 0;

    @media ${MEDIA.mobile} {
      font-size: 1.3rem;
      width: 100%;
    }

    &:focus {
      border-bottom: 0.2rem solid #218dff;
      border-color: #218dff;
      color: #218dff;
    }

    &:focus::placeholder {
      color: transparent;
    }

    &.error {
      border-color: #ff0000a3;
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
  const { register, errors } = useFormContext<TradeFormData>()

  const errorPrice = errors[priceInputId]
  const errorPriceInverse = errors[priceInverseInputId]
  const isError = errorPrice || errorPriceInverse

  const { onKeyPress: onKeyPressPrice, removeExcessZeros: removeExcessZerosPrice } = useNumberInput({
    inputId: priceInputId,
    precision: DEFAULT_PRECISION,
  })
  const { onKeyPress: onKeyPressPriceInverse, removeExcessZeros: removeExcessZerosPriceInverse } = useNumberInput({
    inputId: priceInputId,
    precision: DEFAULT_PRECISION,
  })

  return (
    <Wrapper>
      <strong>Min. sell price</strong>
      <PriceInputBox>
        <label>
          <input
            className={isError ? 'error' : ''}
            name={priceInputId}
            type="text"
            ref={register}
            onKeyPress={onKeyPressPrice}
            onBlur={removeExcessZerosPrice}
            onFocus={(e): void => e.target.select()}
            tabIndex={tabIndex}
          />
          <small>
            {sellToken.symbol}/{receiveToken.symbol}
          </small>
        </label>
        <FormInputError errorMessage={errorPrice?.message} />
      </PriceInputBox>
      <PriceInputBox>
        <label>
          <input
            name={priceInverseInputId}
            className={isError ? 'error' : ''}
            type="text"
            ref={register}
            onKeyPress={onKeyPressPriceInverse}
            onBlur={removeExcessZerosPriceInverse}
            onFocus={(e): void => e.target.select()}
            tabIndex={tabIndex}
          />
          <small>
            {receiveToken.symbol}/{sellToken.symbol}
          </small>
        </label>
        <FormInputError errorMessage={errorPriceInverse?.message} />
      </PriceInputBox>
    </Wrapper>
  )
}

export default Price
