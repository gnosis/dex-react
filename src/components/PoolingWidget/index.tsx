import React, { useCallback, useMemo } from 'react'

import SubComponents from './SubComponents'
import Widget from 'components/Layout/Widget'
import {
  BarWrapper,
  StepSeparator,
  PoolingInterfaceWrapper,
  ProgressStep,
  ProgressStepText,
  StepDescriptionWrapper,
  StepButtonsWrapper,
  GreySubText,
} from './PoolingWidget.styled'

import { faCheckCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import useSafeState from 'hooks/useSafeState'
import { useWalletConnection } from 'hooks/useWalletConnection'

import { tokenListApi } from 'api'

import { TokenDetails } from '@gnosis.pm/dex-js'
import { Network } from 'types'

import { maxAmountsForSpread } from 'utils'
import { DEFAULT_PRECISION } from 'const'

interface ProgressBarProps {
  step: number
  stepArray: string[]
}

const stepChecker = (step: number, index: number): boolean => step >= index + 1 && step <= 4

const ProgressBar: React.FC<ProgressBarProps> = ({ step, stepArray }) => {
  return (
    <>
      <BarWrapper>
        {stepArray.map((stepName, index) => (
          <React.Fragment key={stepName}>
            <ProgressStep
              $bgColor={stepChecker(step, index) ? 'var(--color-background-progressBar)' : 'var(--color-background)'}
            >
              <ProgressStepText $bold={stepChecker(step, index) ? 'bolder' : 'normal'}>{index + 1}</ProgressStepText>
            </ProgressStep>
            {index + 1 < 4 && (
              <StepSeparator
                $bgColor={stepChecker(step, index) ? 'var(--color-background-progressBar)' : 'var(--color-background)'}
              />
            )}
          </React.Fragment>
        ))}
      </BarWrapper>
      <BarWrapper $minHeight="auto">
        {stepArray.map((stepName, index) => (
          <React.Fragment key={stepName}>
            <ProgressStepText $bold={stepChecker(step, index) ? 'bolder' : 'normal'}>{stepName}</ProgressStepText>
            {index + 1 < 4 && <p />}
          </React.Fragment>
        ))}
      </BarWrapper>
    </>
  )
}

const StepDescription: React.FC = () => (
  <StepDescriptionWrapper>
    <p>Setup your liquidity provision once and allow your funds to be traded on your behalf.</p>
    <ul>
      <li>
        <FontAwesomeIcon icon={faCheckCircle} />
        No maintenance needed
      </li>
      <li>
        <FontAwesomeIcon icon={faCheckCircle} />
        No gas costs for trades
      </li>
      <li>
        <FontAwesomeIcon icon={faCheckCircle} />
        Cancellation possible at any time
      </li>
    </ul>
    {/* TODO: add URL */}
    <a href="#">Learn more about liquidity provision</a>
  </StepDescriptionWrapper>
)

const StepTitle: React.FC<Pick<ProgressBarProps, 'step'>> = ({ step }) => {
  const { title, subtext }: { title: string; subtext?: string } = useMemo(() => {
    switch (step) {
      case 1:
        return {
          title: '1. Select your trusted stablecoins',
          subtext:
            'Select two or more stablecoins you want to include in your liquidity provision and you believe are worth $1',
        }
      case 2:
        return {
          title: '2. Define your spread',
          subtext:
            'The spread defines the percentage you want to sell above $1, and buy below $1 between all selected tokens',
        }
      case 3:
        return { title: '3. Create liquidity', subtext: '' }
      case 4:
        return { title: '4. Add funding', subtext: '' }
      default:
        return { title: 'An error occurred, please try again' }
    }
  }, [step])

  return (
    <div>
      <ProgressStepText as="h2" $bold="bolder">
        {title}
      </ProgressStepText>
      {subtext && <GreySubText $justify="flex-start">{subtext}</GreySubText>}
    </div>
  )
}

function addRemoveMapItem(map: Map<number, TokenDetails>, newToken: TokenDetails): Map<number, TokenDetails> {
  // Cache map (no mutate)
  const copyMap = new Map(map)
  // Map item doesn't exist? Add that fool in
  if (!copyMap.get(newToken.id)) return copyMap.set(newToken.id, newToken)
  // Else remove that b
  copyMap.delete(newToken.id)
  return copyMap
}

// TODO: Decide the best place to put this. This file is too long already, but feels to specific for utils
export function createOrderParams(tokens: TokenDetails[], spread: number): PlaceMultipleOrdersParams[] {
  // We'll create 2 orders for each pair: SELL_A -> BUY_B and SELL_B -> BUY_A
  // where buyAmount == max uint128, buyAmount > sellAmount and sellAmount == buyAmount * (1 - spread / 100)

  // With 2 tokens A, B, we have 1 pair [(A, B)] == 2 orders
  // With 3 tokens A, B, C, we have 3 pairs [(A, B), (A, C), (B, C)] == 6 orders
  // With 4 tokens A, B, C, D, we have 6 pairs [(A, B), (A, C), (A, D), (B, C), (B, D), (C, D)] == 12 orders
  // And so on...
  // The number of orders is equal to num_tokens * (num_tokens -1)
  const orders: PlaceMultipleOrdersParams[] = []

  tokens.forEach(buyToken =>
    tokens.forEach(sellToken => {
      // We don't want to pair a token with itself
      if (buyToken !== sellToken) {
        // calculating buy/sell amounts
        const { buyAmount, sellAmount } = maxAmountsForSpread(
          spread,
          buyToken.decimals || DEFAULT_PRECISION,
          sellToken.decimals || DEFAULT_PRECISION,
        )

        orders.push({
          buyToken: buyToken.id,
          sellToken: sellToken.id,
          buyAmount,
          sellAmount,
        })
      }
    }),
  )

  return orders
}

const PoolingInterface: React.FC = () => {
  const [step, setStep] = useSafeState(1)
  const [selectedTokensMap, setSelectedTokensMap] = useSafeState<Map<number, TokenDetails>>(new Map())
  const [spread, setSpread] = useSafeState(0.2)

  const { networkId } = useWalletConnection()
  // Avoid displaying an empty list of tokens when the wallet is not connected
  const fallBackNetworkId = networkId ? networkId : Network.Mainnet // fallback to mainnet

  // TODO: switched to tagged tokens @anxo @leandro
  const tokens = useMemo(() => tokenListApi.getTokens(fallBackNetworkId).filter(({ symbol }) => symbol !== 'WETH'), [
    fallBackNetworkId,
  ])

  const prevStep = useCallback((): void => {
    if (step == 1) return

    return setStep(step - 1)
  }, [setStep, step])
  const nextStep = useCallback((): void => {
    if (step == 4) return

    return setStep(step + 1)
  }, [setStep, step])

  const handleTokenSelect = useCallback(
    (token: TokenDetails): void => {
      const state = addRemoveMapItem(selectedTokensMap, token)
      return setSelectedTokensMap(state)
    },
    [selectedTokensMap, setSelectedTokensMap],
  )

  const restProps = useMemo(
    () => ({
      handleTokenSelect,
      tokens,
      selectedTokensMap,
      spread,
      setSpread,
    }),
    [handleTokenSelect, selectedTokensMap, setSpread, spread, tokens],
  )

  return (
    <Widget>
      <PoolingInterfaceWrapper $width="75vw">
        <h2>New Liquidity</h2>
        <ProgressBar step={step} stepArray={['Select Token', 'Define Spread', 'Create Liquidity', 'Add Funding']} />
        <StepDescription />
        <StepTitle step={step} />

        {/* Main Components here */}
        <SubComponents step={step} {...restProps} />

        <StepButtonsWrapper>
          <button disabled={step < 2 || selectedTokensMap.size < 2} onClick={(): void => prevStep()}>
            Back
          </button>
          <button disabled={step >= 4 || selectedTokensMap.size < 2} onClick={(): void => nextStep()}>
            Continue
          </button>
        </StepButtonsWrapper>
      </PoolingInterfaceWrapper>
    </Widget>
  )
}

export default PoolingInterface
