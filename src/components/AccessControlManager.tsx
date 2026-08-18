import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSchoolPermissions, saveSchoolPermissions } from '../lib/services';
import { ShieldAlert, Lock } from 'lucide-react';

export type UserRoleType =
  | 'SUPER_ADMIN'
  | 'SCHOOL_ADMIN'
  | 'ADMIN'
  | 'VICE_PRINCIPAL'
  | 'EXAM_OFFICER'
  | 'ACCOUNTANT'
  | 'TEACHER'
  | 'STUDENT'
  | 'PARENT';

export interface AccessControlContextType {
  schoolId: string;
  userRole: UserRoleType;
  permissions: string[];
  rolePermissionsMap: Record<string, string[]>;
  hasPermission: (permissionKey: string) => boolean;
  updateRolePermissions: (role: string, newPermissions: string[]) => Promise<void>;
  loading: boolean;
  refreshPermissions: () => Promise<void>;
}

const AccessControlContext = createContext<AccessControlContextType | undefined>(undefined);

interface ProviderProps {
  schoolId: string;
  userRole?: UserRoleType;
  children: ReactNode;
}

export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ['*'],
  SCHOOL_ADMIN: ['*'],
  ADMIN: ['*'],
  VICE_PRINCIPAL: [
    'results.edit',
    'results.approve',
    'students.edit',
    'students.promote',
    'attendance.mark',
    'reports.generate',
    'teachers.manage',
    'assignments.manage'
  ],
  EXAM_OFFICER: [
    'results.edit',
    'results.approve',
    'reports.generate',
    'exam.setup'
  ],
  ACCOUNTANT: [
    'fees.manage',
    'expenses.manage',
    'reports.generate',
    'reports.finance'
  ],
  TEACHER: [
    'results.edit',
    'attendance.mark',
    'assignments.manage',
    'reports.generate'
  ],
  STUDENT: [
    'reports.generate'
  ],
  PARENT: [
    'reports.generate',
    'fees.manage'
  ]
};

export const AccessControlProvider: React.FC<ProviderProps> = ({
  schoolId,
  userRole = 'ADMIN',
  children
}) => {
  const [rolePermissionsMap, setRolePermissionsMap] = useState<Record<string, string[]>>(DEFAULT_ROLE_PERMISSIONS);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const fetched = await getSchoolPermissions(schoolId);
      setRolePermissionsMap(prev => ({
        ...DEFAULT_ROLE_PERMISSIONS,
        ...fetched
      }));
    } catch (err) {
      console.error('Error loading access control permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (schoolId) {
      fetchPermissions();
    } else {
      setLoading(false);
    }
  }, [schoolId]);

  const currentRolePerms = rolePermissionsMap[userRole] || DEFAULT_ROLE_PERMISSIONS[userRole] || [];

  const hasPermission = (permissionKey: string): boolean => {
    if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'SCHOOL_ADMIN') return true;
    if (currentRolePerms.includes('*')) return true;
    return currentRolePerms.includes(permissionKey);
  };

  const updateRolePermissions = async (role: string, newPermissions: string[]) => {
    const updatedMap = {
      ...rolePermissionsMap,
      [role]: newPermissions
    };
    setRolePermissionsMap(updatedMap);
    await saveSchoolPermissions(schoolId, updatedMap);
  };

  return (
    <AccessControlContext.Provider
      value={{
        schoolId,
        userRole,
        permissions: currentRolePerms,
        rolePermissionsMap,
        hasPermission,
        updateRolePermissions,
        loading,
        refreshPermissions: fetchPermissions
      }}
    >
      {children}
    </AccessControlContext.Provider>
  );
};

export const useAccessControl = () => {
  const context = useContext(AccessControlContext);
  if (!context) {
    return {
      schoolId: '',
      userRole: 'ADMIN' as UserRoleType,
      permissions: ['*'],
      rolePermissionsMap: DEFAULT_ROLE_PERMISSIONS,
      hasPermission: () => true,
      updateRolePermissions: async () => {},
      loading: false,
      refreshPermissions: async () => {}
    };
  }
  return context;
};

/**
 * Custom React hook 'usePermissions' to check authorization
 */
export const usePermissions = () => {
  const { hasPermission, permissions, userRole, loading } = useAccessControl();
  return {
    hasPermission,
    can: hasPermission,
    check: (permissionKey: string) => hasPermission(permissionKey),
    permissions,
    userRole,
    loading
  };
};

/**
 * AccessControlManager utility mapping user roles to permission keys
 */
export const AccessControlManager = {
  DEFAULT_ROLE_PERMISSIONS,
  hasPermission: (
    role: UserRoleType | string,
    permissionKey: string,
    customMap?: Record<string, string[]>
  ): boolean => {
    if (role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'SCHOOL_ADMIN') return true;
    const map = customMap || DEFAULT_ROLE_PERMISSIONS;
    const perms = map[role] || [];
    if (perms.includes('*')) return true;
    return perms.includes(permissionKey);
  },
  getPermissionsForRole: (
    role: UserRoleType | string,
    customMap?: Record<string, string[]>
  ): string[] => {
    const map = customMap || DEFAULT_ROLE_PERMISSIONS;
    return map[role] || [];
  }
};

interface ProtectProps {
  permission: string;
  fallback?: ReactNode;
  children: ReactNode;
  showBadgeIfDenied?: boolean;
}

export const Protect: React.FC<ProtectProps> = ({
  permission,
  fallback,
  children,
  showBadgeIfDenied = false
}) => {
  const { hasPermission } = useAccessControl();

  if (hasPermission(permission)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showBadgeIfDenied) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-medium">
        <Lock className="w-3.5 h-3.5" />
        <span>Action Restricted ({permission})</span>
      </div>
    );
  }

  return null;
};

/**
 * Wrapper component to conditionally hide UI elements based on permission or role
 */
export interface PermissionWrapperProps {
  permission?: string;
  role?: UserRoleType;
  children: ReactNode;
  fallback?: ReactNode;
  showBadgeIfDenied?: boolean;
}

export const PermissionWrapper: React.FC<PermissionWrapperProps> = ({
  permission,
  role,
  children,
  fallback = null,
  showBadgeIfDenied = false
}) => {
  const { hasPermission, userRole } = useAccessControl();

  let isAllowed = true;
  if (role) {
    isAllowed = userRole === 'SUPER_ADMIN' || userRole === role;
  }
  if (isAllowed && permission) {
    isAllowed = hasPermission(permission);
  }

  if (isAllowed) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showBadgeIfDenied) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-medium">
        <Lock className="w-3.5 h-3.5" />
        <span>Action Restricted ({permission || role})</span>
      </div>
    );
  }

  return null;
};

export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: string,
  FallbackComponent?: React.ComponentType
) {
  return function ProtectedComponent(props: P) {
    const { hasPermission } = useAccessControl();
    if (!hasPermission(permission)) {
      if (FallbackComponent) {
        return <FallbackComponent />;
      }
      return (
        <div className="p-8 text-center bg-[#0f111a] border border-amber-800/40 rounded-2xl">
          <ShieldAlert className="w-8 h-8 text-amber-400 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-white">Access Restricted</h4>
          <p className="text-xs text-slate-400 mt-1">
            Your role does not have required authorization ({permission}).
          </p>
        </div>
      );
    }
    return <Component {...props} />;
  };
}
