import React, { useEffect, useRef } from 'react'
import BigNumber from 'bignumber.js'
import styled from 'styled-components'

import * as am4core from '@amcharts/amcharts4/core'
import * as am4charts from '@amcharts/amcharts4/charts'
import am4themesSpiritedaway from '@amcharts/amcharts4/themes/spiritedaway'

import { RawApiData, RawPricePoint } from 'api/dexPriceEstimator/DexPriceEstimatorApi'

import { getNetworkFromId, safeTokenName, formatSmart, logDebug } from 'utils'

import { TEN_BIG_NUMBER, ZERO_BIG_NUMBER } from 'const'

import { TokenDetails, Network } from 'types'
import BN from 'bn.js'
import { DEFAULT_PRECISION } from '@gnosis.pm/dex-js'

const SMALL_VOLUME_THRESHOLD = 0.01

export interface OrderBookChartProps {
  baseToken: TokenDetails
  quoteToken: TokenDetails
  networkId: number
  data: RawApiData | null
}

const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  /* min-height: 40rem; */
  /* height: calc(100vh - 30rem); */
  min-height: calc(100vh - 30rem);
  text-align: center;
  width: 100%;
  height: 100%;
  min-width: 100%;

  .amcharts-Sprite-group {
    font-size: 1rem;
  }

  .amcharts-Container .amcharts-Label {
    text-transform: uppercase;
    font-size: 1.2rem;
  }

  .amcharts-ZoomOutButton-group > .amcharts-RoundedRectangle-group {
    fill: var(--color-text-active);
    opacity: 0.6;
    transition: 0.3s ease-in-out;

    &:hover {
      opacity: 1;
    }
  }

  .amcharts-AxisLabel,
  .amcharts-CategoryAxis .amcharts-Label-group > .amcharts-Label,
  .amcharts-ValueAxis-group .amcharts-Label-group > .amcharts-Label {
    fill: var(--color-text-primary);
  }
`

enum Offer {
  Bid,
  Ask,
}

/**
 * Normalized price point
 * Both price and volume are BigNumbers (decimal)
 *
 * The price and volume are expressed in atoms
 */
interface PricePoint {
  price: BigNumber
  volume: BigNumber
}

/**
 * Price point data represented in the graph. Contains BigNumbers for operate with less errors and more precission
 * but for representation uses number as expected by the library
 */
interface PricePointDetails {
  // Basic data
  type: Offer
  volume: BigNumber // volume for the price point
  totalVolume: BigNumber // cumulative volume
  price: BigNumber

  // Data for representation
  priceNumber: number
  priceFormatted: string
  totalVolumeNumber: number
  totalVolumeFormatted: string
  askValueY: number | null
  bidValueY: number | null
}

function _toPricePoint(pricePoint: RawPricePoint, quoteTokenDecimals: number, baseTokenDecimals: number): PricePoint {
  return {
    price: new BigNumber(pricePoint.price).div(TEN_BIG_NUMBER.pow(quoteTokenDecimals - baseTokenDecimals)),
    volume: new BigNumber(pricePoint.volume).div(TEN_BIG_NUMBER.pow(baseTokenDecimals)),
  }
}

function _formatSmartBigNumber(amount: BigNumber): string {
  return formatSmart({
    amount: new BN(
      amount
        .times(TEN_BIG_NUMBER.pow(new BigNumber(DEFAULT_PRECISION)))
        // we don't want any decimals
        // before passing into BN conversion
        .decimalPlaces(0)
        .toString(10),
    ),
    precision: DEFAULT_PRECISION,
    decimals: 6,
    smallLimit: '0',
  })
}

/**
 * This method turns the raw data that the backend returns into data that can be displayed by the chart.
 * This involves aggregating the total volume and accounting for decimals
 */
const processData = (
  rawPricePoints: RawPricePoint[],
  baseToken: TokenDetails,
  quoteToken: TokenDetails,
  type: Offer,
): PricePointDetails[] => {
  const isBid = type == Offer.Bid
  const quoteTokenDecimals = quoteToken.decimals
  const baseTokenDecimals = baseToken.decimals

  // Convert RawPricePoint into PricePoint:
  //  Raw items use number (floats) and are given in "atoms"
  //  Normalized items use decimals (BigNumber) and are given in natural units
  let pricePoints: PricePoint[] = rawPricePoints.map((pricePoint) =>
    _toPricePoint(pricePoint, quoteTokenDecimals, baseTokenDecimals),
  )

  // Filter tiny orders
  pricePoints = pricePoints.filter((pricePoint) => pricePoint.volume.gt(SMALL_VOLUME_THRESHOLD))

  // Convert the price points that can be represented in the graph (PricePointDetails)
  const { points } = pricePoints.reduce(
    (acc, pricePoint, index) => {
      const { price, volume } = pricePoint
      const totalVolume = acc.totalVolume.plus(volume)

      // Amcharts draws step lines so that the x value is centered (Default). To correctly display the order book, we want
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
      let askValueY, bidValueY
      if (isBid) {
        const previousPricePoint = acc.points[index - 1]
        askValueY = null
        bidValueY = previousPricePoint?.totalVolume.toNumber() || 0
      } else {
        askValueY = totalVolume.toNumber()
        bidValueY = null
      }

      // Add the new point
      const pricePointDetails: PricePointDetails = {
        type,
        volume,
        totalVolume,
        price,

        // Data for representation
        priceNumber: price.toNumber(),
        totalVolumeNumber: totalVolume.toNumber(),
        priceFormatted: _formatSmartBigNumber(price),
        totalVolumeFormatted: _formatSmartBigNumber(totalVolume),
        askValueY,
        bidValueY,
      }
      acc.points.push(pricePointDetails)

      return { totalVolume, points: acc.points }
    },
    {
      totalVolume: ZERO_BIG_NUMBER,
      points: [] as PricePointDetails[],
    },
  )

  return points
}

function _printOrderBook(pricePoints: PricePointDetails[], baseToken: TokenDetails, quoteToken: TokenDetails): void {
  logDebug('Order Book: ' + baseToken.symbol + '-' + quoteToken.symbol)
  pricePoints.forEach((pricePoint) => {
    const isBid = pricePoint.type === Offer.Bid
    logDebug(
      `\t${isBid ? 'Bid' : 'Ask'} ${pricePoint.totalVolumeFormatted} ${baseToken.symbol} at ${
        pricePoint.priceFormatted
      } ${quoteToken.symbol}`,
    )
  })
}

const createChart = (chartElement: HTMLElement): am4charts.XYChart => {
  am4core.useTheme(am4themesSpiritedaway)
  am4core.options.autoSetClassName = true
  const chart = am4core.create(chartElement, am4charts.XYChart)

  // Colors
  const colors = {
    green: '#3d7542',
    red: '#dc1235',
  }

  // Create axes
  const xAxis = chart.xAxes.push(new am4charts.CategoryAxis())
  xAxis.dataFields.category = 'priceNumber'

  chart.yAxes.push(new am4charts.ValueAxis())

  // Create series
  const bidSeries = chart.series.push(new am4charts.StepLineSeries())
  bidSeries.dataFields.categoryX = 'priceNumber'
  bidSeries.dataFields.valueY = 'bidValueY'
  bidSeries.strokeWidth = 1
  bidSeries.stroke = am4core.color(colors.green)
  bidSeries.fill = bidSeries.stroke
  bidSeries.startLocation = 0.5
  bidSeries.fillOpacity = 0.1

  const askSeries = chart.series.push(new am4charts.StepLineSeries())
  askSeries.dataFields.categoryX = 'priceNumber'
  askSeries.dataFields.valueY = 'askValueY'
  askSeries.strokeWidth = 1
  askSeries.stroke = am4core.color(colors.red)
  askSeries.fill = askSeries.stroke
  askSeries.fillOpacity = 0.1
  askSeries.startLocation = 0.5

  // Add cursor
  chart.cursor = new am4charts.XYCursor()
  return chart
}

interface DrawLabelsParams {
  chart: am4charts.XYChart
  baseToken: TokenDetails
  quoteToken: TokenDetails
  networkId: number
}

const drawLabels = ({ chart, baseToken, quoteToken, networkId }: DrawLabelsParams): void => {
  const baseTokenLabel = safeTokenName(baseToken)
  const quoteTokenLabel = safeTokenName(quoteToken)
  const market = baseTokenLabel + '-' + quoteTokenLabel

  const networkDescription = networkId !== Network.Mainnet ? `${getNetworkFromId(networkId)} ` : ''

  const [xAxis] = chart.xAxes
  const [yAxis] = chart.yAxes

  xAxis.title.text = `${networkDescription} Price (${quoteTokenLabel})`
  yAxis.title.text = baseTokenLabel

  const [bidSeries, askSeries] = chart.series

  bidSeries.tooltipText = `[bold]${market}[/]\nBid Price: [bold]{priceFormatted}[/] ${quoteTokenLabel}\nVolume: [bold]{totalVolumeFormatted}[/] ${baseTokenLabel}`
  askSeries.tooltipText = `[bold]${market}[/]\nAsk Price: [bold]{priceFormatted}[/] ${quoteTokenLabel}\nVolume: [bold]{totalVolumeFormatted}[/] ${baseTokenLabel}`
}

interface ProcessRawDataParams {
  data: RawApiData
  baseToken: TokenDetails
  quoteToken: TokenDetails
}

const processRawApiData = ({ data, baseToken, quoteToken }: ProcessRawDataParams): PricePointDetails[] => {
  try {
    const bids = processData(data.bids, baseToken, quoteToken, Offer.Bid)
    const asks = processData(data.asks, baseToken, quoteToken, Offer.Ask)
    const pricePoints = bids.concat(asks)

    // Sort points by price
    pricePoints.sort((lhs, rhs) => lhs.price.comparedTo(rhs.price))

    _printOrderBook(pricePoints, baseToken, quoteToken)

    return pricePoints
  } catch (error) {
    console.error('Error processing data', error)
    return []
  }
}

const OrderBookWidget: React.FC<OrderBookChartProps> = (props) => {
  const { baseToken, quoteToken, networkId, data } = props
  console.log('props', props)
  const mountPoint = useRef<HTMLDivElement>(null)
  const chartRef = useRef<am4charts.XYChart | null>(null)

  useEffect(() => {
    if (!mountPoint.current) return
    const chart = createChart(mountPoint.current)
    chartRef.current = chart

    // dispose on mount only
    return (): void => chart.dispose()
  }, [])

  useEffect(() => {
    if (!chartRef.current || !data) return

    // go on with the update when data is ready
    drawLabels({
      chart: chartRef.current,
      baseToken,
      quoteToken,
      networkId,
    })

    chartRef.current.data = processRawApiData({ data, baseToken, quoteToken })
    console.log('WILL DISPLAY NEW DATA', chartRef.current.data)
  }, [baseToken, networkId, quoteToken, data])

  return (
    <Wrapper ref={mountPoint}>
      Show order book for token {safeTokenName(baseToken)} ({baseToken.id}) and {safeTokenName(baseToken)} (
      {quoteToken.id})
    </Wrapper>
  )
}

export default OrderBookWidget
