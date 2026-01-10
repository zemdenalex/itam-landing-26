import { useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, Image as ImageIcon } from 'lucide-react';
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
  useProjects,
  useTags,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useReorderProjects,
  useCreateTag,
} from '@/hooks';
import { ProjectFormModal, type ProjectFormData } from './ProjectFormModal';
import type { Project, Tag } from '@/types';

export function ProjectsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Queries
  const { data, isLoading, isError } = useProjects({ page_size: 100 });
  const { data: tags = [] } = useTags();

  // Mutations
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const reorderProjects = useReorderProjects();
  const createTag = useCreateTag();

  const projects = data?.items || [];

  // Handlers
  const handleCreate = () => {
    setSelectedProject(null);
    setIsFormOpen(true);
  };

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setIsFormOpen(true);
  };

  const handleDelete = (project: Project) => {
    setSelectedProject(project);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (formData: ProjectFormData) => {
    if (selectedProject) {
      await updateProject.mutateAsync({ id: selectedProject.id, data: formData });
    } else {
      await createProject.mutateAsync(formData);
    }
    setIsFormOpen(false);
    setSelectedProject(null);
  };

  const handleDeleteConfirm = async () => {
    if (selectedProject) {
      await deleteProject.mutateAsync(selectedProject.id);
      setIsDeleteOpen(false);
      setSelectedProject(null);
    }
  };

  const handleReorder = useCallback(
    (ids: number[]) => {
      reorderProjects.mutate(ids);
    },
    [reorderProjects]
  );

  const handleCreateTag = useCallback(
    async (name: string): Promise<Tag> => {
      const result = await createTag.mutateAsync(name);
      return result;
    },
    [createTag]
  );

  const handleTogglePublish = useCallback(
    async (project: Project) => {
      await updateProject.mutateAsync({
        id: project.id,
        data: { ...project, is_published: !project.is_published },
      });
    },
    [updateProject]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Проекты</h1>
          <p className="text-gray-500">
            Всего: {projects.length} • Перетащите для изменения порядка
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
              description="Не удалось загрузить список проектов"
            />
          ) : projects.length === 0 ? (
            <EmptyState
              title="Проектов нет"
              description="Добавьте первый проект"
              action={
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4" />
                  Добавить проект
                </Button>
              }
            />
          ) : (
            <SortableList
              items={projects}
              onReorder={handleReorder}
              layout="grid"
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              renderItem={(project) => (
                <ProjectCard
                  project={project}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onTogglePublish={handleTogglePublish}
                />
              )}
            />
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <ProjectFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        isLoading={createProject.isPending || updateProject.isPending}
        project={selectedProject}
        tags={tags}
        onCreateTag={handleCreateTag}
      />

      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDeleteConfirm}
        itemName={selectedProject?.title}
        isLoading={deleteProject.isPending}
      />
    </div>
  );
}

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onTogglePublish: (project: Project) => void;
}

function ProjectCard({ project, onEdit, onDelete, onTogglePublish }: ProjectCardProps) {
  return (
    <div className="group rounded-lg border bg-white overflow-hidden pl-8">
      {/* Image */}
      <div className="aspect-video bg-gray-100 relative">
        {project.cover_image ? (
          <img
            src={project.cover_image}
            alt={project.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-gray-300" />
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-2 left-2">
          <Badge variant={project.is_published ? 'success' : 'gray'}>
            {project.is_published ? 'Опубликован' : 'Черновик'}
          </Badge>
        </div>

        {/* Actions overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(project)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8"
            onClick={() => onTogglePublish(project)}
          >
            {project.is_published ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 text-accent-red hover:text-accent-red"
            onClick={() => onDelete(project)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-medium text-gray-900 truncate">{project.title}</h3>
        {project.description && (
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">
            {project.description}
          </p>
        )}
        {project.tags && project.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {project.tags.map((tag) => (
              <Badge key={tag.id} variant="gray" className="text-xs">
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
