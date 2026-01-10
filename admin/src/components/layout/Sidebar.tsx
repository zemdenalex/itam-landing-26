import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Trophy,
  FolderKanban,
  Users,
  Newspaper,
  Handshake,
  Building2,
  FileText,
  UserCog,
  ScrollText,
  Send,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/store/authStore';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const mainNavItems: NavItem[] = [
  { label: 'Дашборд', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Победы', path: '/wins', icon: Trophy },
  { label: 'Проекты', path: '/projects', icon: FolderKanban },
  { label: 'Команда', path: '/team', icon: Users },
  { label: 'Новости', path: '/news', icon: Newspaper },
  { label: 'Партнёры', path: '/partners', icon: Handshake },
  { label: 'Клубы', path: '/clubs', icon: Building2 },
  { label: 'Блог', path: '/blog', icon: FileText },
];

const adminNavItems: NavItem[] = [
  { label: 'Пользователи', path: '/users', icon: UserCog, adminOnly: true },
  { label: 'Логи', path: '/logs', icon: ScrollText, adminOnly: true },
  { label: 'Telegram', path: '/telegram', icon: Send },
];

export function Sidebar() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';

  const filteredAdminItems = adminNavItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center px-6 border-b border-white/10">
          <span className="text-xl font-bold text-white">it.am</span>
          <span className="ml-2 text-xs text-gray-400">cms</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {mainNavItems.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </ul>

          {/* Divider */}
          <div className="my-4 border-t border-white/10" />

          <ul className="space-y-1">
            {filteredAdminItems.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-white/10 p-4">
          <p className="text-xs text-gray-500">ITAM CMS v1.0</p>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ item }: { item: NavItem }) {
  const Icon = item.icon;

  return (
    <li>
      <NavLink
        to={item.path}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            isActive
              ? 'bg-sidebar-active text-white'
              : 'text-gray-400 hover:bg-sidebar-hover hover:text-white'
          )
        }
      >
        <Icon className="h-5 w-5" />
        {item.label}
      </NavLink>
    </li>
  );
}
