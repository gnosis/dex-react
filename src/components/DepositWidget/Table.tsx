import React from 'react'
import styled from 'styled-components'
import { Row, RowProps } from './Row'

const TableWrapper = styled.table`
  display: table;
  flex-direction: colum;
`
const rowData: RowProps[] = [
  {
    tokenLogo: 'img.png', tokenName: 'TTT', exchangeWallet: 0, pendingDeposits: 0, pendingWithdraws: 0
  }
]

const Table: React.FC = () => (
  <TableWrapper>
    <thead>
      <tr>
        <th></th>
        <th>Token</th>
        <th>Exchange wallet</th>
        <th>Pending deposits</th>
        <th>Pending withdraws</th>
        <th></th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {rowData.map(data =>
        <Row key={data.tokenName} {...data} />
      )}
    </tbody>
  </TableWrapper>
)

export default Table
