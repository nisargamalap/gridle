// src/app/page.jsx
"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // This effect ensures we only act when directly at the root path '/'
    if (pathname === '/') {
      const token = localStorage.getItem('gridle_auth_token'); // Check for authentication token
      
      let destinationPath;
      if (token) {
        destinationPath = '/dashboard'; // If authenticated, go to dashboard
      } else {
        destinationPath = '/signin'; // If not authenticated, go to sign-in
      }

      // Only redirect if we are currently at '/' AND not already trying to go to '/'
      if (pathname !== destinationPath) {
        router.replace(destinationPath);
      }
    }
  }, [router, pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
      <p>Redirecting...</p>
    </div>
  );
}