import { LogOut, User } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/cn';

export function Header() {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div>
        {/* Breadcrumbs или title можно добавить позже */}
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                <User className="h-4 w-4" />
              </div>
              <span>{user?.name || 'Пользователь'}</span>
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className={cn(
                'z-50 min-w-[180px] overflow-hidden rounded-lg border border-gray-200 bg-white p-1 shadow-lg',
                'data-[state=open]:animate-in data-[state=closed]:animate-out',
                'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
                'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
                'data-[side=bottom]:slide-in-from-top-2'
              )}
              sideOffset={8}
              align="end"
            >
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {user?.role === 'admin' ? 'Администратор' : 'Редактор'}
                </p>
              </div>

              <DropdownMenu.Item
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-accent-red hover:bg-red-50 focus:bg-red-50 outline-none"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Выйти
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
