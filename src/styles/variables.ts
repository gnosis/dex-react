import { css } from 'styled-components'

const AllColors = `
  // FONTS
  --font-default: "Averta", "Helvetica Neue", Helvetica, sans-serif;
  --font-mono: "Roboto Mono", monospace;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-bold: 700;
  // ------------------------------
`

const LightColors = `
  // Background
  --color-background-lighter: #f7f7f7;
  --color-background: #EDF2F7;
  --color-background-pageWrapper: #ffffff;
  --color-background-actionCards: #bbfdbb;
  --color-background-highlighted: #fcfde0;
  --color-background-selected: ##d9d9d9;
  --color-background-selected-darker: #b6b6b6;
  --color-background-selected-dark: #bfbfbf;
  --color-background-progressBar: lightskyblue;

  // Borders
  --color-border: transparent;

  // Text
  --color-text-primary: #476481;
  --color-text-secondary: #9FB4C9;
  --color-text-active: #218DFF;

  // Buttons
  --color-button-primary: #000;
  --color-button-success: #5ca95c;
  --color-button-disabled: #666;
  --color-button-danger: #e55353;

  // Components
  --color-background-banner: #DFE6EF;
  --color-text-wallet: #000;
  --color-text-deposit-header: #000000;
  --color-background-nav-active: #DFE6EF;

  // Shadow
  --shadow-color: #00000047;

`

const DarkColors = `
  // Background
  --color-background-lighter: #f7f7f7;
  --color-background: #2e2e2e;
  --color-background-pageWrapper: #181a1b;
  --color-background-actionCards: #026902;
  --color-background-highlighted: #3f4104;
  --color-background-selected: ##d9d9d9;
  --color-background-selected-darker: #b6b6b6;
  --color-background-selected-dark: #2a2d2f;
  --color-background-progressBar: #4338b5;

  // Borders
  --color-border: #262626;

  // Text
  --color-text-primary: #e8e6e3;
  --color-text-secondar: #545454;

  // Buttons
  --color-button-primary: #e8e6e3;
  --color-button-success: #91c591;
  --color-button-disabled: #3d4043;
  --color-button-danger: #9c1818;

  // Components
  --color-background-banner: #252729;
  --color-text-banner: wheat;

  // Shadow
  --shadow-color: #00000047;

`

const variables = css`
  // General styles for all themes
  :root {
    ${AllColors}
  }

  :root,
  body.light-theme {
    // ------------------------------
    // COLOURS
    //-----------------------------
    ${LightColors}

    // ------------------------------
    // BORDERS
    // ------------------------------
    --border-radius: 0.4375rem;

    // ------------------------------
    // BOX-SHADOW
    // ------------------------------
    --box-shadow: 0.0625rem 0.125rem 0.125rem -0.0625rem var(--shadow-color);

    //-------------------------------
    // GRID
    // ------------------------------
    --grid-row-size-walletPage: minmax(10.9375rem, 1.1fr) repeat(3, 1fr) minmax(10.3125rem, 1fr);
  }

  @media (prefers-color-scheme: dark) {
    :root {
      ${DarkColors}
    }
  }

  body.dark-theme {
    ${DarkColors}
  }
`

export default variables
