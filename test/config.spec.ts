import { MultiTcrConfig, DexPriceEstimatorConfig, TheGraphApiConfig } from 'types/config'

describe('get config', () => {
  it('tcr config has the expected defaults', () => {
    const expected: MultiTcrConfig = {
      type: 'multi-tcr',
      config: {
        lists: [
          {
            networkId: 1,
            listId: 1,
            contractAddress: '0x1854dae560abb0f399d8badca456663ca5c309d0',
          },
          {
            networkId: 4,
            contractAddress: '0xBb840456546496E7640DC09ba9fE06E67C157E1b',
          },
        ],
      },
    }

    expect(CONFIG.tcr).toEqual(expected)
  })

  it('dexPriceEstimator config has the expected defaults', () => {
    const expected: DexPriceEstimatorConfig = {
      type: 'dex-price-estimator',
      config: [
        {
          networkId: 1,
          url: 'https://dex-price-estimator.gnosis.io',
        },
        {
          networkId: 4,
          url: 'https://dex-price-estimator.rinkeby.gnosis.io',
        },
      ],
    }
    expect(CONFIG.dexPriceEstimator).toEqual(expected)
  })

  it('theGraphApi config has the expected defaults', () => {
    const expected: TheGraphApiConfig = {
      type: 'the-graph',
      config: [
        {
          networkId: 1,
          url: 'https://api.thegraph.com/subgraphs/name/gnosis/protocol',
        },
        {
          networkId: 4,
          url: 'https://api.thegraph.com/subgraphs/name/gnosis/protocol-rinkeby',
        },
      ],
    }
    expect(CONFIG.theGraphApi).toEqual(expected)
  })
})
