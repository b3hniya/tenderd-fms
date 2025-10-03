'use client';
export function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg bg-gray-900 p-4 ring-1 ring-white/10 shadow-xl">
        <p className="text-sm font-medium text-white mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm text-gray-400">
            <span style={{ color: entry.color }}>{entry.name}: </span>
            <span className="font-semibold text-white">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
}
