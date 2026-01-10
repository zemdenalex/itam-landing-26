import { useState, useCallback } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Badge, Input } from '@/components/ui';
import type { Tag } from '@/types';

interface TagsInputProps {
  value: number[];
  onChange: (value: number[]) => void;
  tags: Tag[];
  onCreateTag: (name: string) => Promise<Tag>;
  disabled?: boolean;
}

export function TagsInput({
  value,
  onChange,
  tags,
  onCreateTag,
  disabled = false,
}: TagsInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const selectedTags = tags.filter((tag) => value.includes(tag.id));
  const availableTags = tags.filter(
    (tag) =>
      !value.includes(tag.id) &&
      tag.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleTag = useCallback(
    (tagId: number) => {
      if (value.includes(tagId)) {
        onChange(value.filter((id) => id !== tagId));
      } else {
        onChange([...value, tagId]);
      }
    },
    [value, onChange]
  );

  const handleRemoveTag = useCallback(
    (tagId: number) => {
      onChange(value.filter((id) => id !== tagId));
    },
    [value, onChange]
  );

  const handleCreateTag = useCallback(async () => {
    if (!search.trim() || isCreating) return;

    // Check if tag already exists
    const exists = tags.some(
      (tag) => tag.name.toLowerCase() === search.toLowerCase()
    );
    if (exists) return;

    setIsCreating(true);
    try {
      const newTag = await onCreateTag(search.trim());
      onChange([...value, newTag.id]);
      setSearch('');
    } finally {
      setIsCreating(false);
    }
  }, [search, tags, isCreating, onCreateTag, value, onChange]);

  const showCreateOption =
    search.trim() &&
    !tags.some((tag) => tag.name.toLowerCase() === search.toLowerCase());

  return (
    <div className="relative">
      {/* Selected tags */}
      <div
        className={cn(
          'flex flex-wrap gap-2 min-h-[42px] p-2 rounded-lg border border-gray-300 bg-white cursor-text',
          isOpen && 'ring-2 ring-primary border-transparent',
          disabled && 'bg-gray-50 cursor-not-allowed'
        )}
        onClick={() => !disabled && setIsOpen(true)}
      >
        {selectedTags.map((tag) => (
          <Badge key={tag.id} variant="default" className="gap-1 pr-1">
            {tag.name}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveTag(tag.id);
              }}
              className="ml-1 rounded-full p-0.5 hover:bg-primary/20"
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {selectedTags.length === 0 && (
          <span className="text-gray-400 text-sm py-0.5">Выберите теги...</span>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
            <div className="p-2 border-b">
              <Input
                placeholder="Поиск или создание тега..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (showCreateOption) {
                      handleCreateTag();
                    }
                  }
                }}
                autoFocus
              />
            </div>

            <div className="max-h-48 overflow-y-auto p-1">
              {/* Create new tag option */}
              {showCreateOption && (
                <button
                  type="button"
                  onClick={handleCreateTag}
                  disabled={isCreating}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-100 text-primary"
                >
                  <Plus className="h-4 w-4" />
                  Создать "{search}"
                </button>
              )}

              {/* Available tags */}
              {availableTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleToggleTag(tag.id)}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-gray-100"
                >
                  {tag.name}
                </button>
              ))}

              {/* Selected tags (to allow unselecting) */}
              {selectedTags
                .filter((tag) =>
                  tag.name.toLowerCase().includes(search.toLowerCase())
                )
                .map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleToggleTag(tag.id)}
                    className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-gray-100 bg-primary-light/50"
                  >
                    {tag.name}
                    <Check className="h-4 w-4 text-primary" />
                  </button>
                ))}

              {availableTags.length === 0 &&
                selectedTags.filter((tag) =>
                  tag.name.toLowerCase().includes(search.toLowerCase())
                ).length === 0 &&
                !showCreateOption && (
                  <p className="px-3 py-2 text-sm text-gray-500">
                    Теги не найдены
                  </p>
                )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
