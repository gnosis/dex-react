import React, { useMemo, useEffect } from 'react'
import BigNumber from 'bignumber.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import lowBalanceIcon from 'assets/img/lowBalance.svg'

import { faSpinner, faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { toast } from 'toastify'

import { isOrderUnlimited, isNeverExpiresOrder } from '@gnosis.pm/dex-js'

// import Highlight from 'components/Highlight'
import { EtherscanLink } from 'components/EtherscanLink'

import { getTokenFromExchangeById } from 'services'
import useSafeState from 'hooks/useSafeState'
import { TokenDetails } from 'types'

import {
  safeTokenName,
  formatAmount,
  formatAmountFull,
  formatDateFromBatchId,
  formatPrice,
  batchIdToDate,
  isOrderFilled,
} from 'utils'
import { onErrorFactory } from 'utils/onError'
import { AuctionElement } from 'api/exchange/ExchangeApi'

import { OrderRowWrapper } from './OrderRow.styled'

const PendingLink: React.FC<Pick<Props, 'transactionHash'>> = props => {
  const { transactionHash } = props
  return (
    <>
      <FontAwesomeIcon icon={faSpinner} size="sm" spin /> Pending...
      <br />
      {transactionHash && <EtherscanLink identifier={transactionHash} type="tx" label={<small>View status</small>} />}
    </>
  )
}

const DeleteOrder: React.FC<Pick<
  Props,
  'isMarkedForDeletion' | 'toggleMarkedForDeletion' | 'pending' | 'disabled'
>> = ({ isMarkedForDeletion, toggleMarkedForDeletion, pending, disabled }) => (
  <td data-label="Actions" className="checked">
    <input
      type="checkbox"
      onChange={toggleMarkedForDeletion}
      checked={isMarkedForDeletion && !pending}
      disabled={disabled}
    />
  </td>
)

function displayTokenSymbolOrLink(token: TokenDetails): React.ReactNode | string {
  const displayName = safeTokenName(token)
  if (displayName.startsWith('0x')) {
    return <EtherscanLink type="token" identifier={token.address} />
  }
  return displayName
}

function calculatePrice(numeratorString?: string | null, denominatorString?: string | null): string {
  let price
  if (numeratorString && denominatorString) {
    const numerator = new BigNumber(numeratorString)
    const denominator = new BigNumber(denominatorString)

    price = formatPrice(numerator, denominator)
  }

  return price || 'N/A'
}

interface OrderDetailsProps extends Pick<Props, 'order' | 'pending'> {
  buyToken: TokenDetails
  sellToken: TokenDetails
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ buyToken, sellToken, order }) => {
  const [price, priceInverse] = useMemo((): string[] => {
    const numeratorString = formatAmountFull(order.priceNumerator, buyToken.decimals, false)
    const denominatorString = formatAmountFull(order.priceDenominator, sellToken.decimals, false)
    const priceFmt = calculatePrice(numeratorString, denominatorString)
    const priceInverseFmt = calculatePrice(denominatorString, numeratorString)

    return [priceFmt, priceInverseFmt]
  }, [buyToken, order.priceDenominator, order.priceNumerator, sellToken])

  return (
    <td data-label="Price">
      <div className="order-details">
        {/* <Highlight color={pending ? 'grey' : ''} /> */}
        {price} {displayTokenSymbolOrLink(sellToken)}
        {'/'}
        {displayTokenSymbolOrLink(buyToken)}
        <br />
        {priceInverse} {displayTokenSymbolOrLink(buyToken)}
        {'/'}
        {displayTokenSymbolOrLink(sellToken)}
      </div>
    </td>
  )
}

interface AmountsProps extends Pick<Props, 'order' | 'pending'> {
  sellToken: TokenDetails
  isUnlimited: boolean
}

const Amounts: React.FC<AmountsProps> = ({ sellToken, order, isUnlimited }) => {
  const filledAmount = useMemo(() => {
    const filledAmount = order.priceDenominator.sub(order.remainingAmount)

    return formatAmount(filledAmount, sellToken.decimals) || '0'
  }, [order.priceDenominator, order.remainingAmount, sellToken.decimals])

  const totalAmount = useMemo(() => formatAmount(order.priceDenominator, sellToken.decimals) || '0', [
    order.priceDenominator,
    sellToken.decimals,
  ])

  return (
    <td data-label="Unfilled Amount">
      {isUnlimited ? (
        <span>no limit</span>
      ) : (
        <>
          <div className="amounts">
            {filledAmount} {displayTokenSymbolOrLink(sellToken)}
            <br />
            {totalAmount} {displayTokenSymbolOrLink(sellToken)}
          </div>
        </>
      )}
    </td>
  )
}

const Expires: React.FC<Pick<Props, 'order' | 'pending' | 'isPendingOrder'>> = ({ order, isPendingOrder }) => {
  const { isNeverExpires, expiresOn } = useMemo(() => {
    const isNeverExpires = isNeverExpiresOrder(order.validUntil) || (isPendingOrder && order.validUntil === 0)
    const expiresOn = isNeverExpires ? '' : formatDateFromBatchId(order.validUntil)

    return { isNeverExpires, expiresOn }
  }, [isPendingOrder, order.validUntil])

  return <td data-label="Expires">{isNeverExpires ? <span>Never</span> : <span>{expiresOn}</span>}</td>
}

const Status: React.FC<Pick<Props, 'order' | 'isOverBalance' | 'transactionHash' | 'isPendingOrder'>> = ({
  order,
  isOverBalance,
  isPendingOrder,
  transactionHash,
}) => {
  const now = new Date()

  const isExpiredOrder = batchIdToDate(order.validUntil) <= now
  const isScheduled = batchIdToDate(order.validFrom) > now
  const isUnlimited = useMemo(() => isOrderUnlimited(order.priceNumerator, order.priceDenominator), [
    order.priceDenominator,
    order.priceNumerator,
  ])
  const isActive = useMemo(() => order.remainingAmount.eq(order.priceDenominator), [
    order.priceDenominator,
    order.remainingAmount,
  ])
  const isFilled = useMemo(() => isOrderFilled(order), [order])
  // Display isLowBalance warning only for active and partial fill orders
  const isLowBalance = isOverBalance && !isUnlimited && !isFilled && !isScheduled && !isPendingOrder && !isExpiredOrder

  const pending = useMemo(() => isPendingOrder && <PendingLink transactionHash={transactionHash} />, [
    isPendingOrder,
    transactionHash,
  ])

  return (
    <td className="status">
      {pending ? (
        pending
      ) : isExpiredOrder ? (
        'Expired'
      ) : isScheduled ? (
        <>
          Scheduled
          <br />
          {formatDateFromBatchId(order.validFrom)}
        </>
      ) : isFilled ? (
        'Filled'
      ) : isActive ? (
        'Active'
      ) : (
        'Partial Fill'
      )}
      {isLowBalance && (
        <>
          <br />
          <span className="lowBalance">
            low balance
            <img src={lowBalanceIcon} />
          </span>
        </>
      )}
    </td>
  )
}

async function fetchToken(
  tokenId: number,
  orderId: string,
  networkId: number,
  setFn: React.Dispatch<React.SetStateAction<TokenDetails | null>>,
  isPendingOrder?: boolean,
): Promise<void> {
  const token = await getTokenFromExchangeById({ tokenId, networkId })

  // It is unlikely the token ID coming form the order won't exist
  // Still, if that ever happens, store null and keep this order hidden
  setFn(token)

  // Also, inform the user this token failed and the order is hidden.
  if (!token && !isPendingOrder) {
    toast.warn(
      `Token id ${tokenId} used on orderId ${orderId} is not a valid ERC20 token. Order will not be displayed.`,
    )
  }
}

interface ResponsiveRowSizeTogglerProps {
  handleOpen: () => void
  openStatus: boolean
}

const ResponsiveRowSizeToggler: React.FC<ResponsiveRowSizeTogglerProps> = ({ handleOpen, openStatus }) => {
  return (
    <td className="cardOpener" onClick={handleOpen}>
      <FontAwesomeIcon icon={openStatus ? faChevronUp : faChevronDown} />
    </td>
  )
}

interface Props {
  order: AuctionElement
  isOverBalance: boolean
  networkId: number
  pending?: boolean
  transactionHash?: string
  isMarkedForDeletion?: boolean
  toggleMarkedForDeletion?: () => void
  disabled: boolean
  isPendingOrder?: boolean
}

const onError = onErrorFactory('Failed to fetch token')

const OrderRow: React.FC<Props> = props => {
  const {
    order,
    networkId,
    pending = false,
    transactionHash,
    isMarkedForDeletion,
    toggleMarkedForDeletion,
    disabled,
    isPendingOrder,
    isOverBalance,
  } = props

  // Fetching buy and sell tokens
  const [sellToken, setSellToken] = useSafeState<TokenDetails | null>(null)
  const [buyToken, setBuyToken] = useSafeState<TokenDetails | null>(null)
  const [openCard, setOpenCard] = useSafeState(true)

  useEffect(() => {
    fetchToken(order.buyTokenId, order.id, networkId, setBuyToken, isPendingOrder).catch(onError)
    fetchToken(order.sellTokenId, order.id, networkId, setSellToken, isPendingOrder).catch(onError)
  }, [isPendingOrder, networkId, order, setBuyToken, setSellToken])

  const isUnlimited = isOrderUnlimited(order.priceDenominator, order.priceNumerator)

  return (
    sellToken &&
    buyToken && (
      <OrderRowWrapper className={pending ? 'pending' : ''} $open={openCard}>
        <DeleteOrder
          isMarkedForDeletion={isMarkedForDeletion}
          toggleMarkedForDeletion={toggleMarkedForDeletion}
          pending={pending}
          disabled={disabled || isPendingOrder || pending}
        />
        <OrderDetails order={order} sellToken={sellToken} buyToken={buyToken} />
        <Amounts order={order} sellToken={sellToken} isUnlimited={isUnlimited} />
        <Expires order={order} pending={pending} isPendingOrder={isPendingOrder} />
        <Status
          order={order}
          isOverBalance={isOverBalance}
          isPendingOrder={isPendingOrder}
          transactionHash={transactionHash}
        />
        <ResponsiveRowSizeToggler handleOpen={(): void => setOpenCard(!openCard)} openStatus={openCard} />
      </OrderRowWrapper>
    )
  )
}

export default OrderRow
