import React, { useEffect, useCallback } from 'react'
import BN from 'bn.js'
import styled from 'styled-components'
import { useFormContext } from 'react-hook-form'

import LinkWithPastLocation from 'components/LinkWithPastLocation'
import TokenImg from 'components/TokenImg'
import TokenSelector from 'components/TokenSelector'
import { TokenDetails, TokenBalanceDetails } from 'types'
import { formatAmount, formatAmountFull, parseAmount, adjustPrecision } from 'utils'
import { ZERO } from 'const'

const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  height: 6em;
`

const TokenImgWrapper = styled(TokenImg)`
  width: 4em;
  height: 4em;

  margin-right: 1em;
`

const InputBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  flex-grow: 1;

  margin-left: 1em;

  input {
    margin: 0 0 0.5em 0;
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

function displayBalance<K extends keyof TokenBalanceDetails>(
  balance: TokenBalanceDetails | undefined | null,
  key: K,
): string {
  if (!balance) {
    return '0'
  }
  return formatAmount(balance[key] as BN, balance.decimals) || '0'
}

const validInputPattern = new RegExp(/^\d+\.?\d*$/) // allows leading and trailing zeros
const leadingAndTrailingZeros = new RegExp(/(^0*(?=\d)|\.0*$)/, 'g') // removes leading zeros and trailing '.' followed by zeros
const trailingZerosAfterDot = new RegExp(/(.*\.\d+?)0*$/) // selects valid input without leading zeros after '.'

function preventInvalidChars(event: React.KeyboardEvent<HTMLInputElement>): void {
  if (!validInputPattern.test(event.currentTarget.value + event.key)) {
    event.preventDefault()
  }
}

function validatePositive(value: string): true | string {
  return Number(value) > 0 || 'Invalid amount'
}

interface Props {
  selectedToken: TokenDetails
  tokens: TokenDetails[]
  balance: TokenBalanceDetails
  selectLabel: string
  onSelectChange: (selected: TokenDetails) => void
  inputId: string
  isDisabled: boolean
  validateMaxAmount?: true
  tabIndex: number
}

const TokenRow: React.FC<Props> = ({
  selectedToken,
  tokens,
  selectLabel,
  onSelectChange,
  balance,
  inputId,
  isDisabled,
  validateMaxAmount,
  tabIndex,
}) => {
  const { register, errors, setValue, watch } = useFormContext()
  const error = errors[inputId]
  const inputValue = watch(inputId)

  let overMax = ZERO
  if (balance && validateMaxAmount) {
    const max = balance.totalExchangeBalance
    const value = new BN(parseAmount(inputValue, selectedToken.decimals) || '0')
    overMax = value.gt(max) ? value.sub(max) : ZERO
  }

  const className = error ? 'error' : overMax.gt(ZERO) ? 'warning' : ''

  const errorOrWarning = error ? (
    <WalletDetail className="error">{error.message}</WalletDetail>
  ) : (
    overMax.gt(ZERO) && (
      <WalletDetail className="warning">
        Selling {formatAmountFull(overMax, selectedToken.decimals)} {selectedToken.symbol} over your current balance
      </WalletDetail>
    )
  )

  function useMax(): void {
    // boolean true here forces form validation
    setValue(inputId, formatAmountFull(balance.totalExchangeBalance, balance.decimals, false), true)
  }

  const enforcePrecision = useCallback(() => {
    const newValue = adjustPrecision(inputValue, selectedToken.decimals)
    if (inputValue !== newValue) {
      setValue(inputId, newValue, true)
    }
  }, [inputValue, selectedToken.decimals, setValue, inputId])

  useEffect(() => {
    enforcePrecision()
  }, [enforcePrecision])

  const removeExcessZeros = useCallback(
    (event: React.SyntheticEvent<HTMLInputElement>): void => {
      // Q: Why do we need this function instead of relying on `preventInvalidChars` or `enforcePrecision`?
      // A: Because on those functions we still want the user to be able to input partial values. E.g.:
      //    0 -> 0. -> 0.1 -> 0.10 -> 0.105
      //    When losing focus though (`onBlur`), we remove everything that's redundant, such as leading zeros,
      //    trailing dots and/or zeros
      // Q: Why not use formatAmount/parseAmount that already take care of this?
      // A: Too many steps (convert to and from BN) and binds the function to selectedToken.decimals

      const { value } = event.currentTarget
      const newValue = value.replace(leadingAndTrailingZeros, '').replace(trailingZerosAfterDot, '$1')

      if (value != newValue) {
        setValue(inputId, newValue, true)
      }
    },
    [inputId, setValue],
  )

  const onKeyPress = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>): void =>
      event.key === 'Enter' ? removeExcessZeros(event) : preventInvalidChars(event),
    [removeExcessZeros],
  )

  return (
    <Wrapper>
      <TokenImgWrapper alt={selectedToken.name} src={selectedToken.image} />
      <TokenSelector
        label={selectLabel}
        isDisabled={isDisabled}
        tokens={tokens}
        selected={selectedToken}
        onChange={onSelectChange}
        tabIndex={tabIndex}
      />
      <InputBox>
        <input
          className={className}
          placeholder="0"
          name={inputId}
          type="text"
          disabled={isDisabled}
          required
          ref={register({
            pattern: { value: validInputPattern, message: 'Invalid amount' },
            validate: { positive: validatePositive },
          })}
          onKeyPress={onKeyPress}
          onChange={enforcePrecision}
          onBlur={removeExcessZeros}
          tabIndex={tabIndex + 2}
        />
        {errorOrWarning}
        <WalletDetail>
          <div>
            <strong>
              <LinkWithPastLocation to="/wallet" tabIndex={-1}>
                Exchange wallet:
              </LinkWithPastLocation>
            </strong>{' '}
            <span className="success">
              {balance ? formatAmount(balance.totalExchangeBalance, balance.decimals) : '0'}
            </span>
          </div>
          {validateMaxAmount && <a onClick={useMax}>use max</a>}
        </WalletDetail>
        <WalletDetail>
          <div>
            <strong>Wallet:</strong> {displayBalance(balance, 'walletBalance')}
          </div>
        </WalletDetail>
      </InputBox>
    </Wrapper>
  )
}

export default TokenRow
