import { useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, Users, Calendar, Trophy, Building2 } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  Loading,
  EmptyState,
  Badge,
  DeleteConfirmDialog,
  SortableList,
} from '@/components/ui';
import {
  useClubs,
  useCreateClub,
  useUpdateClub,
  useDeleteClub,
  useReorderClubs,
} from '@/hooks';
import { ClubFormModal, type ClubFormData } from './ClubFormModal';
import type { Club } from '@/types';

export function ClubsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);

  // Queries
  const { data, isLoading, isError } = useClubs({ page_size: 100 });

  // Mutations
  const createClub = useCreateClub();
  const updateClub = useUpdateClub();
  const deleteClub = useDeleteClub();
  const reorderClubs = useReorderClubs();

  const clubs = data?.items || [];

  // Handlers
  const handleCreate = () => {
    setSelectedClub(null);
    setIsFormOpen(true);
  };

  const handleEdit = (club: Club) => {
    setSelectedClub(club);
    setIsFormOpen(true);
  };

  const handleDelete = (club: Club) => {
    setSelectedClub(club);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (formData: ClubFormData) => {
    if (selectedClub) {
      await updateClub.mutateAsync({ id: selectedClub.id, data: formData });
    } else {
      await createClub.mutateAsync(formData);
    }
    setIsFormOpen(false);
    setSelectedClub(null);
  };

  const handleDeleteConfirm = async () => {
    if (selectedClub) {
      await deleteClub.mutateAsync(selectedClub.id);
      setIsDeleteOpen(false);
      setSelectedClub(null);
    }
  };

  const handleReorder = useCallback(
    (ids: number[]) => {
      reorderClubs.mutate(ids);
    },
    [reorderClubs]
  );

  const handleToggleVisible = useCallback(
    async (club: Club) => {
      await updateClub.mutateAsync({
        id: club.id,
        data: { ...club, is_visible: !club.is_visible },
      });
    },
    [updateClub]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Клубы</h1>
          <p className="text-gray-500">
            Всего: {clubs.length} • Перетащите для изменения порядка
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          Добавить
        </Button>
      </div>

      {/* Content */}
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <Loading />
          ) : isError ? (
            <EmptyState
              title="Ошибка загрузки"
              description="Не удалось загрузить список клубов"
            />
          ) : clubs.length === 0 ? (
            <EmptyState
              title="Клубов нет"
              description="Добавьте первый клуб"
              action={
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4" />
                  Добавить клуб
                </Button>
              }
            />
          ) : (
            <SortableList
              items={clubs}
              onReorder={handleReorder}
              layout="grid"
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              renderItem={(club) => (
                <ClubCard
                  club={club}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleVisible={handleToggleVisible}
                />
              )}
            />
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <ClubFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        isLoading={createClub.isPending || updateClub.isPending}
        club={selectedClub}
      />

      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDeleteConfirm}
        itemName={selectedClub?.name}
        isLoading={deleteClub.isPending}
      />
    </div>
  );
}

interface ClubCardProps {
  club: Club;
  onEdit: (club: Club) => void;
  onDelete: (club: Club) => void;
  onToggleVisible: (club: Club) => void;
}

function ClubCard({ club, onEdit, onDelete, onToggleVisible }: ClubCardProps) {
  return (
    <div className="group rounded-lg border bg-white overflow-hidden pl-8">
      {/* Cover */}
      <div className="aspect-video bg-gray-100 relative">
        {club.cover_image ? (
          <img
            src={club.cover_image}
            alt={club.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 className="h-12 w-12 text-gray-300" />
          </div>
        )}

        {/* Status */}
        {!club.is_visible && (
          <div className="absolute top-2 left-2">
            <Badge variant="gray">Скрыт</Badge>
          </div>
        )}

        {/* Actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(club)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8"
            onClick={() => onToggleVisible(club)}
          >
            {club.is_visible ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 text-accent-red hover:text-accent-red"
            onClick={() => onDelete(club)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-medium text-gray-900 truncate">{club.name}</h3>
        {club.description && (
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">
            {club.description}
          </p>
        )}

        {/* Stats */}
        <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {club.members_count}
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {club.events_count}
          </div>
          <div className="flex items-center gap-1">
            <Trophy className="h-4 w-4" />
            {club.wins_count}
          </div>
        </div>
      </div>
    </div>
  );
}
