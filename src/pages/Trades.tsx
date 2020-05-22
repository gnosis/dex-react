import React from 'react'
import { ContentPage } from 'components/Layout/PageWrapper'
import { CardTable } from 'components/Layout/Card'
import { useWalletConnection } from 'hooks/useWalletConnection'
import { useTrades } from 'hooks/useTrades'
import { formatPrice, formatAmount } from '@gnosis.pm/dex-js'
import { EtherscanLink } from 'components/EtherscanLink'

const Trades: React.FC = () => {
  const { networkId } = useWalletConnection()
  const trades = useTrades()

  return (
    <ContentPage>
      <CardTable $columns="repeat(6, 1fr)" $rowSeparation="0">
        <thead>
          <tr>
            <th>Limit Price</th>
            <th>Fill Price</th>
            <th>Amount</th>
            {/* <th>Type</th> */}
            <th>Time</th>
            <th>BatchId | OrderId</th>
            <th>Tx</th>
            {/* <th>Settled</th> */}
          </tr>
        </thead>
        <tbody>
          {trades.map((trade, index) => (
            <tr key={index} data-order-id={trade.orderId} data-trade-id={trade.id}>
              {/* TODO: entries marked with NA are not yet available from the event.
                        Need to enrich event data first */}
              <td>
                {formatPrice(trade.limitPrice)} {trade.sellToken.symbol}/{trade.buyToken.symbol}
              </td>
              <td>
                {formatPrice(trade.fillPrice)} {trade.sellToken.symbol}/{trade.buyToken.symbol}
              </td>
              <td>
                {formatAmount({ amount: trade.sellAmount, precision: trade.sellToken.decimals as number })}{' '}
                {trade.sellToken.symbol}
              </td>
              {/* <td>NA</td> */}
              <td>{new Date(trade.timestamp).toISOString()}</td>
              <td>
                {trade.batchId} | {trade.orderId}
              </td>
              <td>
                <EtherscanLink type={'tx'} identifier={trade.txHash} networkId={networkId} />
              </td>
              {/* <td>NA</td> */}
            </tr>
          ))}
        </tbody>
      </CardTable>
    </ContentPage>
  )
}

export default Trades
