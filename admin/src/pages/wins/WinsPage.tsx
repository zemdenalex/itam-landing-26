import { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Upload, Search, Pencil, Trash2, ExternalLink } from 'lucide-react';
import {
  Button,
  Input,
  Select,
  Card,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Pagination,
  Loading,
  EmptyState,
  Badge,
  getResultBadgeVariant,
} from '@/components/ui';
import {
  useWins,
  useWinsYears,
  useCreateWin,
  useUpdateWin,
  useDeleteWin,
  useImportWins,
} from '@/hooks';
import { formatDate, formatMoney } from '@/utils/formatters';
import { WinFormModal, type WinFormData } from './WinFormModal';
import { ImportWinsModal } from './ImportWinsModal';
import { DeleteWinDialog } from './DeleteWinDialog';
import type { Win } from '@/types';

const PAGE_SIZE = 20;

export function WinsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state
  const page = parseInt(searchParams.get('page') || '1', 10);
  const year = searchParams.get('year') ? parseInt(searchParams.get('year')!, 10) : undefined;
  const search = searchParams.get('search') || '';

  // Local state
  const [searchInput, setSearchInput] = useState(search);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedWin, setSelectedWin] = useState<Win | null>(null);

  // Queries
  const { data, isLoading, isError } = useWins({
    page,
    page_size: PAGE_SIZE,
    year,
    search: search || undefined,
  });
  const { data: years = [] } = useWinsYears();

  // Mutations
  const createWin = useCreateWin();
  const updateWin = useUpdateWin();
  const deleteWin = useDeleteWin();
  const importWins = useImportWins();

  // Year options for select
  const yearOptions = useMemo(
    () => [
      { value: '', label: 'Все годы' },
      ...years.map((y) => ({ value: String(y), label: String(y) })),
    ],
    [years]
  );

  // Handlers
  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const newParams = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          newParams.set(key, value);
        } else {
          newParams.delete(key);
        }
      });
      // Reset to page 1 when filters change
      if (!updates.page) {
        newParams.delete('page');
      }
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  const handleSearch = useCallback(() => {
    updateParams({ search: searchInput || undefined, page: undefined });
  }, [searchInput, updateParams]);

  const handleYearChange = useCallback(
    (value: string) => {
      updateParams({ year: value || undefined, page: undefined });
    },
    [updateParams]
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      updateParams({ page: newPage > 1 ? String(newPage) : undefined });
    },
    [updateParams]
  );

  const handleCreate = () => {
    setSelectedWin(null);
    setIsFormOpen(true);
  };

  const handleEdit = (win: Win) => {
    setSelectedWin(win);
    setIsFormOpen(true);
  };

  const handleDelete = (win: Win) => {
    setSelectedWin(win);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (formData: WinFormData) => {
    if (selectedWin) {
      await updateWin.mutateAsync({ id: selectedWin.id, data: formData });
    } else {
      await createWin.mutateAsync(formData);
    }
    setIsFormOpen(false);
    setSelectedWin(null);
  };

  const handleDeleteConfirm = async () => {
    if (selectedWin) {
      await deleteWin.mutateAsync(selectedWin.id);
      setIsDeleteOpen(false);
      setSelectedWin(null);
    }
  };

  const handleImport = async (file: File) => {
    return await importWins.mutateAsync(file);
  };

  // Stats from data
  const totalWins = data?.total || 0;
  const totalPrize = useMemo(() => {
    if (!data?.items) return 0;
    return data.items.reduce((sum, win) => sum + (win.prize || 0), 0);
  }, [data?.items]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Победы</h1>
          <p className="text-gray-500">
            Всего найдено: {totalWins} • Призовых на странице: {formatMoney(totalPrize)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsImportOpen(true)}>
            <Upload className="h-4 w-4" />
            Импорт CSV
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Добавить
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex flex-1 gap-2">
              <Input
                placeholder="Поиск по команде или хакатону..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="max-w-sm"
              />
              <Button variant="outline" onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Select
              options={yearOptions}
              value={year ? String(year) : ''}
              onChange={handleYearChange}
              className="w-40"
            />
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
              description="Не удалось загрузить список побед"
            />
          ) : !data?.items.length ? (
            <EmptyState
              title="Побед не найдено"
              description={search || year ? 'Попробуйте изменить фильтры' : 'Добавьте первую победу'}
              action={
                !search && !year ? (
                  <Button onClick={handleCreate}>
                    <Plus className="h-4 w-4" />
                    Добавить победу
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Команда</TableHead>
                    <TableHead>Хакатон</TableHead>
                    <TableHead>Результат</TableHead>
                    <TableHead className="text-right">Призовой</TableHead>
                    <TableHead>Год</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead className="w-[100px]">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((win) => (
                    <TableRow key={win.id}>
                      <TableCell className="font-medium">{win.team_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {win.hackathon_name}
                          {win.link && (
                            <a
                              href={win.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-primary"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getResultBadgeVariant(win.result)}>
                          {win.result}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {win.prize ? formatMoney(win.prize) : '—'}
                      </TableCell>
                      <TableCell>{win.year}</TableCell>
                      <TableCell>{formatDate(win.award_date)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(win)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-accent-red hover:text-accent-red"
                            onClick={() => handleDelete(win)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {data.total_pages > 1 && (
                <div className="border-t p-4">
                  <Pagination
                    currentPage={page}
                    totalPages={data.total_pages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <WinFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        isLoading={createWin.isPending || updateWin.isPending}
        win={selectedWin}
      />

      <ImportWinsModal
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImport={handleImport}
        isLoading={importWins.isPending}
      />

      <DeleteWinDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDeleteConfirm}
        winName={selectedWin ? `${selectedWin.team_name} — ${selectedWin.hackathon_name}` : undefined}
        isLoading={deleteWin.isPending}
      />
    </div>
  );
}
