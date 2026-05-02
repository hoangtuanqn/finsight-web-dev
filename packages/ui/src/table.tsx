import * as React from 'react';

export const Table = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className="w-full overflow-auto">
    <table className={`w-full caption-bottom text-sm ${className || ''}`}>{children}</table>
  </div>
);

export const TableHeader = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <thead className={`[&_tr]:border-b ${className || ''}`}>{children}</thead>
);

export const TableBody = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <tbody className={`[&_tr:last-child]:border-0 ${className || ''}`}>{children}</tbody>
);

export const TableRow = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <tr
    className={`border-b transition-colors hover:bg-slate-800/50 data-[state=selected]:bg-slate-800 ${className || ''}`}
  >
    {children}
  </tr>
);

export const TableHead = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <th
    className={`h-12 px-4 text-left align-middle font-medium text-slate-400 [&:has([role=checkbox])]:pr-0 ${className || ''}`}
  >
    {children}
  </th>
);

export const TableCell = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <td className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className || ''}`}>{children}</td>
);
