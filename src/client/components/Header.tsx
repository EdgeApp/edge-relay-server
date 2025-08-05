import * as React from 'react'
import styled from 'styled-components'

const HeaderContainer = styled.header`
  background-color: #0c2550;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin: 0;
  position: relative;
  top: 0;
  left: 0;
`

const Logo = styled.img`
  height: 45px;
  margin: 0 12px;
`

const Title = styled.h1`
  color: white;
  margin: 0;
  font-size: 2.25rem;
  display: flex;
  align-items: center;
`

export const Header = (): React.ReactElement => (
  <HeaderContainer>
    <Title>
      Welcome to the{' '}
      <Logo
        src="https://raw.githubusercontent.com/EdgeApp/edge-brand-guide/refs/heads/master/Logo/Primary/Edge_Primary_Logo_MintWhite.png"
        alt="Edge"
      />{' '}
      snack bar
    </Title>
  </HeaderContainer>
)
