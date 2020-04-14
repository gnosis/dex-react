import React, { useRef, useEffect, useMemo } from 'react'
import Modali, { useModali, ModalHook } from 'modali'
import { fetchTokenData, FetchTokenResult } from 'services'
import { Deferred, createDeferredPromise } from 'utils'
import { TokenDetails } from 'types'
import TokenImg from '../components/TokenImg'
import styled from 'styled-components'
import { tokenListApi } from 'api'
import { TokenFromExchange } from 'services/factories'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import useSafeState from './useSafeState'
import { EtherscanLink } from 'components/EtherscanLink'

interface ExtraProps {
  focused: boolean
}

type FocusedDivProps = JSX.IntrinsicElements['div'] & ExtraProps
// hack to move focus to Modal onOpen
// otherwise need to click inside first
// before any button becomes clickable
const FocusedDiv: React.FC<FocusedDivProps> = ({ focused, ...rest }) => {
  const divRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (focused) divRef.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div tabIndex={-1} ref={divRef} {...rest} />
}

export const ModalBodyWrapper = styled(FocusedDiv)`
  :focus {
    outline: none;
  }

  p {
    line-height: 1.8;
  }

  min-height: 15rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
`

const TokenDisplay = styled.div`
  display: grid;

  align-items: center;
  grid-template-columns: auto minmax(12rem, auto) 2rem 1fr;
  grid-template-rows: auto auto;
  grid-template-areas:
    'image symbol . text-1'
    'image name . text-2';

  .tokenImage {
    grid-area: image;
    height: 5em;
    width: 5em;
  }

  .tokenSymbol {
    grid-area: symbol;
  }

  .tokenName {
    grid-area: name;
  }

  .tokenText {
    &:first-of-type {
      grid-area: text-1;
    }

    &:last-of-type {
      grid-area: text-2;
    }
  }
`

const NonTokenDisplay = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  margin: auto;
`

interface GenerateMessageParams2 {
  fetchResults: FetchTokenResult[]
  networkId: number
}

interface ExplainTokenReasonProps extends FetchTokenResult {
  networkId: number
}

const ExplainTokenReason: React.FC<ExplainTokenReasonProps> = ({ token, reason, networkId, tokenAddress }) => {
  // display differently depending on whether token is
  switch (reason) {
    // a valid token address but not registered on Exchange
    case TokenFromExchange.NOT_REGISTERED_ON_CONTRACT:
      if (!token)
        // this shouldn't happen, but just in case
        return (
          <NonTokenDisplay>
            <span>
              <a href="https://docs.gnosis.io/protocol/docs/addtoken5/" rel="noopener noreferrer" target="_blank">
                Register token
              </a>{' '}
              {tokenAddress} on Exchange first
            </span>
          </NonTokenDisplay>
        )
      return (
        <TokenDisplay>
          <TokenImg src={token.image} alt={token.name} className="tokenImage" />
          <div className="tokenSymbol">
            <strong>{token.symbol}</strong>
          </div>
          <div className="tokenName">{token.name}</div>
          <EtherscanLink
            className="tokenText"
            type="token"
            identifier={token.address}
            networkId={networkId}
            label="Check on etherscan"
          />
          <a
            className="tokenText"
            href="https://docs.gnosis.io/protocol/docs/addtoken5/"
            rel="noopener noreferrer"
            target="_blank"
          >
            Register token on Exchange first
          </a>
        </TokenDisplay>
      )
    // not a ERC20 --> can't do much
    case TokenFromExchange.NOT_ERC20:
      // shouldn't really happen
      // because don't expect anyone to register a non-token on Exchange
      return (
        <NonTokenDisplay>
          {tokenAddress}
          <strong>is not a valid ERC20 token</strong>
        </NonTokenDisplay>
      )
    // registered but not in list --> option to add
    case TokenFromExchange.NOT_IN_TOKEN_LIST:
      // more type-guard than real use-case
      if (!token || !('id' in token)) return null

      return (
        <TokenDisplay>
          <TokenImg src={token.image} alt={token.name} className="tokenImage" />
          <div className="tokenSymbol">
            <strong>{token.symbol}</strong>
          </div>
          <div className="tokenName">{token.name}</div>
          <EtherscanLink
            type="token"
            className="tokenText"
            identifier={token.address}
            networkId={networkId}
            label="Check on etherscan"
          />
        </TokenDisplay>
      )
    default:
      return null
  }
}

const spinner = <FontAwesomeIcon icon={faSpinner} style={{ marginRight: 7, alignSelf: 'center' }} spin size="8x" />

const generateMessage = ({ networkId, fetchResults }: GenerateMessageParams2): React.ReactElement => {
  // in fetching state -- show spinner
  if (fetchResults.length === 0) return spinner
  return (
    <>
      {fetchResults.map(result => (
        <ExplainTokenReason key={result.tokenAddress} {...result} networkId={networkId} />
      ))}
    </>
  )
}

export interface UseAddTokenModalResult {
  addTokensToList: (
    params: TokensAddConfirmationProps | TokensAddConfirmationProps2,
    defaultReason?: FetchTokenResult['reason'],
  ) => Promise<TokenDetails[]>
  modalProps: ModalHook
}

interface TokensAddConfirmationProps {
  tokenAddresses: string[]
  networkId: number
}

interface TokensAddConfirmationProps2 {
  tokens: TokenDetails[]
  networkId: number
}

export interface AddTokenOptions {
  focused: boolean
}

const defaultOptions = {
  focused: false,
}

export const useBetterAddTokenModal = (options: AddTokenOptions = defaultOptions): UseAddTokenModalResult => {
  const [networkId, setNetworkId] = useSafeState(0)

  // using deferred promise that will be resolved separately
  const result = useRef<Deferred<TokenDetails[]>>()

  // addable tokens only
  const [tokens, setTokens] = useSafeState<TokenDetails[]>([])
  // rtesults for all fetched tokens, addable or not
  const [fetchResults, setFetchResults] = useSafeState<FetchTokenResult[]>([])

  const canAddAnyToken = useMemo(
    // check if any of the fetched tokens are addable to USER_LIST
    () => fetchResults.some(({ token, reason }) => token && reason === TokenFromExchange.NOT_IN_TOKEN_LIST),
    [fetchResults],
  )

  const [modalProps, toggleModal] = useModali({
    animated: true,
    centered: true,
    title: 'Do you want to add new Tokens?',
    onHide: () => {
      // always gets triggered on modal closing
      // whether on Confirm, X or Escape
      // it's ok to re-resolve a promise, nothing happens
      result.current?.resolve([])
    },
    message: (
      <ModalBodyWrapper tabIndex={-1} focused={options.focused}>
        {generateMessage({ networkId, fetchResults })}
      </ModalBodyWrapper>
    ),
    buttons: [
      // Cancel button only if there's anything to cancel
      canAddAnyToken ? (
        <Modali.Button
          label="Cancel"
          key="no"
          isStyleCancel
          onClick={(): void => {
            result.current?.resolve([])
          }}
        />
      ) : (
        <>&nbsp;</>
      ),
      <Modali.Button
        // nothing to add -- Close
        label={canAddAnyToken ? 'Confirm' : 'Close'}
        key="yes"
        isStyleDefault={canAddAnyToken}
        isStyleCancel={!canAddAnyToken}
        onClick={(): void => {
          // add tokens
          tokenListApi.addTokens({ tokens, networkId })

          // resolve deferred promise
          result.current?.resolve(tokens)
        }}
      />,
    ],
  })

  // toggleModal recreated every time, keep ref to use in Promise.then
  const toggleRef = useRef(toggleModal)
  toggleRef.current = toggleModal
  // same for modalProps.isShown
  const isShownRef = useRef(modalProps.isShown)
  isShownRef.current = modalProps.isShown

  const addTokensToList = async (
    params: TokensAddConfirmationProps | TokensAddConfirmationProps2,
    defaultReason: FetchTokenResult['reason'] = TokenFromExchange.NOT_IN_TOKEN_LIST,
  ): Promise<TokenDetails[]> => {
    setNetworkId(params.networkId)
    // start deferred promise to be resolved later
    const deferred = createDeferredPromise<TokenDetails[]>()
    result.current = deferred

    // if passed already known tokens
    // show right away without fetching
    if ('tokens' in params) {
      if (params.tokens.length === 0) return []

      setTokens(params.tokens)
      setFetchResults(
        params.tokens.map(token => ({
          token,
          reason: defaultReason,
          tokenAddress: token.address,
        })),
      )
      toggleRef.current()
    } else {
      // if passed tokenAddresses only -- fetch
      if (params.tokenAddresses.length === 0) return []

      toggleRef.current()
      // setTokenAddresses(params.tokenAddresses)
      const fetcher = (tokenAddress: string): Promise<FetchTokenResult> =>
        fetchTokenData({ tokenAddress, networkId: params.networkId })
      let results = await Promise.all(params.tokenAddresses.map(fetcher))

      if (results.every(({ token, reason }) => !token && reason !== TokenFromExchange.NOT_REGISTERED_ON_CONTRACT)) {
        // initial fetch can fail if we are in-between providers
        // which happens when from URL -- default Prov -- Metamask switch happens on page load
        results = await Promise.all(params.tokenAddresses.map(fetcher))
      }

      // only addable tokens, already registered on exchange
      // but not in USER_LIST
      // meaning they must have id
      const tokens = results
        .map(result => result.token)
        .filter((token): token is TokenDetails => !!token && 'id' in token)

      batchUpdates(() => {
        setFetchResults(results)
        setTokens(tokens)
      })
    }

    return deferred.promise.then(value => {
      // close modal
      if (isShownRef.current) toggleRef.current()

      // reset hook state
      result.current = undefined

      return value
    })
  }

  useEffect(() => {
    // isModalVisible is changed after a delay
    // safe to change state as modal is hidden at this point
    if (!modalProps.isModalVisible) {
      // reset hook state
      // only after modal closed to avoid rerendering not-yet closed modal
      // also visible layout thrashing
      setNetworkId(0)
      setTokens([])
      setFetchResults([])
    }
  }, [modalProps.isModalVisible, setFetchResults, setNetworkId, setTokens])

  return {
    modalProps,
    addTokensToList,
  }
}
