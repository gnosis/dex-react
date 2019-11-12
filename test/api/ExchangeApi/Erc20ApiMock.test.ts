import { Erc20Api, TxOptionalParams } from 'types'
import BALANCES from '../../data/erc20Balances'
import ALLOWANCES from '../../data/erc20Allowances'
import Erc20ApiMock from 'api/erc20/Erc20ApiMock'
import { USER_1, TOKEN_1, USER_2, TOKEN_6, CONTRACT, TOKEN_8, RECEIPT, USER_3, TOKEN_3 } from '../../data'
import { ZERO } from 'const'
import BN from 'bn.js'
import { clone } from '../../testHelpers'

let instance: Erc20Api = new Erc20ApiMock({ balances: BALANCES, allowances: ALLOWANCES })

describe('Basic view functions', () => {
  describe('balanceOf', () => {
    it('returns balance', async () => {
      const token1Balance = BALANCES[USER_1][TOKEN_1]
      expect(await instance.balanceOf(TOKEN_1, USER_1)).toBe(token1Balance)
    })

    it('returns 0 when not found', async () => {
      expect(await instance.balanceOf(TOKEN_1, USER_2)).toBe(ZERO)
    })
  })

  describe('allowance', () => {
    it('returns allowance', async () => {
      const allowance = ALLOWANCES[USER_1][TOKEN_6][CONTRACT]
      expect(await instance.allowance(TOKEN_6, USER_1, CONTRACT)).toBe(allowance)
    })

    it('user without allowance set returns 0', async () => {
      expect(await instance.allowance(TOKEN_1, USER_2, CONTRACT)).toBe(ZERO)
    })

    it('token without allowance set returns 0', async () => {
      expect(await instance.allowance(TOKEN_8, USER_1, CONTRACT)).toBe(ZERO)
    })

    it('spender allowance 0 returns 0', async () => {
      expect(await instance.allowance(TOKEN_1, USER_1, CONTRACT)).toBe(ZERO)
    })
  })
})

describe('Write functions', () => {
  const mockFunction = jest.fn()
  const optionalParams: TxOptionalParams = {
    onSentTransaction: mockFunction,
  }
  function resetInstance(): void {
    instance = new Erc20ApiMock({ balances: clone(BALANCES), allowances: clone(ALLOWANCES) })
  }

  beforeEach(mockFunction.mockClear)
  beforeEach(resetInstance)

  describe('approve', () => {
    const amount = new BN('5289375492345723')
    it('allowance is set', async () => {
      const result = await instance.approve(USER_1, TOKEN_1, USER_2, amount, optionalParams)

      expect(await instance.allowance(TOKEN_1, USER_1, USER_2)).toBe(amount)
      expect(result).toBe(RECEIPT)
    })

    it('calls optional callback', async () => {
      await instance.approve(USER_1, TOKEN_1, USER_2, amount, optionalParams)
      expect(mockFunction.mock.calls.length).toBe(1)
    })
  })

  describe('transfer', () => {
    const amount = new BN('987542934752394')
    it('transfers', async () => {
      const contractBalance = await instance.balanceOf(TOKEN_1, CONTRACT)
      const userBalance = await instance.balanceOf(TOKEN_1, USER_2)

      const result = await instance.transfer(CONTRACT, TOKEN_1, USER_2, amount)

      expect(await instance.balanceOf(TOKEN_1, CONTRACT)).toEqual(contractBalance.sub(amount))
      expect(await instance.balanceOf(TOKEN_1, USER_2)).toEqual(userBalance.add(amount))
      expect(result).toBe(RECEIPT)
    })

    it('does not transfer when balance is insufficient', async () => {
      // TODO: after hours, couldn't figure out a way to check for the AssertionError using expect().toThrow()
      await instance
        .transfer(USER_2, TOKEN_1, CONTRACT, amount)
        .then(() => fail('Should not succeed'))
        .catch(e => {
          expect(e.message).toMatch(/^The user doesn't have enough balance$/)
        })
    })

    it('calls optional callback', async () => {
      await instance.transfer(CONTRACT, TOKEN_1, USER_2, amount, optionalParams)
      expect(mockFunction.mock.calls.length).toBe(1)
    })
  })
  describe('transferFrom', () => {
    const amount = new BN('78565893578')

    it('transfers and allowance is deduced', async () => {
      const expectedUser1Balance = (await instance.balanceOf(TOKEN_1, USER_1)).sub(amount)
      const expectedUser2Balance = (await instance.balanceOf(TOKEN_1, USER_2)).add(amount)

      await instance.approve(USER_1, TOKEN_1, USER_3, amount)

      const result = await instance.transferFrom(USER_3, TOKEN_1, USER_1, USER_2, amount)

      expect(await instance.balanceOf(TOKEN_1, USER_1)).toEqual(expectedUser1Balance)
      expect(await instance.balanceOf(TOKEN_1, USER_2)).toEqual(expectedUser2Balance)
      expect((await instance.allowance(TOKEN_1, USER_1, USER_3)).toString()).toEqual(ZERO.toString())
      expect(result).toBe(RECEIPT)
    })

    it('does not transfer when balance is insufficient', async () => {
      await instance.approve(USER_2, TOKEN_3, USER_3, amount)

      await instance
        .transferFrom(USER_3, TOKEN_3, USER_2, USER_1, amount)
        .then(() => {
          fail('Should not succeed')
        })
        .catch(e => {
          expect(e.message).toMatch(/^The user doesn't have enough balance$/)
        })
    })

    it('does not transfer when allowance is insufficient', async () => {
      await instance
        .transferFrom(USER_3, TOKEN_3, USER_1, USER_2, amount)
        .then(() => {
          fail('Should not succeed')
        })
        .catch(e => {
          expect(e.message).toMatch(/^Not allowed to perform this transfer$/)
        })
    })

    it('calls optional callback', async () => {
      await instance.approve(USER_1, TOKEN_1, USER_3, amount)
      await instance.transferFrom(USER_3, TOKEN_1, USER_1, USER_2, amount, optionalParams)
      expect(mockFunction.mock.calls.length).toBe(1)
    })
  })
})
