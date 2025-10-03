'use client';
export function ConnectionBadge({ status, lastSeenAt }: { status: string; lastSeenAt?: string }) {
  const isOnline = status === 'ONLINE';
  const isOffline = status === 'OFFLINE';

  return (
    <span className="inline-flex items-center gap-x-1.5 rounded-full px-2 py-1 text-xs font-medium">
      <svg
        viewBox="0 0 6 6"
        aria-hidden="true"
        className={`size-1.5 ${isOnline ? 'fill-green-500' : isOffline ? 'fill-red-500' : 'fill-yellow-500'}`}
      >
        <circle r={3} cx={3} cy={3} />
      </svg>
      <span
        className={isOnline ? 'text-green-400' : isOffline ? 'text-red-400' : 'text-yellow-400'}
      >
        {isOnline ? 'Online' : isOffline ? 'Offline' : 'Stale'}
      </span>
    </span>
  );
}
