import { useEffect, useState } from 'react'

const useWindowSpecs = (): { innerWidth: number; innerHeight: number } => {
  const isClient = typeof window === 'object'

  function getSize(): { innerWidth: number | undefined; innerHeight: number | undefined } {
    return {
      innerWidth: isClient ? window.innerWidth : undefined,
      innerHeight: isClient ? window.innerHeight : undefined,
    }
  }

  const [innerWindowSpecs, setInnerWindowSpecs] = useState(getSize)
  function handleResize(): void | number {
    // check that client can handle this sexiness
    const innerWidth = typeof window !== 'object' ? null : window.innerWidth
    const innerHeight = typeof window !== 'object' ? null : window.innerHeight
    return setInnerWindowSpecs({ innerWidth, innerHeight })
  }
  useEffect(() => {
    window.addEventListener('resize', handleResize)
    return (): void => window.removeEventListener('resize', handleResize)
  }, [])
  return innerWindowSpecs
}

export default useWindowSpecs
