export const PERMISSIONS = {
  'debt:read': ['personal', 'enterprise'],
  'debt:write': ['personal', 'enterprise'],
  'debt:approve': ['enterprise'],
  'debt:multi-entity': ['enterprise'],
  'org:manage': ['enterprise'],
  'report:export-pdf': ['enterprise'],
} as const;

export type Permission = keyof typeof PERMISSIONS;
export type Role = (typeof PERMISSIONS)[Permission][number];

export function can(role: Role, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}
