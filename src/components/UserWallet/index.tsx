import React from 'react'
import { withRouter, RouteComponentProps, useRouteMatch } from 'react-router'
import { toast } from 'react-toastify'
import CopyToClipboard from 'react-copy-to-clipboard'
import QRCode from 'qrcode.react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faSpinner,
  faSignOutAlt,
  faSignInAlt,
  faCopy,
  faCheck,
  faChevronCircleDown,
  faChevronCircleUp,
} from '@fortawesome/free-solid-svg-icons'

import { EtherscanLink } from '../EtherscanLink'
import {
  UserWalletItem,
  UserWalletWrapper,
  NetworkTitle,
  UserWalletToggler,
  EtherImage,
  UserWalletSlideWrapper,
  CopyDiv,
  MonospaceAddress,
} from './UserWallet.styled'

import { walletApi } from 'api'
import { useWalletConnection } from 'hooks/useWalletConnection'
import useSafeState from 'hooks/useSafeState'

import { abbreviateString, getNetworkFromId } from 'utils'
// TODO: probably not do this
import WalletImg from 'assets/img/black_eth_diamond.png'

interface UserWalletProps extends RouteComponentProps {
  className: string
}

const UserWallet: React.FC<RouteComponentProps> = (props: UserWalletProps) => {
  const { isConnected, userAddress, networkId } = useWalletConnection()

  const [loadingLabel, setLoadingLabel] = useSafeState<string | null>(null)
  const [copiedToClipboard, setCopiedToClipboard] = useSafeState(false)
  const [showWallet, setShowWallet] = useSafeState(false)

  const tradePageMatch = useRouteMatch('/trade/')

  /***************************** */
  // EVENT HANDLERS

  const connectWallet = async (): Promise<void> => {
    try {
      setLoadingLabel('Connecting...')
      const success = await walletApi.connect()

      // user closed Provider selection modal
      if (!success) return

      toast.success('Wallet connected')
    } catch (error) {
      console.error('error', error)
      toast.error('Error connecting wallet')
    } finally {
      setLoadingLabel(null)
    }
  }

  const disconnectWallet = async (): Promise<void> => {
    try {
      setLoadingLabel('Disconnecting...')
      await walletApi.disconnect()
      toast.info('Wallet disconnected')
    } catch (error) {
      toast.error('Error disconnecting wallet')
    } finally {
      setLoadingLabel(null)
      if (!tradePageMatch) {
        props.history.push('/')
      }
    }
  }

  const handleCopyToClipBoard = (): NodeJS.Timeout => {
    setCopiedToClipboard(true)
    return setTimeout((): void => setCopiedToClipboard(false), 5000)
  }

  /***************************** */
  // RENDER FUNCTIONS

  const renderLogInOutButton = (): JSX.Element => {
    let onClick, content
    if (loadingLabel) {
      content = (
        <>
          <FontAwesomeIcon icon={faSpinner} spin />
          {' ' + loadingLabel}
        </>
      )
    } else if (isConnected) {
      onClick = disconnectWallet
      content = (
        <>
          <FontAwesomeIcon icon={faSignOutAlt} />
          <strong> Log Out</strong>
        </>
      )
    } else {
      onClick = connectWallet
      content = (
        <UserWalletItem $padding="0px" $wordWrap="nowrap">
          <FontAwesomeIcon icon={faSignInAlt} />
          <strong> Connect Wallet</strong>
        </UserWalletItem>
      )
    }

    return (
      <UserWalletItem>
        <a onClick={onClick} className={props.className}>
          {content}
        </a>
      </UserWalletItem>
    )
  }

  return (
    <UserWalletWrapper $walletOpen={!!(showWallet && userAddress)}>
      {userAddress ? (
        <>
          {/* Network */}
          <UserWalletItem $padding="0.375rem">
            <NetworkTitle>{(networkId && getNetworkFromId(networkId)) || 'Unknown Network'}</NetworkTitle>
          </UserWalletItem>
          {/* Wallet logo + address + chevron */}
          <UserWalletToggler onClick={(): void => setShowWallet(!showWallet)}>
            <EtherImage src={WalletImg} />
            <div>{userAddress && abbreviateString(userAddress, 6, 4)}</div>
            <FontAwesomeIcon icon={showWallet ? faChevronCircleUp : faChevronCircleDown} size="xs" />
          </UserWalletToggler>
        </>
      ) : (
        renderLogInOutButton()
      )}
      {/* Main elements of Wallet: QR, Address copy, Etherscan URL, Log Out */}
      {userAddress && showWallet && (
        <UserWalletSlideWrapper>
          <UserWalletItem>
            <QRCode value={userAddress} renderAs="svg" />
          </UserWalletItem>
          <UserWalletItem>
            {/* Copy Confirmation */}
            {copiedToClipboard ? (
              <CopyDiv>
                <FontAwesomeIcon color="#ff62a2;" icon={faCheck} /> <span>Copied!</span>
              </CopyDiv>
            ) : (
              // Address and copy button
              <>
                <MonospaceAddress color="#000">{userAddress} </MonospaceAddress>
                <CopyToClipboard text={userAddress} onCopy={handleCopyToClipBoard}>
                  <FontAwesomeIcon
                    color="#ff62a2;"
                    icon={faCopy}
                    style={{ cursor: 'pointer' }}
                    title="Copy address to clipboard"
                  />
                </CopyToClipboard>
              </>
            )}
          </UserWalletItem>
          {/* Etherscan Link */}
          {
            <UserWalletItem>
              {/* TODO: add network specific */}
              <EtherscanLink type="address" identifier={userAddress} label="View on Etherscan" />
            </UserWalletItem>
          }
          {/* Log In/Out Button */}
          {renderLogInOutButton()}
        </UserWalletSlideWrapper>
      )}
    </UserWalletWrapper>
  )
}

export default withRouter(UserWallet)
