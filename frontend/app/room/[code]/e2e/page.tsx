'use client';

import { Suspense } from 'react';
import RoomE2EClient from './RoomE2EClient';

export default function RoomE2EPage() {
  if (process.env.NEXT_PUBLIC_E2E !== '1') {
    return <div>Not available</div>;
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RoomE2EClient />
    </Suspense>
  );
}
