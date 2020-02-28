import React, { useMemo, useCallback, useEffect } from 'react'
// eslint-disable-next-line @typescript-eslint/camelcase
import { unstable_batchedUpdates } from 'react-dom'
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { isOrderUnlimited } from '@gnosis.pm/dex-js'

import { useOrders } from 'hooks/useOrders'
import useSafeState from 'hooks/useSafeState'
import { useDeleteOrders } from './useDeleteOrders'
import usePendingOrders from 'hooks/usePendingOrders'
import { useWalletConnection } from 'hooks/useWalletConnection'

import { AuctionElement, PendingTxObj } from 'api/exchange/ExchangeApi'

import { isOrderActive } from 'utils'

import { CardTable } from 'components/Layout/Card'
import OrderRow from './OrderRow'
import { OrdersWrapper, ButtonWithIcon, OrdersForm } from './OrdersWidget.styled'
import { ConnectWalletBanner } from 'components/ConnectWalletBanner'

type OrderTabs = 'active' | 'liquidity' | 'expired'

interface ShowOrdersButtonProps {
  type: OrderTabs
  isActive: boolean
  count: number
  onClick: (event: React.SyntheticEvent<HTMLButtonElement | HTMLFormElement>) => void
}

const ShowOrdersButton: React.FC<ShowOrdersButtonProps> = ({ type, isActive, count, onClick }) => (
  <button type="button" className={isActive ? 'selected' : ''} onClick={onClick}>
    {type} <i>{count}</i>
    {/* {!isActive ? <Highlight>{count}</Highlight> : <>{count}</>} {type} */}
  </button>
)

type FilteredOrdersState = {
  [key in OrderTabs]: { orders: AuctionElement[]; markedForDeletion: Set<string> }
}

function emptyState(): FilteredOrdersState {
  return {
    active: { orders: [], markedForDeletion: new Set() },
    expired: { orders: [], markedForDeletion: new Set() },
    liquidity: { orders: [], markedForDeletion: new Set() },
  }
}

const OrdersWidget: React.FC = () => {
  const { orders: allOrders, forceOrdersRefresh } = useOrders()
  const pendingOrders = usePendingOrders()
  // this page is behind login wall so networkId should always be set
  const { networkId, isConnected } = useWalletConnection()

  // allOrders and markedForDeletion, split by tab
  const [filteredOrders, setFilteredOrders] = useSafeState<FilteredOrdersState>(emptyState())
  const [selectedTab, setSelectedTab] = useSafeState<OrderTabs>('active')

  // syntactic sugar
  const { displayedOrders, markedForDeletion } = useMemo(
    () => ({
      displayedOrders: filteredOrders[selectedTab].orders,
      markedForDeletion: filteredOrders[selectedTab].markedForDeletion,
    }),
    [filteredOrders, selectedTab],
  )

  const setSelectedTabFactory = useCallback(
    (type: OrderTabs): ((event: React.SyntheticEvent<HTMLButtonElement | HTMLFormElement>) => void) => (
      event: React.SyntheticEvent<HTMLButtonElement | HTMLFormElement>,
    ): void => {
      // form is being submitted when clicking on tab buttons, thus preventing default
      event.preventDefault()

      setSelectedTab(type)
    },
    [setSelectedTab],
  )

  // Update filteredOrders state whenever there's a change to allOrders
  // splitting orders into respective tabs
  useEffect(() => {
    const now = new Date()

    const filteredOrders = emptyState()

    allOrders.forEach(order => {
      if (!isOrderActive(order, now)) {
        filteredOrders.expired.orders.push(order)
      } else if (isOrderUnlimited(order.priceDenominator, order.priceNumerator)) {
        filteredOrders.liquidity.orders.push(order)
      } else {
        filteredOrders.active.orders.push(order)
      }
    })

    setFilteredOrders(curr => {
      // copy markedForDeletion
      Object.keys(filteredOrders).forEach(
        type => (filteredOrders[type].markedForDeletion = curr[type].markedForDeletion),
      )
      return filteredOrders
    })
  }, [allOrders, setFilteredOrders])

  const pendingShownOrdersCount = pendingOrders.length

  const noOrders = allOrders.length === 0

  const overBalanceOrders = useMemo(
    () =>
      new Set<string>(
        displayedOrders.filter(order => order.remainingAmount.gt(order.sellTokenBalance)).map(order => order.id),
      ),
    [displayedOrders],
  )

  const toggleMarkForDeletionFactory = useCallback(
    (orderId: string, selectedTab: OrderTabs): (() => void) => (): void =>
      setFilteredOrders(curr => {
        const state = emptyState()

        // copy full state
        Object.keys(curr).forEach(tab => (state[tab] = curr[tab]))

        // copy markedForDeletion set
        const newSet = new Set(curr[selectedTab].markedForDeletion)
        // toggle order
        newSet.has(orderId) ? newSet.delete(orderId) : newSet.add(orderId)
        // store new set
        state[selectedTab].markedForDeletion = newSet

        return state
      }),
    [setFilteredOrders],
  )

  const toggleSelectAll = useCallback(
    ({ currentTarget: { checked } }: React.SyntheticEvent<HTMLInputElement>) =>
      setFilteredOrders(curr => {
        const state = emptyState()

        // copy full state
        Object.keys(curr).forEach(tab => (state[tab] = curr[tab]))

        state[selectedTab].markedForDeletion = checked
          ? new Set(filteredOrders[selectedTab].orders.map(order => order.id))
          : new Set()

        return state
      }),
    [filteredOrders, selectedTab, setFilteredOrders],
  )

  const { deleteOrders, deleting } = useDeleteOrders()

  const onSubmit = useCallback(
    async (event: React.SyntheticEvent<HTMLFormElement>): Promise<void> => {
      event.preventDefault()

      const success = await deleteOrders(Array.from(markedForDeletion))

      if (success) {
        unstable_batchedUpdates(() => {
          // reset selections

          setFilteredOrders(curr => {
            const state = emptyState()

            // copy full state
            Object.keys(curr).forEach(tab => (state[tab] = curr[tab]))

            // remove checked orders
            state[selectedTab].orders = curr[selectedTab].orders.filter(
              order => !curr[selectedTab].markedForDeletion.has(order.id),
            )
            // clear orders to delete
            state[selectedTab].markedForDeletion = new Set<string>()
            return state
          })

          // update the list of orders
          forceOrdersRefresh()
        })
      }
    },
    [deleteOrders, forceOrdersRefresh, markedForDeletion, selectedTab, setFilteredOrders],
  )

  return (
    <OrdersWrapper>
      {!isConnected ? (
        <ConnectWalletBanner />
      ) : (
        noOrders && (
          <p className="noOrdersInfo">
            It appears you haven&apos;t placed any order yet. <br /> Create one!
          </p>
        )
      )}
      {!noOrders && networkId && (
        <OrdersForm>
          <form action="submit" onSubmit={onSubmit}>
            <div className="infoContainer">
              <div className="countContainer">
                <ShowOrdersButton
                  type="active"
                  isActive={selectedTab === 'active'}
                  count={filteredOrders.active.orders.length}
                  onClick={setSelectedTabFactory('active')}
                />
                <ShowOrdersButton
                  type="liquidity"
                  isActive={selectedTab === 'liquidity'}
                  count={filteredOrders.liquidity.orders.length}
                  onClick={setSelectedTabFactory('liquidity')}
                />
                <ShowOrdersButton
                  type="expired"
                  isActive={selectedTab === 'expired'}
                  count={filteredOrders.expired.orders.length}
                  onClick={setSelectedTabFactory('expired')}
                />
              </div>
              {/* {overBalanceOrders.size > 0 && showActive && (
                <div className="warning">
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                  <strong> Low balance</strong>
                </div>
              )} */}
            </div>
            <div className="deleteContainer" data-disabled={markedForDeletion.size === 0 || deleting}>
              <b>↴</b>
              <ButtonWithIcon disabled={markedForDeletion.size === 0 || deleting}>
                <FontAwesomeIcon icon={faTrashAlt} />{' '}
                {['active', 'liquidity'].includes(selectedTab) ? 'Cancel' : 'Delete'} {markedForDeletion.size} orders
              </ButtonWithIcon>
            </div>
            {/* PENDING ORDERS */}
            {pendingShownOrdersCount ? (
              <div>
                <h3>Pending Orders</h3>
                <div className="ordersContainer">
                  <CardTable
                    $columns="minmax(13.625rem, 1.3fr) repeat(2, minmax(6.2rem, 0.6fr)) minmax(5.5rem, 0.6fr)"
                    $cellSeparation="0.2rem"
                    $rowSeparation="0.6rem"
                  >
                    <thead>
                      <tr>
                        <th>Order details</th>
                        <th>Unfilled amount</th>
                        <th>Account balance</th>
                        <th>Expires</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingOrders.map((order: PendingTxObj) => (
                        <OrderRow
                          key={Math.random()}
                          order={order}
                          networkId={networkId}
                          isOverBalance={false}
                          pending
                          disabled={deleting}
                          isPendingOrder
                        />
                      ))}
                    </tbody>
                  </CardTable>
                </div>
              </div>
            ) : null}

            {displayedOrders.length > 0 ? (
              <>
                {pendingShownOrdersCount ? <h3>Current Orders</h3> : null}
                <div className="ordersContainer">
                  <CardTable
                    // $columns="minmax(2rem, min-content) minmax(13.625rem, 1fr) repeat(2, minmax(6.2rem, 0.6fr)) minmax(5.5rem, 1fr)"
                    $columns="minmax(2rem,.4fr)  minmax(11rem,1fr)  minmax(11rem,1.3fr)  minmax(5rem,.9fr)  minmax(auto,1.4fr)"
                    // $cellSeparation="0 .5rem;"
                    $rowSeparation="0"
                  >
                    <thead>
                      <tr>
                        <th className="checked">
                          <input
                            type="checkbox"
                            onChange={toggleSelectAll}
                            checked={markedForDeletion.size === displayedOrders.length}
                            disabled={deleting}
                          />
                        </th>
                        <th>Limit price</th>
                        <th className="filled">Filled / Total</th>
                        <th>Expires</th>
                        <th className="status">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedOrders.map(order => (
                        <OrderRow
                          key={order.id}
                          order={order}
                          networkId={networkId}
                          isOverBalance={overBalanceOrders.has(order.id)}
                          isMarkedForDeletion={markedForDeletion.has(order.id)}
                          toggleMarkedForDeletion={toggleMarkForDeletionFactory(order.id, selectedTab)}
                          pending={deleting && markedForDeletion.has(order.id)}
                          disabled={deleting}
                        />
                      ))}
                    </tbody>
                  </CardTable>
                </div>
              </>
            ) : (
              <div className="noOrders">
                <span>You have no {selectedTab} orders</span>
              </div>
            )}
          </form>
        </OrdersForm>
      )}
    </OrdersWrapper>
  )
}

export default OrdersWidget
