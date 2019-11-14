import 'types'

import { hot } from 'react-hot-loader/root'
import React from 'react'
import GlobalStyles from './components/layout/GlobalStyles'
import { BrowserRouter as Router, Route, Switch, RouteProps, Redirect } from 'react-router-dom'

// Toast notifications
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.min.css'

// Main layout
import Layout from 'components/layout/'

// Pages
import About from 'pages/About'
import Deposit from 'pages/Deposit'
import Trade from 'pages/Trade'
import SourceCode from 'pages/SourceCode'
import NotFound from 'pages/NotFound'
import ConnectWallet from 'pages/ConnectWallet'
import { walletApi } from 'api'
import { TestComponent } from '../test/hooks/useSafeState.hooks.test'

const PrivateRoute: React.FC<RouteProps> = (props: RouteProps) => {
  const isConnected = walletApi.isConnected()

  const { component: Component, ...rest } = props
  return (
    <Route
      {...rest}
      render={(props): React.ReactNode =>
        isConnected ? (
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

// App
const App: React.FC = () => (
  <>
    <GlobalStyles />
    <Router basename={process.env.BASE_URL}>
      <Layout>
        <Switch>
          <Route path="/TEST" render={() => <TestComponent safeUpdate />} />
          <Route path="/trade/sell=:sell-:sellAmt&receive=:receive-:receiveAmt" component={Trade} />
          <Route path="/about" exact component={About} />
          <PrivateRoute path="/deposit" exact component={Deposit} />
          <Route path="/source-code" exact component={SourceCode} />
          <Route path="/connect-wallet" exact component={ConnectWallet} />
          <Redirect from="/" to="/trade/sell=DAI-0&receive=USDC-0" />
          <Route component={NotFound} />
        </Switch>
      </Layout>
    </Router>
  </>
)

export default hot(App)
