import { useState } from 'react';
import { Plus, Pencil, Trash2, Shield, User as UserIcon } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Loading,
  EmptyState,
  Badge,
  DeleteConfirmDialog,
  Input,
  Select,
} from '@/components/ui';
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from '@/hooks';
import { useAuthStore } from '@/store/authStore';
import { UserFormModal, type UserFormData } from './UserFormModal';
import { formatDateTime } from '@/utils/formatters';
import type { User } from '@/types';

const roleFilterOptions = [
  { value: '', label: 'Все роли' },
  { value: 'admin', label: 'Администраторы' },
  { value: 'editor', label: 'Редакторы' },
];

export function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Queries
  const { data, isLoading, isError } = useUsers({
    page_size: 100,
    search: search || undefined,
    role: roleFilter as 'admin' | 'editor' | '' || undefined,
  });

  // Mutations
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const users = data?.users || [];

  // Handlers
  const handleCreate = () => {
    setSelectedUser(null);
    setIsFormOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (formData: UserFormData) => {
    if (selectedUser) {
      await updateUser.mutateAsync({ id: selectedUser.id, data: formData });
    } else {
      await createUser.mutateAsync(formData as Required<UserFormData>);
    }
    setIsFormOpen(false);
    setSelectedUser(null);
  };

  const handleDeleteConfirm = async () => {
    if (selectedUser) {
      await deleteUser.mutateAsync(selectedUser.id);
      setIsDeleteOpen(false);
      setSelectedUser(null);
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return (
        <Badge variant="default" className="gap-1">
          <Shield className="h-3 w-3" />
          Админ
        </Badge>
      );
    }
    return (
      <Badge variant="gray" className="gap-1">
        <UserIcon className="h-3 w-3" />
        Редактор
      </Badge>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <Badge variant="success">Активен</Badge>;
    }
    return <Badge variant="gray">Неактивен</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Пользователи</h1>
          <p className="text-gray-500">Всего: {data?.total || 0}</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          Добавить
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <Input
                placeholder="Поиск по email или имени..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="sm:w-48">
              <Select
                value={roleFilter}
                onChange={setRoleFilter}
                options={roleFilterOptions}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <Loading />
          ) : isError ? (
            <EmptyState
              title="Ошибка загрузки"
              description="Не удалось загрузить список пользователей"
            />
          ) : users.length === 0 ? (
            <EmptyState
              title="Пользователей нет"
              description={search || roleFilter ? 'Попробуйте изменить фильтры' : 'Добавьте первого пользователя'}
              action={
                !search && !roleFilter ? (
                  <Button onClick={handleCreate}>
                    <Plus className="h-4 w-4" />
                    Добавить пользователя
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Имя</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Создан</TableHead>
                  <TableHead className="w-[100px]">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {user.email}
                        {user.id === currentUser?.id && (
                          <Badge variant="outline" className="text-xs">
                            Вы
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatusBadge(user.is_active)}</TableCell>
                    <TableCell className="text-gray-500">
                      {formatDateTime(user.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(user)}
                          title="Редактировать"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-accent-red hover:text-accent-red"
                          onClick={() => handleDelete(user)}
                          disabled={user.id === currentUser?.id}
                          title={user.id === currentUser?.id ? 'Нельзя удалить себя' : 'Удалить'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <UserFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        isLoading={createUser.isPending || updateUser.isPending}
        user={selectedUser}
        currentUserId={currentUser?.id}
      />

      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDeleteConfirm}
        itemName={selectedUser?.email}
        isLoading={deleteUser.isPending}
      />
    </div>
  );
}
