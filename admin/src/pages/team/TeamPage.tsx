import { useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, User } from 'lucide-react';
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
  useTeam,
  useCreateTeamMember,
  useUpdateTeamMember,
  useDeleteTeamMember,
  useReorderTeam,
  useClubs,
} from '@/hooks';
import { TeamMemberFormModal, type TeamMemberFormData } from './TeamMemberFormModal';
import type { TeamMember } from '@/types';

export function TeamPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  // Queries
  const { data, isLoading, isError } = useTeam({ page_size: 100 });
  const { data: clubsData } = useClubs({ page_size: 100 });

  // Mutations
  const createMember = useCreateTeamMember();
  const updateMember = useUpdateTeamMember();
  const deleteMember = useDeleteTeamMember();
  const reorderTeam = useReorderTeam();

  const members = data?.items || [];
  const clubs = clubsData?.items || [];

  // Handlers
  const handleCreate = () => {
    setSelectedMember(null);
    setIsFormOpen(true);
  };

  const handleEdit = (member: TeamMember) => {
    setSelectedMember(member);
    setIsFormOpen(true);
  };

  const handleDelete = (member: TeamMember) => {
    setSelectedMember(member);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (formData: TeamMemberFormData) => {
    if (selectedMember) {
      await updateMember.mutateAsync({ id: selectedMember.id, data: formData });
    } else {
      await createMember.mutateAsync(formData);
    }
    setIsFormOpen(false);
    setSelectedMember(null);
  };

  const handleDeleteConfirm = async () => {
    if (selectedMember) {
      await deleteMember.mutateAsync(selectedMember.id);
      setIsDeleteOpen(false);
      setSelectedMember(null);
    }
  };

  const handleReorder = useCallback(
    (ids: number[]) => {
      reorderTeam.mutate(ids);
    },
    [reorderTeam]
  );

  const handleToggleVisible = useCallback(
    async (member: TeamMember) => {
      await updateMember.mutateAsync({
        id: member.id,
        data: { ...member, is_visible: !member.is_visible },
      });
    },
    [updateMember]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Команда</h1>
          <p className="text-gray-500">
            Всего: {members.length} • Перетащите для изменения порядка
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
              description="Не удалось загрузить список участников"
            />
          ) : members.length === 0 ? (
            <EmptyState
              title="Участников нет"
              description="Добавьте первого участника команды"
              action={
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4" />
                  Добавить участника
                </Button>
              }
            />
          ) : (
            <SortableList
              items={members}
              onReorder={handleReorder}
              layout="grid"
              className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              renderItem={(member) => (
                <MemberCard
                  member={member}
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
      <TeamMemberFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        isLoading={createMember.isPending || updateMember.isPending}
        member={selectedMember}
        clubs={clubs}
      />

      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDeleteConfirm}
        itemName={selectedMember?.name}
        isLoading={deleteMember.isPending}
      />
    </div>
  );
}

interface MemberCardProps {
  member: TeamMember;
  onEdit: (member: TeamMember) => void;
  onDelete: (member: TeamMember) => void;
  onToggleVisible: (member: TeamMember) => void;
}

function MemberCard({ member, onEdit, onDelete, onToggleVisible }: MemberCardProps) {
  return (
    <div className="group rounded-lg border bg-white overflow-hidden pl-8">
      {/* Photo */}
      <div className="aspect-square bg-gray-100 relative">
        {member.photo ? (
          <img
            src={member.photo}
            alt={member.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="h-16 w-16 text-gray-300" />
          </div>
        )}

        {/* Status */}
        {!member.is_visible && (
          <div className="absolute top-2 left-2">
            <Badge variant="gray">Скрыт</Badge>
          </div>
        )}

        {/* Badge */}
        {member.badge && (
          <div className="absolute top-2 right-2">
            <Badge variant="purple">{member.badge}</Badge>
          </div>
        )}

        {/* Actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(member)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8"
            onClick={() => onToggleVisible(member)}
          >
            {member.is_visible ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 text-accent-red hover:text-accent-red"
            onClick={() => onDelete(member)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 text-center">
        <h3 className="font-medium text-gray-900 truncate">{member.name}</h3>
        {member.role && (
          <p className="text-sm text-gray-500 truncate">{member.role}</p>
        )}
        {member.club_name && (
          <Badge variant="default" className="mt-2 text-xs">
            {member.club_name}
          </Badge>
        )}
      </div>
    </div>
  );
}
