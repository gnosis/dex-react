import React, { useState } from 'react'
import styled from 'styled-components'
import { LEGALDOCUMENT } from 'const'

const Wrapper = styled.div`
  display: flex;
  flex-flow: column;
  align-items: center;
  justify-content: center;
  background-color: var(--color-background-banner);
  text-align: center;
  font-size: 1.3rem;
  padding: 1.1rem 0;

  > p {
    line-height: 1;
    padding: 0;
    margin: 0;
  }
`

const Text = styled.p`
  animation-name: foldAnimation;
  animation-duration: 1.5s;

  @keyframes foldAnimation {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`

interface LegalBannerProps {
  startOpen: boolean
  title: string
  useFull: boolean
}

const LegalText: React.FC = () => (
  <Text>
    THIS IS A GRAPHICAL USER INTERFACE (GUI) TO FACILITATE INTERACTING VIA A DIGITAL WALLET, VAULT OR STORAGE MECHANISM
    (WALLET) WITH A <a href={LEGALDOCUMENT.POC_URL}>PROOF OF CONCEPT BETA VERSION</a> OF THE DECENTRALIZED DFUSION
    TRADING PROTOCOL (DFUSION POC). BOTH THE GUI AND DFUSION ARE CONTINUING TO UNDERGO EXTENSIVE TESTING BEFORE THEIR
    POTENTIAL OFFICIAL RELEASE. SHOULD YOU ENCOUNTER ANY BUGS, GLITCHES, LACK OF FUNCTIONALITY OR OTHER PROBLEMS ON THE
    GUI OR WITH , PLEASE LET US KNOW IMMEDIATELY SO WE CAN RECTIFY THESE ACCORDINGLY. YOUR HELP IN THIS REGARD IS
    GREATLY APPRECIATED! YOU CAN WRITE TO US AT THIS ADDRESS {LEGALDOCUMENT.CONTACT_ADDRESS}. THE DFUSION POC IS BEING
    DEVELOPED BY GNOSIS LIMITED AND GOVERNED BY A SERIES OF SMART CONTRACTS THAT ALLOW PEER-TO-PEER TRADES BETWEEN USERS
    APPLYING DUTCH AUCTION AND RING TRADE MECHANISMS WITHOUT THE NEED FOR INTERMEDIARIES. D.EX. OÜ IS NOT DEVELOPING AND
    DOES NOT OPERATE OR MAINTAIN OR HAVE ANY CONTROL WHATSOEVER OVER THE DFUSION POC. BY ACCESSING THE GUI, YOU ARE
    REPRESENTING AND WARRANTING THAT YOU ARE RESPONSIBLE FOR: ENSURING COMPLIANCE WITH THE LAWS OF YOUR JURISDICTION AND
    ACKNOWLEDGE THAT D.EX OÜ IS NOT LIABLE FOR YOUR COMPLIANCE WITH SUCH LAWS. FOR IMPLEMENTING ALL APPROPRIATE MEASURES
    FOR SECURING THE WALLET YOU USE FOR THE GUI, INCLUDING ANY PRIVATE KEY(S), SEED WORDS OR OTHER CREDENTIALS NECESSARY
    TO ACCESS SUCH STORAGE MECHANISM(S). BY USING OUR GUI, WE DO NOT GAIN CUSTODY OF ANY OF YOUR PRIVATE KEYS. THE
    PLATFORM, ITS SOFTWARE AND ALL CONTENT FOUND ON IT ARE PROVIDED ON AN “AS IS” AND “AS AVAILABLE” BASIS. D.EX. OÜ
    DOES NOT GIVE ANY WARRANTIES, WHETHER EXPRESS OR IMPLIED, AS TO THE SUITABILITY OR USABILITY OF THE GUI, ANY OF ITS
    CONTENT OR THE DFUSION POC. YOU USE THIS GUI AT YOUR OWN RISK AND YOU ASSUME FULL RESPONSIBILITY FOR SUCH USE. WE
    EXCLUDE ALL IMPLIED CONDITIONS, WARRANTIES, REPRESENTATIONS OR OTHER TERMS THAT MAY APPLY TO OUR GUI, ITS CONTENT OR
    THE DFUSION POC. WE WILL NOT BE LIABLE TO YOU FOR ANY LOSS OR DAMAGE, WHETHER IN CONTRACT, TORT (INCLUDING
    NEGLIGENCE), BREACH OF STATUTORY DUTY, OR OTHERWISE, EVEN IF FORESEEABLE, ARISING UNDER OR IN CONNECTION WITH THE
    USE OF, OR INABILITY TO USE, OUR GUI. D.EX. OÜ WILL NOT BE LIABLE FOR LOSS OF PROFITS, SALES, BUSINESS, OR REVENUE,
    BUSINESS INTERRUPTION, ANTICIPATED SAVINGS, BUSINESS OPPORTUNITY, GOODWILL OR REPUTATION OR ANY INDIRECT OR
    CONSEQUENTIAL LOSS OR DAMAGE SUFFERED BY ANY PARTY AS A RESULT OF THEIR USE OF THE GUI, ITS CONTENT OR THE DFUSION
    POC. WE ARE THE OWNER OR THE LICENSEE OF ALL INTELLECTUAL PROPERTY RIGHTS OF THE GUI, WHICH ARE PROTECTED BY
    INTELLECTUAL PROPERTY LAWS AND TREATIES AROUND THE WORLD. ALL SUCH RIGHTS ARE RESERVED. THIS DISCLAIMER IS GOVERNED
    BY ESTONIAN LAW. ANY DISPUTE ARISING OUT OF OR IN CONNECTION WITH THIS GUI, SHALL BE RESOLVED AMICABLY AND WHERE
    THIS IS NOT POSSIBLE, SHALL BE FINALLY SETTLED UNDER THE RULES OF ARBITRATION OF THE INTERNATIONAL CHAMBER OF
    COMMERCE BY ONE ARBITRATOR APPOINTED IN ACCORDANCE WITH THE SAID RULES. THE SEAT OF ARBITRATION SHALL BE TALLINN,
    ESTONIA. THE GOVERNING LAW SHALL BE ESTONIAN LAW. THE LANGUAGE OF THE ARBITRATION SHALL BE ENGLISH.
  </Text>
)

const LegalBanner: React.FC<LegalBannerProps> = ({ startOpen, useFull, title }) => {
  const [open, setOpen] = useState(startOpen)

  const openCloseDisclaimer = (): void => setOpen(!open)

  return (
    <Wrapper onClick={openCloseDisclaimer}>
      <p>{title}</p>
      {useFull && open && <LegalText />}
    </Wrapper>
  )
}

export default LegalBanner
