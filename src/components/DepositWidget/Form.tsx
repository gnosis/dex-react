import React, { useEffect, ChangeEvent, ReactNode } from 'react'
import BN from 'bn.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconDefinition, faSpinner } from '@fortawesome/free-solid-svg-icons'
import plus from 'assets/img/plus.svg'

import { CardDrawer } from 'components/Layout/Card'
import { WalletDrawerInnerWrapper } from './Form.styled'

import useSafeState from 'hooks/useSafeState'
import useScrollIntoView from 'hooks/useScrollIntoView'

import { TokenBalanceDetails } from 'types'
import { formatAmountFull, parseAmount } from 'utils'
import useKeyPress from 'hooks/useKeyDown'

export interface FormProps {
  tokenBalances: TokenBalanceDetails
  title: ReactNode
  totalAmountLabel: string
  totalAmount: BN
  inputLabel: string
  responsive?: boolean
  submitBtnLabel: string
  submitBtnIcon: IconDefinition
  onSubmit: (amount: BN) => Promise<void>
  onClose: () => void
}

interface Errors {
  amountInput: string
}

function _validateForm(totalAmount: BN, amountInput: string, decimals: number): string | null {
  if (!amountInput) {
    return 'Required amount'
  }

  const amount = parseAmount(amountInput, decimals)

  if (!amount || amount.isZero()) {
    return 'Invalid amount'
  }

  if (amount.gt(totalAmount)) {
    return 'Insufficient balance'
  }

  return null // no error
}

export const Form: React.FC<FormProps> = (props: FormProps) => {
  const { symbol, decimals } = props.tokenBalances
  const { title, totalAmount, totalAmountLabel, inputLabel, submitBtnLabel } = props
  const [amountInput, setAmountInput] = useSafeState('')
  const [validatorActive, setValidatorActive] = useSafeState(false)
  const [loading, setLoading] = useSafeState(false)
  const [errors, setErrors] = useSafeState<Errors>({
    amountInput: '',
  })

  const cancelForm = (): void => {
    setAmountInput('')
    props.onClose()
  }

  useKeyPress('Escape', cancelForm)

  useEffect(() => {
    if (validatorActive) {
      // Verify on every amount change
      const errorMsg = _validateForm(totalAmount, amountInput, decimals)
      setErrors(oldErrors => ({
        ...oldErrors,
        amountInput: errorMsg || '',
      }))
    }
  }, [amountInput, decimals, setErrors, totalAmount, validatorActive])

  const _onClick = (): void => {
    setValidatorActive(true)
    // TODO: Improve. Do not do 2 times the validation
    const error = _validateForm(totalAmount, amountInput, decimals)
    if (!error) {
      setLoading(true)
      const parsedAmt = parseAmount(amountInput, decimals)
      parsedAmt &&
        props.onSubmit(parsedAmt).then(() => {
          setLoading(false)
          setValidatorActive(false)
          cancelForm()
        })
    }
  }

  const ref = useScrollIntoView<HTMLTableRowElement>()

  return (
    <CardDrawer closeDrawer={(): void => cancelForm()} ref={ref}>
      <div>
        <h4>{title}</h4>
        <WalletDrawerInnerWrapper>
          {/* Withdraw Row */}
          <div className="wallet">
            <b>Exchange Balance</b>
            <div>
              <i>{symbol}</i>
              <input type="text" value={formatAmountFull(totalAmount, decimals) || ''} disabled />
            </div>
          </div>
          {/* Deposit Row */}
          <div className="wallet">
            {/* Output this <span> and parse the abbreviated wallet address here ONLY for DEPOSITS */}
            <span>
              <b>0x4423...egs1</b> {totalAmountLabel}:
              <p onClick={(): void => setAmountInput(formatAmountFull(totalAmount, decimals, false) || '')}>
                {formatAmountFull(totalAmount, decimals) || ''} {symbol}
              </p>
            </span>

            <b>{inputLabel}</b>
            <div>
              <i>{symbol}</i>
              <input
                type="text"
                value={amountInput}
                onChange={(e: ChangeEvent<HTMLInputElement>): void => setAmountInput(e.target.value)}
                placeholder="0"
              />
            </div>
            {/* Error Message */}
            <p className="error">{errors.amountInput || ''}</p>
          </div>
          {/* Submit/Cancel Buttons */}
          <div className="actions">
            <a onClick={cancelForm}>Cancel</a>
            <button type="button" disabled={!!errors.amountInput || loading} onClick={_onClick}>
              {submitBtnLabel}
              {loading ? <FontAwesomeIcon icon={faSpinner} spin={loading} /> : <img src={plus} />}
            </button>
          </div>
        </WalletDrawerInnerWrapper>
      </div>
    </CardDrawer>
  )
}

export default Form
