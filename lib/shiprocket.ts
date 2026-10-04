import { unstable_cache } from 'next/cache';

export const getShiprocketToken = unstable_cache(
  async () => {
    const response = await fetch(`${process.env.SHIPROCKET_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.SHIPROCKET_API_EMAIL,
        password: process.env.SHIPROCKET_API_PASSWORD,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to authenticate with Shiprocket');
    }

    const data = await response.json();
    return data.token as string;
  },
  ['shiprocket-token'], // Cache key
  {
    revalidate: 60 * 60 * 24 * 9, // Revalidate every 9 days (in seconds)
  }
);
