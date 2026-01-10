import { useState, useCallback, type ReactNode } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/utils/cn';

interface SortableItemProps {
  id: number;
  children: ReactNode;
  disabled?: boolean;
}

export function SortableItem({ id, children, disabled = false }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative',
        isDragging && 'z-50 opacity-90'
      )}
    >
      <div className="group relative">
        {!disabled && (
          <button
            type="button"
            className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab touch-none rounded p-1 opacity-0 transition-opacity hover:bg-gray-100 group-hover:opacity-100 active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

interface SortableListProps<T extends { id: number }> {
  items: T[];
  onReorder: (ids: number[]) => void;
  renderItem: (item: T, index: number) => ReactNode;
  disabled?: boolean;
  layout?: 'vertical' | 'grid';
  className?: string;
}

export function SortableList<T extends { id: number }>({
  items,
  onReorder,
  renderItem,
  disabled = false,
  layout = 'vertical',
  className,
}: SortableListProps<T>) {
  const [localItems, setLocalItems] = useState(items);

  // Update local items when props change
  if (JSON.stringify(items.map(i => i.id)) !== JSON.stringify(localItems.map(i => i.id))) {
    setLocalItems(items);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = localItems.findIndex((item) => item.id === active.id);
        const newIndex = localItems.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(localItems, oldIndex, newIndex);
        setLocalItems(newItems);

        // Send new order to API
        onReorder(newItems.map((item) => item.id));
      }
    },
    [localItems, onReorder]
  );

  const strategy = layout === 'grid' ? rectSortingStrategy : verticalListSortingStrategy;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={localItems.map((item) => item.id)}
        strategy={strategy}
        disabled={disabled}
      >
        <div className={className}>
          {localItems.map((item, index) => (
            <SortableItem key={item.id} id={item.id} disabled={disabled}>
              {renderItem(item, index)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
