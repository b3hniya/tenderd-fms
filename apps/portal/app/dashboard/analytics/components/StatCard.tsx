'use client';
export function StatCard({
  name,
  value,
  change,
  changeType,
  icon: Icon,
}: {
  name: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease';
  icon: any;
}) {
  return (
    <div className="overflow-hidden rounded-lg bg-gray-900 px-4 py-5 ring-1 ring-white/10 sm:p-6">
      <div className="flex items-center">
        <div className="shrink-0">
          <Icon className="size-8 text-indigo-400" aria-hidden="true" />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="truncate text-sm font-medium text-gray-400">{name}</dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-white">{value}</div>
              {change && (
                <div
                  className={`ml-2 flex items-baseline text-sm font-semibold ${changeType === 'increase' ? 'text-green-400' : 'text-red-400'}`}
                >
                  {change}
                </div>
              )}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  );
}
