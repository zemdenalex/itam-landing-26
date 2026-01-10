import { useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, ExternalLink, Building2 } from 'lucide-react';
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
  usePartners,
  useCreatePartner,
  useUpdatePartner,
  useDeletePartner,
  useReorderPartners,
} from '@/hooks';
import { PartnerFormModal, type PartnerFormData } from './PartnerFormModal';
import type { Partner } from '@/types';

export function PartnersPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  // Queries
  const { data, isLoading, isError } = usePartners({ page_size: 100 });

  // Mutations
  const createPartner = useCreatePartner();
  const updatePartner = useUpdatePartner();
  const deletePartner = useDeletePartner();
  const reorderPartners = useReorderPartners();

  const partners = data?.items || [];

  // Handlers
  const handleCreate = () => {
    setSelectedPartner(null);
    setIsFormOpen(true);
  };

  const handleEdit = (partner: Partner) => {
    setSelectedPartner(partner);
    setIsFormOpen(true);
  };

  const handleDelete = (partner: Partner) => {
    setSelectedPartner(partner);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (formData: PartnerFormData) => {
    if (selectedPartner) {
      await updatePartner.mutateAsync({ id: selectedPartner.id, data: formData });
    } else {
      await createPartner.mutateAsync(formData);
    }
    setIsFormOpen(false);
    setSelectedPartner(null);
  };

  const handleDeleteConfirm = async () => {
    if (selectedPartner) {
      await deletePartner.mutateAsync(selectedPartner.id);
      setIsDeleteOpen(false);
      setSelectedPartner(null);
    }
  };

  const handleReorder = useCallback(
    (ids: number[]) => {
      reorderPartners.mutate(ids);
    },
    [reorderPartners]
  );

  const handleToggleVisible = useCallback(
    async (partner: Partner) => {
      await updatePartner.mutateAsync({
        id: partner.id,
        data: { ...partner, is_visible: !partner.is_visible },
      });
    },
    [updatePartner]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Партнёры</h1>
          <p className="text-gray-500">
            Всего: {partners.length} • Перетащите для изменения порядка
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
              description="Не удалось загрузить список партнёров"
            />
          ) : partners.length === 0 ? (
            <EmptyState
              title="Партнёров нет"
              description="Добавьте первого партнёра"
              action={
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4" />
                  Добавить партнёра
                </Button>
              }
            />
          ) : (
            <SortableList
              items={partners}
              onReorder={handleReorder}
              layout="grid"
              className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              renderItem={(partner) => (
                <PartnerCard
                  partner={partner}
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
      <PartnerFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        isLoading={createPartner.isPending || updatePartner.isPending}
        partner={selectedPartner}
      />

      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDeleteConfirm}
        itemName={selectedPartner?.name}
        isLoading={deletePartner.isPending}
      />
    </div>
  );
}

interface PartnerCardProps {
  partner: Partner;
  onEdit: (partner: Partner) => void;
  onDelete: (partner: Partner) => void;
  onToggleVisible: (partner: Partner) => void;
}

function PartnerCard({ partner, onEdit, onDelete, onToggleVisible }: PartnerCardProps) {
  return (
    <div className="group rounded-lg border bg-white overflow-hidden pl-8">
      {/* Logo */}
      <div className="aspect-[3/2] bg-gray-50 relative flex items-center justify-center p-4">
        {partner.logo_svg ? (
          <img
            src={partner.logo_svg}
            alt={partner.name}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <Building2 className="h-12 w-12 text-gray-300" />
        )}

        {/* Status */}
        {!partner.is_visible && (
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
            onClick={() => onEdit(partner)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8"
            onClick={() => onToggleVisible(partner)}
          >
            {partner.is_visible ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 text-accent-red hover:text-accent-red"
            onClick={() => onDelete(partner)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-900 truncate flex-1">{partner.name}</h3>
          {partner.website && (
            <a
              href={partner.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-primary flex-shrink-0"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
