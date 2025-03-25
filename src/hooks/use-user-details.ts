// hooks/useUserGithubToken.ts
'use client';

import { useState, useEffect } from 'react';

export function useUserGithubToken() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await fetch('/api/token', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            }
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch user token');
        }
        
        const data = await response.json();
        setToken(data.token);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, []);

  return { token, loading, error };
}