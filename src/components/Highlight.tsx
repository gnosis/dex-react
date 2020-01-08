import styled from 'styled-components'

export default styled.span`
  font-weight: bold;
  color: ${(props): string => props.color || '#367be0'};
  margin-right: 0.3rem;
`
