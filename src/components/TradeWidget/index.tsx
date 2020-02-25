import React, { useState, useMemo, useCallback } from 'react'
import styled from 'styled-components'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import switchTokenPair from 'assets/img/switch.svg'
import arrow from 'assets/img/arrow.svg'
import { FieldValues } from 'react-hook-form/dist/types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useHistory } from 'react-router'
import { toast } from 'toastify'

import TokenRow from './TokenRow'
import OrderValidity from './OrderValidity'
import Widget from 'components/Layout/Widget'
import OrdersWidget from 'components/OrdersWidget'
import { TxNotification } from 'components/TxNotification'

import { useForm, FormContext } from 'react-hook-form'
import { useParams } from 'react-router'
import useURLParams from 'hooks/useURLParams'
import { useTokenBalances } from 'hooks/useTokenBalances'
import { useWalletConnection } from 'hooks/useWalletConnection'
import { usePlaceOrder } from 'hooks/usePlaceOrder'
import { useQuery, buildSearchQuery } from 'hooks/useQuery'
import useGlobalState from 'hooks/useGlobalState'
import { savePendingOrdersAction, removePendingOrdersAction } from 'reducers-actions/pendingOrders'
import { MEDIA } from 'const'

import { tokenListApi } from 'api'

import { Network, TokenDetails } from 'types'

import { getToken, parseAmount } from 'utils'
import { ZERO } from 'const'

const WrappedWidget = styled(Widget)`
  overflow-x: visible;
  min-width: 0;
  width: 80vw;
  margin: 0 auto;
  max-width: 160rem;
  height: 58rem;
  background: #ffffff;
  box-shadow: 0 -1rem 4rem 0 rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.02) 0 0.276726rem 0.221381rem 0,
    rgba(0, 0, 0, 0.027) 0 0.666501rem 0.532008rem 0, rgba(0, 0, 0, 0.035) 0 1.25216rem 1.0172rem 0,
    rgba(0, 0, 0, 0.043) 0 2.23363rem 1.7869rem 0, rgba(0, 0, 0, 0.05) 0 4.17776rem 3.34221rem 0,
    rgba(0, 0, 0, 0.07) 0 10rem 8rem 0;
  border-radius: 0.6rem;
  margin: 0 auto;
  min-height: 54rem;
  font-size: 1.6rem;
  line-height: 1;

  @media ${MEDIA.mobile} {
    flex-flow: column wrap;
    max-height: initial;
    min-height: initial;
    width: 100%;
    height: initial;
  }
`

const WrappedForm = styled.form`
  display: flex;
  flex-flow: column wrap;
  // width: 50%;
  flex: 1 0 42rem;
  max-width: 50rem;
  padding: 1.6rem;
  box-sizing: border-box;
  transition: width 0.2s ease-in-out, opacity 0.2s ease-in-out;
  opacity: 1;
  // position: sticky;
  // top: 0;
  // height: 100%;

  .expanded & {
    width: 0;
    overflow: hidden;
    flex: none;
    padding: 0;
    opacity: 0;
  }

  @media ${MEDIA.mobile} {
    width: 100%;
    flex: 1 1 100%;
    max-width: 100%;
  }

  > p {
    font-size: 1.3rem;
    color: #476481;
    letter-spacing: 0;
    text-align: center;
    margin: 1.6rem 0 0;
  }
`
// Switcharoo arrows
const IconWrapper = styled.a`
  margin: 1rem auto;

  > img {
    transition: opacity 0.2s ease-in-out;
    opacity: 0.5;
    &:hover {
      opacity: 1;
    }
  }
`

const WarningLabel = styled.code`
  background: #ffa8a8;
  border-radius: var(--border-radius);
  font-weight: bolder;
  margin: 0 auto 0.9375rem;
  padding: 6;
  text-align: center;
  width: 75%;
`

const SubmitButton = styled.button`
  background-color: #218dff;
  border-radius: 3rem;
  font-family: var(--font-default);
  font-size: 1.6rem;
  color: #ffffff;
  letter-spacing: 0.1rem;
  text-align: center;
  text-transform: uppercase;
  padding: 1rem 2rem;
  box-sizing: border-box;
  line-height: 1;
  width: 100%;
  font-weight: var(--font-weight-medium);
  height: 4.6rem;
  margin: 1rem auto 0;
  max-width: 32rem;

  // &:disabled {
  //   cursor: not-allowed;
  //   opacity: 0.5;
  // }
`

export const PriceWrapper = styled.div`
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
    padding: 0 1rem;
    box-sizing: border-box;
  }
`

export const PriceInputBox = styled.div`
  display: flex;
  flex-flow: column nowrap;
  margin: auto;
  width: 50%;
  width: calc(50% - 0.8rem);
  height: 7rem;
  position: relative;
  outline: 0;

  strong {
    margin: 0.2rem 0;
  }

  label {
    display: flex;
    width: auto;
    height: 100%;
    max-width: 100%;
    position: relative;
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
    font-weight: var(--font-weight-medium);

    @media ${MEDIA.mobile} {
      font-size: 1rem;
      letter-spacing: 0.03rem;
    }
  }

  input {
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
    padding: 0 7rem 0 1rem;

    @media ${MEDIA.mobile} {
      font-size: 1.3rem;
    }

    &:focus {
      border-bottom: 0.2rem solid #218dff;
      border-color: #218dff;
      color: #218dff;
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

const OrdersPanel = styled.div`
  display: flex;
  flex-flow: column wrap;
  flex: 1 1 auto;
  max-width: 100%;
  background: #edf2f7;
  border-radius: 0 0.6rem 0.6rem 0;
  box-sizing: border-box;
  transition: flex 0.2s ease-in-out;
  align-items: flex-start;
  align-content: flex-start;

  .expanded & {
    flex: 1 1 100%;
    min-width: 85rem;
  }

  > div {
    width: 100%;
    width: calc(100% - 1.6rem);
    box-sizing: border-box;
    display: flex;
    flex-flow: row wrap;
    border-radius: 0 0.6rem 0.6rem 0;
    overflow-y: auto;

    @media ${MEDIA.mobile} {
      display: none;
      &.visible {
        display: flex;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        overflow-y: scroll;
      }
    }
  }

  > div > h5 {
    width: 100%;
    margin: 0 auto;
    padding: 1.6rem 0 1rem;
    font-weight: var(--font-weight-medium);
    font-size: 1.6rem;
    color: #2f3e4e;
    letter-spacing: 0.03rem;
    text-align: center;
    box-sizing: border-box;
    text-align: center;
  }

  > div > h5 > a {
    font-size: 1.3rem;
    font-weight: var(--font-weight-normal);
    color: #218dff;
    text-decoration: underline;
  }

  > div > h5 > a {
    font-size: 1.3rem;
    font-weight: var(--font-weight-normal);
    color: #218dff;
    text-decoration: underline;
  }

  > button {
    width: 1.6rem;
    height: 100%;
    border-right: 0.1rem solid rgba(159, 180, 201, 0.5);
    background: #ecf2f7;
    padding: 0;
    margin: 0;
    outline: 0;

    @media ${MEDIA.mobile} {
      display: none;
    }

    &::before {
      display: block;
      content: ' ';
      background: url(${arrow}) no-repeat center/contain;
      transform: rotate(180deg);
      height: 1.2rem;
      width: 1.6rem;
      margin: 0;
    }

    &:hover {
      background-color: #ecf2f7;
    }
  }

  .expanded & {
    > button::before {
      transform: rotate(-180deg);
    }
  }
`

export const enum TradeFormTokenId {
  sellToken = 'sellToken',
  receiveToken = 'receiveToken',
  validFrom = 'validFrom',
  validUntil = 'validUntil',
}

export type TradeFormData = {
  [K in keyof typeof TradeFormTokenId]: string
}

export const DEFAULT_FORM_STATE = {
  sellToken: '0',
  receiveToken: '0',
  // ASAP
  validFrom: '0',
  // 2 days
  validUntil: '2880',
}

const TradeWidget: React.FC = () => {
  const { networkId, isConnected, userAddress } = useWalletConnection()
  const [, dispatch] = useGlobalState()

  // Avoid displaying an empty list of tokens when the wallet is not connected
  const fallBackNetworkId = networkId ? networkId : Network.Mainnet // fallback to mainnet

  const tokens = useMemo(() => tokenListApi.getTokens(fallBackNetworkId), [fallBackNetworkId])

  // Listen on manual changes to URL search query
  const { sell: sellTokenSymbol, buy: receiveTokenSymbol } = useParams()
  const { sellAmount, buyAmount: receiveAmount, validFrom, validUntil } = useQuery()

  const [ordersVisible, setOrdersVisible] = useState(true)
  const [sellToken, setSellToken] = useState(
    () => getToken('symbol', sellTokenSymbol, tokens) || (getToken('symbol', 'DAI', tokens) as Required<TokenDetails>),
  )
  const [receiveToken, setReceiveToken] = useState(
    () =>
      getToken('symbol', receiveTokenSymbol, tokens) || (getToken('symbol', 'USDC', tokens) as Required<TokenDetails>),
  )
  const [unlimited, setUnlimited] = useState(!validUntil || !Number(validUntil))
  const [asap, setAsap] = useState(!validFrom || !Number(validFrom))
  const sellInputId = TradeFormTokenId.sellToken
  const receiveInputId = TradeFormTokenId.receiveToken
  const validFromId = TradeFormTokenId.validFrom
  const validUntilId = TradeFormTokenId.validUntil

  const methods = useForm<TradeFormData>({
    mode: 'onChange',
    defaultValues: {
      [sellInputId]: sellAmount,
      [receiveInputId]: receiveAmount,
      [validFromId]: validFrom,
      [validUntilId]: validUntil,
    },
  })
  const { handleSubmit, reset, watch } = methods

  const searchQuery = buildSearchQuery({
    sell: watch(sellInputId),
    buy: watch(receiveInputId),
    from: watch(validFromId),
    expires: watch(validUntilId),
  })
  const url = `/trade/${sellToken.symbol}-${receiveToken.symbol}?${searchQuery}`
  useURLParams(url, true)

  // TESTING
  const NULL_BALANCE_TOKEN = {
    exchangeBalance: ZERO,
    totalExchangeBalance: ZERO,
    pendingDeposit: { amount: ZERO, batchId: 0 },
    pendingWithdraw: { amount: ZERO, batchId: 0 },
    walletBalance: ZERO,
    claimable: false,
    enabled: false,
    highlighted: false,
    enabling: false,
    claiming: false,
  }

  const { balances } = useTokenBalances()

  const sellTokenBalance = useMemo(
    () => getToken('symbol', sellToken.symbol, balances) || { ...sellToken, ...NULL_BALANCE_TOKEN },
    [NULL_BALANCE_TOKEN, balances, sellToken],
  )

  const receiveTokenBalance = useMemo(
    () => getToken('symbol', receiveToken.symbol, balances) || { ...receiveToken, ...NULL_BALANCE_TOKEN },
    [NULL_BALANCE_TOKEN, balances, receiveToken],
  )

  const { placeOrder, placeMultipleOrders, isSubmitting, setIsSubmitting } = usePlaceOrder()
  const history = useHistory()

  const swapTokens = useCallback((): void => {
    setSellToken(receiveToken)
    setReceiveToken(sellToken)
  }, [receiveToken, sellToken])

  const onSelectChangeFactory = useCallback(
    (
      setToken: React.Dispatch<React.SetStateAction<TokenDetails>>,
      oppositeToken: TokenDetails,
    ): ((selected: TokenDetails) => void) => {
      return (selected: TokenDetails): void => {
        if (selected.symbol === oppositeToken.symbol) {
          swapTokens()
        } else {
          setToken(selected)
        }
      }
    },
    [swapTokens],
  )

  const sameToken = sellToken === receiveToken

  async function onSubmit(data: FieldValues): Promise<void> {
    const buyAmount = parseAmount(data[receiveInputId], receiveToken.decimals)
    const sellAmount = parseAmount(data[sellInputId], sellToken.decimals)
    // Minutes - then divided by 5min for batch length to get validity time
    // 0 validUntil time  = unlimited order
    // TODO: review this line
    const validFrom = +data[validFromId] / 5
    const validUntil = +data[validUntilId] / 5
    const cachedBuyToken = getToken('symbol', receiveToken.symbol, tokens)
    const cachedSellToken = getToken('symbol', sellToken.symbol, tokens)

    // Do not let potential null values through
    if (!buyAmount || !sellAmount || !cachedBuyToken || !cachedSellToken || !networkId) return

    if (isConnected && userAddress) {
      let pendingTxHash: string | undefined = undefined
      // block form
      setIsSubmitting(true)

      let success: boolean
      if (validFrom === 0) {
        // ; for destructure reassign format
        ;({ success } = await placeOrder({
          buyAmount,
          buyToken: cachedBuyToken,
          sellAmount,
          sellToken: cachedSellToken,
          validUntil,
          txOptionalParams: {
            onSentTransaction: (txHash: string): void => {
              // reset form on successful order placing
              reset(DEFAULT_FORM_STATE)
              setUnlimited(false)
              // unblock form
              setIsSubmitting(false)

              pendingTxHash = txHash
              toast.info(<TxNotification txHash={txHash} />)

              const newTxState = {
                txHash,
                id: 'PENDING ORDER',
                buyTokenId: cachedBuyToken.id,
                sellTokenId: cachedSellToken.id,
                priceNumerator: buyAmount,
                priceDenominator: sellAmount,
                user: userAddress,
                remainingAmount: ZERO,
                sellTokenBalance: ZERO,
                validFrom: 0,
                validUntil: 0,
              }

              return dispatch(savePendingOrdersAction({ orders: newTxState, networkId, userAddress }))
            },
          },
        }))
      } else {
        // ; for destructure reassign format
        ;({ success } = await placeMultipleOrders({
          orders: [
            {
              buyAmount,
              buyToken: cachedBuyToken.id,
              sellAmount,
              sellToken: cachedSellToken.id,
              validFrom,
              validUntil,
            },
          ],
          txOptionalParams: {
            onSentTransaction: (txHash: string): void => {
              // reset form on successful order placing
              reset(DEFAULT_FORM_STATE)
              setUnlimited(false)
              // unblock form
              setIsSubmitting(false)

              pendingTxHash = txHash
              toast.info(<TxNotification txHash={txHash} />)

              const newTxState = {
                txHash,
                id: 'PENDING ORDER',
                buyTokenId: cachedBuyToken.id,
                sellTokenId: cachedSellToken.id,
                priceNumerator: buyAmount,
                priceDenominator: sellAmount,
                user: userAddress,
                remainingAmount: ZERO,
                sellTokenBalance: ZERO,
                validFrom: 0,
                validUntil: 0,
              }

              return dispatch(savePendingOrdersAction({ orders: newTxState, networkId, userAddress }))
            },
          },
        }))
      }
      if (success && pendingTxHash) {
        // remove pending tx
        dispatch(removePendingOrdersAction({ networkId, pendingTxHash, userAddress }))
      }
    } else {
      const from = history.location.pathname + history.location.search
      history.push('/connect-wallet', { from })
    }
  }

  return (
    <WrappedWidget className={ordersVisible ? '' : 'expanded'}>
      {/* // Toggle Class 'expanded' on WrappedWidget on click of the <OrdersPanel> <button> */}
      <FormContext {...methods}>
        <WrappedForm onSubmit={handleSubmit(onSubmit)}>
          {sameToken && <WarningLabel>Tokens cannot be the same!</WarningLabel>}
          <TokenRow
            selectedToken={sellToken}
            tokens={tokens}
            balance={sellTokenBalance}
            selectLabel="Sell"
            onSelectChange={onSelectChangeFactory(setSellToken, receiveToken)}
            inputId={sellInputId}
            isDisabled={isSubmitting}
            validateMaxAmount
            tabIndex={1}
          />
          <IconWrapper onClick={swapTokens}>
            <img src={switchTokenPair} />
          </IconWrapper>
          <TokenRow
            selectedToken={receiveToken}
            tokens={tokens}
            balance={receiveTokenBalance}
            selectLabel="Receive at least"
            onSelectChange={onSelectChangeFactory(setReceiveToken, sellToken)}
            inputId={receiveInputId}
            isDisabled={isSubmitting}
            tabIndex={2}
          />
          {/* Refactor these price input fields */}
          <PriceWrapper>
            <strong>Min. sell price</strong>
            <PriceInputBox>
              <label>
                <input placeholder="0" value="146.666" type="text" required />
                <small>WETH/DAI</small>
              </label>
            </PriceInputBox>
            <PriceInputBox>
              <label>
                <input placeholder="0" value="0.00682" type="text" required />
                <small>DAI/WETH</small>
              </label>
            </PriceInputBox>
          </PriceWrapper>
          {/* Refactor these price input fields */}
          <OrderValidity
            validFromInputId={validFromId}
            validUntilInputId={validUntilId}
            isDisabled={isSubmitting}
            isAsap={asap}
            isUnlimited={unlimited}
            setAsap={setAsap}
            setUnlimited={setUnlimited}
            tabIndex={3}
          />
          {/* <OrderDetails
            sellAmount={watch(sellInputId)}
            sellTokenName={safeTokenName(sellToken)}
            receiveAmount={watch(receiveInputId)}
            receiveTokenName={safeTokenName(receiveToken)}
            validUntil={watch(validUntilId)}
          />{' '} */}
          <p>This order might be partially filled.</p>
          <SubmitButton
            data-text="This order might be partially filled."
            type="submit"
            disabled={!methods.formState.isValid || isSubmitting}
            tabIndex={5}
          >
            {isSubmitting && <FontAwesomeIcon icon={faSpinner} size="lg" spin={isSubmitting} />}{' '}
            {sameToken ? 'Please select different tokens' : 'Submit limit order'}
          </SubmitButton>
        </WrappedForm>
      </FormContext>
      <OrdersPanel>
        {/* Toggle panel visibility (arrow) */}
        <button onClick={(): void => setOrdersVisible(!ordersVisible)} />
        {/* Actual orders content */}
        <div>
          <h5>Your orders</h5>
          <OrdersWidget />
        </div>
      </OrdersPanel>
    </WrappedWidget>
  )
}

export default TradeWidget
