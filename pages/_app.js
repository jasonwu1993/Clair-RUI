import { useEffect } from 'react'
import '../styles/globals.css'

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // Initialize any global configurations
    console.log('Enhanced RAG Application starting...')
  }, [])

  return <Component {...pageProps} />
}