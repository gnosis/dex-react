import React, { useEffect } from 'react'
import styled from 'styled-components'
import useSafeState from 'hooks/useSafeState'

const FUSE_APP_THEME = 'FUSE_APP_THEME'

const TogglerWrapper = styled.div`
  font-size: 70%;
`

const ToggleLabel = styled.label<{ selected: boolean }>`
  color: ${(props): string => (props.selected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)')};
  cursor: pointer;
  font-weight: ${(props): string => (props.selected ? 'bolder' : 'normal')};

  padding: 0.125rem 0.5rem;
  text-transform: uppercase;

  transition: all 0.2s ease-in-out;

  &:nth-child(2) {
    border-left: 0.0625rem solid var(--color-text-primary);
    border-right: 0.0625rem solid var(--color-text-primary);
  }

  &:hover {
    color: var(--color-text-primary);
  }

  > input {
    display: none;
  }
`

const toggleValues = ['auto', 'light', 'dark']
const toggleValue2class = {
  light: 'light-theme',
  dark: 'dark-theme',
  get auto(): 'light-theme' | 'dark-theme' {
    const hours = new Date().getHours()
    // after 0800 but before 1700 (day)
    const isDay = hours > 8 && hours < 17

    return isDay ? 'light-theme' : 'dark-theme'
  },
}
const themeClasses = Object.values(toggleValue2class)

const ThemeToggler: React.FC = () => {
  const startTheme = localStorage.getItem(FUSE_APP_THEME) || 'auto'
  const [active, setActive] = useSafeState(startTheme)

  useEffect(() => {
    const className = toggleValue2class[active]

    document.body.classList.remove(...themeClasses)
    if (className) {
      document.body.classList.add(className)
      localStorage.setItem(FUSE_APP_THEME, active)
    }
  }, [active])

  return (
    <TogglerWrapper>
      Theme:{' '}
      {toggleValues.map(value => (
        <ToggleLabel key={value} selected={value === active}>
          <input
            type="radio"
            name="theme"
            value={value}
            checked={value === active}
            onChange={(): void => setActive(value)}
          />
          {value}
        </ToggleLabel>
      ))}
    </TogglerWrapper>
  )
}

export default ThemeToggler
