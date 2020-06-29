import React, { useState } from 'react'
import { useForm, ValidationResolver, FieldErrors } from 'react-hook-form'
import { DevTool } from '@hookform/devtools'
import styled from 'styled-components'

import { walletApi } from 'api'
import { setCustomWCOptions, getWCOptionsFromStorage, WCOptions } from 'utils'
import { useHistory } from 'react-router'
import { WCSettings, wcResolver } from 'components/Settings/WalletConnect'

const SettingsButtonSubmit = styled.button`
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  background: #355df1;
  font-size: 1.4rem;
  color: var(--color-text-CTA);
  -webkit-letter-spacing: 0;
  -moz-letter-spacing: 0;
  -ms-letter-spacing: 0;
  letter-spacing: 0;
  line-height: 1;
  margin: 0 1.6rem;
  border-radius: 0.6rem;
  outline: 0;
  height: 3.6rem;
  letter-spacing: 0.03rem;
`

const SettingsButtonReset = styled(SettingsButtonSubmit)`
  background: #c7cbda;
  color: var(--color-text-active);
`

export interface SettingsFormData {
  walletconnect: WCOptions
}

export interface ResolverResult<T extends SettingsFormData, K extends keyof T = keyof T> {
  values: T[K] | null
  errors: FieldErrors<T[K]> | null
  name: K
}

export interface Resolver<T extends SettingsFormData, K extends keyof T = keyof T> {
  (data: T[K]): ResolverResult<T>
}

const composeValuesErrors = <T extends SettingsFormData, K extends keyof T>(
  resolvedResults: { errors: null | FieldErrors<T[K]>; values: null | T[K]; name: K }[],
): {
  values: T | null
  errors: FieldErrors<T> | null
} => {
  const { errors, values } = resolvedResults.reduce<{
    errors: null | FieldErrors<T>
    values: null | T
  }>(
    (acc, elem) => {
      // accumulate errors
      // or leave as null
      if (elem.errors) {
        if (!acc.errors) acc.errors = {}

        acc.errors = {
          ...acc.errors,
          [elem.name]: elem.errors,
        }
      }

      // accumulate values
      // or set to null if there are errors
      if (acc.errors) {
        acc.values = null
        return acc
      }

      if (!elem.values) return acc

      if (!acc.values) acc.values = {} as T
      acc.values = {
        ...acc.values,
        [elem.name]: elem.values,
      }

      return acc
    },
    { errors: null, values: null },
  )

  return {
    values: errors ? null : values,
    errors,
  }
}

const composeResolvers = (resolvers: { [K in keyof SettingsFormData]: Resolver<SettingsFormData, K> }) => {
  return (data: SettingsFormData): ResolverResult<SettingsFormData>[] => {
    return Object.keys(data).map((key: keyof SettingsFormData) => {
      const resolver = resolvers[key]
      return resolver(data[key])
    })
  }
}

const mainResolver = composeResolvers({
  walletconnect: wcResolver,
})

const resolver: ValidationResolver<SettingsFormData> = data => {
  const results = mainResolver(data)

  // potentially allow for Setting sections other than WalletConnect
  const { values, errors } = composeValuesErrors(results)

  return {
    values: errors ? {} : values || {},
    errors: errors || {},
  }
}

const SettingsWrapper = styled.div`
  width: 100%;
`

const getDefaultSettings = (): SettingsFormData => ({
  walletconnect: getWCOptionsFromStorage(),
})

export const Settings: React.FC = () => {
  // to not touch localStorage on every render
  const [defaultValues] = useState(getDefaultSettings)

  const { register, handleSubmit, errors, control } = useForm<SettingsFormData>({
    validationResolver: resolver,
    defaultValues,
  })

  const history = useHistory()

  const onSubmit = async (data: SettingsFormData): Promise<void> => {
    if (data.walletconnect) {
      // if options didn't change, exit early
      if (!setCustomWCOptions(data.walletconnect)) return

      // connect with new options
      // with Web3Modal prompt and everything
      const reconnected = await walletApi.reconnectWC()
      // if successful, redirect to home
      if (reconnected) history.push('/')
    }
  }

  return (
    <SettingsWrapper>
      <form onSubmit={handleSubmit(onSubmit)}>
        <WCSettings register={register} errors={errors} />
        <div>
          <SettingsButtonReset type="reset">Reset</SettingsButtonReset>
          <SettingsButtonSubmit type="submit">Apply Settings</SettingsButtonSubmit>
        </div>
      </form>
      <DevTool control={control} />
    </SettingsWrapper>
  )
}
