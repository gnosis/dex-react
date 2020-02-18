import React, { ReactNode, CSSProperties } from 'react'
import Portal from './Portal'
import { usePopperDefault, TOOLTIP_OFFSET } from 'hooks/usePopper'
import { State, Placement } from '@popperjs/core'
import styled from 'styled-components'
import { isElement, isFragment } from 'react-is'

const TooltipOuter = styled.div<Pick<TooltipBaseProps, 'isShown'>>`
  visibility: ${(props): string | false => !props.isShown && 'hidden'};
`

const TooltipArrow = styled.div`
  &,
  ::before {
    position: absolute;
    width: ${TOOLTIP_OFFSET}px;
    height: ${TOOLTIP_OFFSET}px;
    z-index: -1;
  }

  ::before {
    content: '';
    transform: rotate(45deg);
    background: #333;
  }
`

const TooltipInner = styled.div`
  background: #333;
  color: white;
  font-weight: bold;
  padding: 4px 8px;
  font-size: 13px;
  border-radius: 4px;

  &[data-popper-placement^='top'] > ${TooltipArrow} {
    bottom: -${TOOLTIP_OFFSET / 2}px;
  }

  &[data-popper-placement^='bottom'] > ${TooltipArrow} {
    top: -${TOOLTIP_OFFSET / 2}px;
  }

  &[data-popper-placement^='left'] > ${TooltipArrow} {
    right: -${TOOLTIP_OFFSET / 2}px;
  }

  &[data-popper-placement^='right'] > ${TooltipArrow} {
    left: -${TOOLTIP_OFFSET / 2}px;
  }
`

interface TooltipBaseProps {
  isShown: boolean
  state: Partial<Pick<State, 'placement' | 'styles'>>
}

const TooltipBase: React.FC<TooltipBaseProps> = ({ children, isShown, state }, ref) => {
  const { placement, styles = {} } = state

  return (
    // Portal isolates popup styles from the App styles
    <Portal>
      <TooltipOuter isShown={isShown}>
        <TooltipInner role="tooltip" ref={ref} style={styles.popper as CSSProperties} data-popper-placement={placement}>
          <TooltipArrow data-popper-arrow style={styles.arrow as CSSProperties} />
          {isShown && children}
        </TooltipInner>
      </TooltipOuter>
    </Portal>
  )
}

interface TooltipProps extends TooltipBaseProps {
  children?: ReactNode
}

export const Tooltip = React.memo(React.forwardRef<HTMLDivElement, TooltipProps>(TooltipBase))

interface WrapperProps {
  tooltip: ReactNode
  placement?: Placement
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  as?: keyof JSX.IntrinsicElements | React.ComponentType<any>
}

const Wrapper: React.FC<WrapperProps> = ({ children, tooltip, placement, as }) => {
  const { targetProps, tooltipProps } = usePopperDefault<HTMLDivElement>(placement)

  const chilrenNumber = React.Children.count(children)

  // can attach ref to element
  // if children is a single element, not just text, and `as` tag|Component not specified
  if (chilrenNumber === 1 && typeof as === 'undefined' && isElement(children) && !isFragment(children)) {
    const TargetComponent = React.cloneElement(children, targetProps)
    return (
      <>
        {TargetComponent}
        <Tooltip {...tooltipProps}>{tooltip}</Tooltip>
      </>
    )
  }

  //  if as not provided and can't clone single element
  //  use div
  const TargetComponent = as || 'div'

  return (
    <TargetComponent {...targetProps}>
      {children}
      <Tooltip {...tooltipProps}>{tooltip}</Tooltip>
    </TargetComponent>
  )
}

interface MemoizedWrapperProps extends WrapperProps {
  children?: ReactNode
}

export const TooltipWrapper = React.memo<MemoizedWrapperProps>(Wrapper)
