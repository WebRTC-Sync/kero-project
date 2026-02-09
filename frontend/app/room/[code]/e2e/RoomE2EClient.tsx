'use client';

import { useSearchParams } from 'next/navigation';

export default function RoomE2EClient() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');

  if (mode === 'quiz') {
    return (
      <div className="flex flex-col lg:flex-row h-screen w-full">
        <div data-testid="quiz-main-content" className="flex-1 bg-blue-100 p-4">
          Quiz Main
        </div>
        <aside data-testid="quiz-camera-panel" className="w-full lg:w-80 h-40 lg:h-full bg-red-100 p-4 shrink-0">
          Camera
        </aside>
      </div>
    );
  }

  if (mode === 'perfect') {
    return (
      <div className="flex flex-col lg:flex-row h-screen w-full" data-testid="perfect-layout-shell">
        <div data-testid="perfect-main-content" className="flex-1 bg-green-100 p-4 relative">
          Perfect Main
          <div data-testid="perfect-judgment-bar">Judgment Bar</div>
        </div>
        <aside data-testid="perfect-camera-panel" className="w-full lg:w-80 h-40 lg:h-full bg-yellow-100 p-4 shrink-0">
          <div data-testid="perfect-turn-sidebar">Turn Sidebar</div>
          Camera
        </aside>
      </div>
    );
  }

  return <div>Unknown mode: {mode}</div>;
}
