import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function AuthCallback() {
  const router = useRouter();
  const [content, setContent] = useState('Loading...');

  useEffect(() => {
    if (!router.isReady) return;

    const flow = router.query.flow as string | undefined;

    if (flow === 'recovery') {
      window.location.href = 'studique://auth-callback?flow=recovery';
    } else if (flow === 'signup') {
      window.location.href = 'studique://auth-callback?flow=signup';
    } else {
      setContent('Done! Return to the Studique app to continue.');
    }
  }, [router.isReady, router.query.flow]);

  return (
    <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'sans-serif', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <h1>{content === 'Loading...' ? 'Loading...' : 'Done!'}</h1>
      {content !== 'Loading...' && (
        <p>{content.split(' Return')[1] ? 'Return to the Studique app to continue.' : content}</p>
      )}
    </div>
  );
}
