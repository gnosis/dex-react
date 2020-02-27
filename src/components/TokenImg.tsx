import React from 'react'
import styled from 'styled-components'
import unknownTokenImg from 'assets/img/unknown-token.png'

function _loadFallbackTokenImage(event: React.SyntheticEvent<HTMLImageElement>): void {
  const image = event.currentTarget
  image.src = unknownTokenImg
}

export default styled.img.attrs(() => ({ onError: _loadFallbackTokenImage }))`
  width: 2.8rem;
  height: 2.8rem;
  border-radius: 3.6rem;
  object-fit: contain;
  margin: 0 1rem 0 0;
`
