import React, { useEffect, useCallback, useState } from 'react'
import styled from 'styled-components'
import { useFormContext } from 'react-hook-form'

import { ZERO } from 'const'

import { TradeFormTokenId, TradeFormData } from './'
import { adjustPrecision } from '@gnosis.pm/dex-js'

const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  height: 6em;
`

const InputBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  flex-grow: 1;

  margin-left: 1em;

  > div {
    display: flex;
    justify-content: center;
    align-items: center;
    > input[type='radio'] {
      width: 20%;
    }
  }

  .radio-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  input {
    margin: 0;
    width: 100%;

    &.error {
      // box-shadow: 0 0 0.1875rem #cc0000;
      border-color: #ff0000a3;
    }

    &.warning {
      // box-shadow: 0 0 0.1875rem #ff7500;
      border-color: orange;
    }

    &:disabled {
      box-shadow: none;
    }
  }
`

const WalletDetail = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.75em;

  .success {
    color: green;
    text-decoration: none;
  }

  &.error,
  &.warning {
    margin: 0 0 1em 0;
  }

  &.error {
    color: red;
  }
  &.warning {
    color: orange;
  }
`

const validInputPattern = new RegExp(/^\d+\.?\d*$/) // allows leading and trailing zeros

function validatePositive(value: string): true | string {
  return Number(value) == 0 || Number(value) >= 5 || 'Invalid expiration time'
}

interface Props {
  inputId: TradeFormTokenId
  isDisabled: boolean
  tabIndex: number
  isUnlimited: boolean
}

// const UNLIMITED_ORDER_VALIDITY_LENGTH = 'Infinity'

const OrderValidity: React.FC<Props> = ({ inputId, isDisabled, tabIndex, isUnlimited }) => {
  const [unlimited, setUnlimited] = useState(isUnlimited)
  const { register, errors, setValue, watch } = useFormContext<TradeFormData>()
  const error = errors[inputId]
  const inputValue = watch(inputId)
  const overMax = ZERO
  const className = error ? 'error' : overMax.gt(ZERO) ? 'warning' : ''
  const errorOrWarning = error && <WalletDetail className="error">{error.message}</WalletDetail>

  const handleChange = useCallback(() => {
    const newValue = adjustPrecision(inputValue, 0)
    if (inputValue !== newValue) {
      setValue(inputId, newValue, true)
    }
  }, [inputValue, setValue, inputId])

  useEffect(() => {
    handleChange()
  }, [handleChange])

  function handleUnlimitedClick(): void {
    setUnlimited(!unlimited)
    !unlimited && setValue(inputId, '', true)
  }

  return (
    <Wrapper>
      <h3>Expiration time:</h3>
      <InputBox>
        <div className="main-input-container">
          <input
            className={className}
            name={inputId}
            type="number"
            step="5"
            disabled={isDisabled || unlimited}
            required
            ref={register({
              pattern: { value: validInputPattern, message: 'Expiration time cannot be negative' },
              validate: { positive: validatePositive },
            })}
            onChange={handleChange}
            tabIndex={tabIndex + 2}
          />
          <div className="radio-container">
            <input type="checkbox" defaultChecked={isUnlimited} onClick={handleUnlimitedClick} />
            <small>Unlimited</small>
          </div>
        </div>
        {errorOrWarning}
      </InputBox>
    </Wrapper>
  )
}

export default OrderValidity
