'use client';
// Status badge component
export function StatusBadge({ status }: { status: string }) {
  const getStatusColor = () => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-500/10 text-blue-400 ring-blue-500/20';
      case 'IN_PROGRESS':
        return 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20';
      case 'COMPLETED':
        return 'bg-green-500/10 text-green-400 ring-green-500/20';
      case 'CANCELLED':
        return 'bg-red-500/10 text-red-400 ring-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 ring-gray-500/20';
    }
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor()}`}
    >
      {status}
    </span>
  );
}
