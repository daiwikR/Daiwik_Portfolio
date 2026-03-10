import { useState } from 'react'
import Boot from './components/Boot/Boot'
import Desktop from './components/Desktop/Desktop'

export default function App() {
  const [booted, setBooted] = useState(false)

  return (
    <>
      {!booted && <Boot onComplete={() => setBooted(true)} />}
      {booted && <Desktop />}
    </>
  )
}
