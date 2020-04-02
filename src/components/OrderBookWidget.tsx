import React, { useEffect, useRef } from 'react'
import styled from 'styled-components'
import { TokenDetails } from 'types'
import * as am4core from '@amcharts/amcharts4/core'
import * as am4charts from '@amcharts/amcharts4/charts'
import am4themesSpiritedaway from '@amcharts/amcharts4/themes/spiritedaway'

interface OrderBookProps {
  baseToken: TokenDetails
  quoteToken: TokenDetails
  networkId: number
}

const Wrapper = styled.div`
  display: flex;
  justify-content: center;

  min-height: 40rem;
  color: white;
  text-align: center;
  font-size: 1.6rem;
  width: 100%;
`

enum Offer {
  Bid,
  Ask,
}

interface RawItem {
  price: number
  volume: number
}

interface ProcessedItem {
  volume: number
  totalVolume: number
  askValueY: number | null
  bidValueY: number | null
  price: number
}

const orderbookUrl = (baseToken: TokenDetails, quoteToken: TokenDetails, networkId?: number): string => {
  let network = 'mainnet'
  if (networkId === 4) {
    network = 'rinkeby'
  }
  return `https://price-estimate-${network}.dev.gnosisdev.com/orderbook?base=${baseToken.id}&quote=${quoteToken.id}`
}

/**
 * This method turns the raw data that the backend returns into data that can be displayed by the chart.
 * This involves aggregating the total volume and accounting for decimals
 */
const processData = (
  list: RawItem[],
  baseToken: TokenDetails,
  quoteToken: TokenDetails,
  type: Offer,
): ProcessedItem[] => {
  let totalVolume = 0
  return (
    list
      // Account fo decimals
      .map(element => {
        return {
          price: element.price / 10 ** (quoteToken.decimals - baseToken.decimals),
          volume: element.volume / 10 ** baseToken.decimals,
        }
      })
      // Filter tiny orders
      .filter(e => e.volume > 0.01)
      // Accumulate totalVolume
      .map(e => {
        const previousTotalVolume = totalVolume
        totalVolume += e.volume
        return {
          price: e.price,
          volume: e.volume,
          totalVolume,
          // Amcharts draws step lines so that the x value is centered (Default). To correctly display the orderbook, we want
          // the x value to be at the left side of the step for asks and at the right side of the step for bids.
          //
          //    Default            Bids          Asks
          //            |      |                        |
          //   ---------       ---------       ---------
          //  |                         |      |
          //       x                    x      x
          //
          // For asks, we can offset the "startLocation" by 0.5. However, Amcharts does not support a "startLocation" of -0.5.
          // For bids, we therefore offset the curve by -1 (expose the previous total volume) and use an offset of 0.5.
          // Otherwise our steps would be off by one.
          askValueY: type == Offer.Bid ? previousTotalVolume : null,
          bidValueY: type == Offer.Ask ? totalVolume : null,
        }
      })
  )
}

const draw = (
  chartElement: HTMLElement,
  baseToken: TokenDetails,
  quoteToken: TokenDetails,
  dataSource: string,
): am4charts.XYChart => {
  am4core.useTheme(am4themesSpiritedaway)
  const chart = am4core.create(chartElement, am4charts.XYChart)

  // Add data
  chart.dataSource.url = dataSource
  chart.dataSource.adapter.add('parsedData', function(data) {
    data = JSON.parse(data)
    const processed = processData(data.bids, baseToken, quoteToken, Offer.Bid).concat(
      processData(data.asks, baseToken, quoteToken, Offer.Ask),
    )
    processed.sort((lhs, rhs) => lhs.price - rhs.price)
    return processed
  })

  // Set up precision for numbers
  chart.numberFormatter.numberFormat = '#,###.##'

  // Create axes
  const xAxis = chart.xAxes.push(new am4charts.CategoryAxis())
  xAxis.dataFields.category = 'price'
  xAxis.title.text = `Price (${baseToken.symbol}/${quoteToken.symbol})`

  const yAxis = chart.yAxes.push(new am4charts.ValueAxis())
  yAxis.title.text = 'Volume'

  // Create series
  const bidCurve = chart.series.push(new am4charts.StepLineSeries())
  bidCurve.dataFields.categoryX = 'price'
  bidCurve.dataFields.valueY = 'askValueY'
  bidCurve.strokeWidth = 2
  bidCurve.stroke = am4core.color('#0f0')
  bidCurve.fill = bidCurve.stroke
  bidCurve.startLocation = 0.5
  bidCurve.fillOpacity = 0.1
  bidCurve.tooltipText = 'Bid: [bold]{categoryX}[/]\nTotal volume: [bold]{totalVolume}[/]\nVolume: [bold]{volume}[/]'

  const askCurve = chart.series.push(new am4charts.StepLineSeries())
  askCurve.dataFields.categoryX = 'price'
  askCurve.dataFields.valueY = 'bidValueY'
  askCurve.strokeWidth = 2
  askCurve.stroke = am4core.color('#f00')
  askCurve.fill = askCurve.stroke
  askCurve.fillOpacity = 0.1
  askCurve.startLocation = 0.5
  askCurve.tooltipText = 'Ask: [bold]{categoryX}[/]\nTotal volume: [bold]{totalVolume}[/]\nVolume: [bold]{volume}[/]'

  const series3 = chart.series.push(new am4charts.ColumnSeries())
  series3.dataFields.categoryX = 'price'
  series3.dataFields.valueY = 'volume'
  series3.strokeWidth = 0
  series3.fill = am4core.color('#000')
  series3.fillOpacity = 0.2

  // Add cursor
  chart.cursor = new am4charts.XYCursor()
  return chart
}

const OrderBookWidget: React.FC<OrderBookProps> = props => {
  const { baseToken, quoteToken, networkId } = props
  const mountPoint = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mountPoint.current) return

    const chart = draw(mountPoint.current, baseToken, quoteToken, orderbookUrl(baseToken, quoteToken, networkId))

    return (): void => chart.dispose()
  }, [baseToken, quoteToken, networkId])

  return (
    <Wrapper ref={mountPoint}>
      Show order book for token {baseToken.symbol} ({baseToken.id}) and {quoteToken.symbol} ({quoteToken.id})
    </Wrapper>
  )
}

export default OrderBookWidget
