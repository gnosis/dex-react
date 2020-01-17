import 'types'

import { hot } from 'react-hot-loader/root'
import React from 'react'
import { BrowserRouter, HashRouter, Route, Switch, RouteProps, Redirect } from 'react-router-dom'

// SCSS
import GlobalStyles from 'styles/global'

// Toast notifications
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.min.css'

// Main layout
import Layout from 'components/Layout'

// Pages
import About from 'pages/About'
import Trade from 'pages/Trade'
import Strategies from 'pages/Strategies'
import Orders from 'pages/Orders'
import Wallet from 'pages/Wallet'
import SourceCode from 'pages/SourceCode'
import NotFound from 'pages/NotFound'
import ConnectWallet from 'pages/ConnectWallet'

// Global State
import { withGlobalContext } from 'hooks/useGlobalState'
import { rootReducer, INITIAL_STATE } from 'reducers-actions'

import { useWalletConnection } from 'hooks/useWalletConnection'

const PrivateRoute: React.FC<RouteProps> = (props: RouteProps) => {
  const { pending, isConnected } = useWalletConnection()

  const { component: Component, ...rest } = props

  if (pending) {
    return <Route {...rest} render={(): null => null} />
  }

  return (
    <Route
      {...rest}
      render={(props): React.ReactNode =>
        isConnected && Component ? (
          <Component {...props} />
        ) : (
          <Redirect
            to={{
              pathname: '/connect-wallet',
              state: { from: props.location },
            }}
          />
        )
      }
    />
  )
}

toast.configure({ position: toast.POSITION.BOTTOM_RIGHT, closeOnClick: false })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Router: typeof BrowserRouter & typeof HashRouter = (window as any).IS_IPFS ? HashRouter : BrowserRouter

// App
const App: React.FC = () => (
  <>
    <GlobalStyles />
    <Router basename={process.env.BASE_URL}>
      <Layout>
        <Switch>
          <PrivateRoute path="/orders" exact component={Orders} />
          <Route path="/trade/:sell-:buy" component={Trade} />
          <PrivateRoute path="/strategies" exact component={Strategies} />
          <PrivateRoute path="/wallet" exact component={Wallet} />
          <PrivateRoute path="/orders" exact component={Orders} />
          <Route path="/about" exact component={About} />
          <Route path="/source-code" exact component={SourceCode} />
          <Route path="/connect-wallet" exact component={ConnectWallet} />
          <Redirect from="/" to="/trade/DAI-USDC?sell=0&buy=0" />
          <Route component={NotFound} />
        </Switch>
      </Layout>
    </Router>
  </>
)

export default hot(
  withGlobalContext(
    App,
    // Initial State
    () => INITIAL_STATE,
    rootReducer,
  ),
)
