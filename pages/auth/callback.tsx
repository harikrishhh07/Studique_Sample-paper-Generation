import Head from 'next/head'
import { useEffect, useState } from 'react'

export default function AuthCallbackPage() {
  const [content, setContent] = useState({
    icon: '✅',
    title: 'Email verified!',
    message: 'Your email has been verified. Return to the Studique app on your phone to continue.',
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const hash = window.location.hash
    const flow = params.get('flow')
    let code = params.get('code')

    if (!code && hash) {
      const hashParams = new URLSearchParams(hash.slice(1))
      code = hashParams.get('code')
    }

    const SUPABASE_URL = 'https://kfibweubdpngnuzjrxzv.supabase.co'
    const FUNC_URL = SUPABASE_URL + '/functions/v1/detect-recovery'

    if (flow === 'recovery' && code) {
      fetch(FUNC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: 'sb_publishable_GPPI3Hog3MB1aHoBEXLbUw_Ia5AsX5A',
        },
        body: JSON.stringify({ code, flow: 'recovery' }),
      }).catch(() => {})

      setContent({
        icon: '🔑',
        title: 'Reset link opened',
        message: 'Your phone has been notified. Open the Studique app to set your new password.',
      })
    } else {
      setContent({
        icon: '✅',
        title: 'Email verified!',
        message: 'Your email has been verified. Return to the Studique app on your phone to continue.',
      })
    }

    // Try to open app via custom scheme (same-device)
    window.location.href = 'studique://auth-callback' + window.location.search + window.location.hash
  }, [])

  return (
    <>
      <Head>
        <title>Studique</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          body {
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: #0a0a0a;
            color: #fff;
            text-align: center;
          }
          .container { max-width: 400px; padding: 40px 20px; }
          h1 { font-size: 24px; margin-bottom: 12px; }
          p { font-size: 16px; color: #999; line-height: 1.6; }
          .icon { font-size: 48px; margin-bottom: 24px; }
        `}</style>
      </Head>
      <div className="container">
        <div className="icon">{content.icon}</div>
        <h1>{content.title}</h1>
        <p>{content.message}</p>
      </div>
    </>
  )
}
