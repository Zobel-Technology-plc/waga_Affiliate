// app/ClientSessionWrapper.tsx
'use client'; // Mark this as a Client Component

import { SessionProvider } from 'next-auth/react';

export default function ClientSessionWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
