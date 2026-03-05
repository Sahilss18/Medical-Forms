import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/utils/helpers';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard,
  FileText,
  Building2,
  Award,
  Users,
  ClipboardCheck,
  FolderOpen,
  Database,
  GitBranch,
  ShieldCheck,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles?: string[];
}

const navigationItems: NavItem[] = [
  // Applicant Routes
  {
    label: 'Dashboard',
    path: '/applicant/dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
    roles: ['applicant'],
  },
  {
    label: 'Institution Profile',
    path: '/applicant/institution',
    icon: <Building2 className="h-5 w-5" />,
    roles: ['applicant'],
  },
  {
    label: 'New Application',
    path: '/applicant/forms',
    icon: <FileText className="h-5 w-5" />,
    roles: ['applicant'],
  },
  {
    label: 'My Applications',
    path: '/applicant/applications',
    icon: <FolderOpen className="h-5 w-5" />,
    roles: ['applicant'],
  },
  {
    label: 'Certificates',
    path: '/applicant/certificates',
    icon: <Award className="h-5 w-5" />,
    roles: ['applicant'],
  },

  // Inspector Routes
  {
    label: 'Dashboard',
    path: '/inspector/dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
    roles: ['inspector'],
  },
  {
    label: 'Assigned Inspections',
    path: '/inspector/inspections',
    icon: <ClipboardCheck className="h-5 w-5" />,
    roles: ['inspector'],
  },

  // Officer Routes
  {
    label: 'Dashboard',
    path: '/officer/dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
    roles: ['officer'],
  },
  {
    label: 'All Applications',
    path: '/officer/applications',
    icon: <FolderOpen className="h-5 w-5" />,
    roles: ['officer'],
  },

  // Admin Routes
  {
    label: 'Dashboard',
    path: '/admin/dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
    roles: ['admin'],
  },
  {
    label: 'Inspectors',
    path: '/admin/inspectors',
    icon: <Users className="h-5 w-5" />,
    roles: ['admin'],
  },
  {
    label: 'Users',
    path: '/admin/users',
    icon: <Users className="h-5 w-5" />,
    roles: ['admin'],
  },
  {
    label: 'Jurisdictions',
    path: '/admin/jurisdictions',
    icon: <GitBranch className="h-5 w-5" />,
    roles: ['admin'],
  },
  {
    label: 'Licensing Offices',
    path: '/admin/offices',
    icon: <Building2 className="h-5 w-5" />,
    roles: ['admin'],
  },
  {
    label: 'Forms Management',
    path: '/admin/forms',
    icon: <FileText className="h-5 w-5" />,
    roles: ['admin'],
  },
  {
    label: 'Applications',
    path: '/admin/applications',
    icon: <ShieldCheck className="h-5 w-5" />,
    roles: ['admin'],
  },
  {
    label: 'System Logs',
    path: '/admin/logs',
    icon: <Database className="h-5 w-5" />,
    roles: ['admin'],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();

  const filteredNavItems = navigationItems.filter(
    (item) => 
      !item.roles || 
      (user?.role && item.roles.some(role => role.toUpperCase() === user.role.toUpperCase()))
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-6 border-b border-gray-200">
            <h1 className="text-lg font-bold text-primary-600">
              Medical Portal
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <ul className="space-y-1">
              {filteredNavItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      )
                    }
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        onClose();
                      }
                    }}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* User Info */}
          {user && (
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-700 font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="ml-3 overflow-hidden">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate capitalize">
                    {user.role}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
