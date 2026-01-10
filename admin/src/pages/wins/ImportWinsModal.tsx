import { useState } from 'react';
import { FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  Button,
  FileUpload,
} from '@/components/ui';
import type { ImportResult } from '@/api/wins';

interface ImportWinsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (file: File) => Promise<ImportResult>;
  isLoading?: boolean;
}

export function ImportWinsModal({
  open,
  onOpenChange,
  onImport,
  isLoading = false,
}: ImportWinsModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleClose = () => {
    setSelectedFile(null);
    setResult(null);
    onOpenChange(false);
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    try {
      const importResult = await onImport(selectedFile);
      setResult(importResult);
    } catch {
      // Error handled in hook
    }
  };

  return (
    <Modal open={open} onOpenChange={handleClose}>
      <ModalContent className="max-w-lg">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Импорт из CSV
          </ModalTitle>
          <ModalDescription>
            Загрузите CSV файл с данными о победах
          </ModalDescription>
        </ModalHeader>

        {!result ? (
          <>
            <div className="space-y-4">
              <FileUpload
                accept=".csv"
                maxSize={10 * 1024 * 1024}
                onFileSelect={setSelectedFile}
                disabled={isLoading}
              />

              <div className="rounded-lg bg-gray-50 p-4 text-sm">
                <p className="font-medium text-gray-700 mb-2">Формат CSV:</p>
                <p className="text-gray-600 mb-2">
                  Разделитель: <code className="bg-white px-1 rounded">;</code> (точка с запятой)
                </p>
                <p className="text-gray-600 mb-1">Колонки:</p>
                <code className="block bg-white p-2 rounded text-xs overflow-x-auto">
                  Название команды;Название хакатона;Результат;Призовой;Дата награждения;Год;Ссылка
                </code>
                <p className="text-gray-500 mt-2 text-xs">
                  Дата в формате ДД.ММ.ГГГГ. Призовой и ссылка опциональны.
                </p>
              </div>
            </div>

            <ModalFooter className="pt-4">
              <Button variant="outline" onClick={handleClose}>
                Отмена
              </Button>
              <Button
                onClick={handleImport}
                disabled={!selectedFile}
                isLoading={isLoading}
              >
                Импортировать
              </Button>
            </ModalFooter>
          </>
        ) : (
          <>
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">
                    Импортировано: {result.imported}
                  </p>
                  {result.skipped > 0 && (
                    <p className="text-sm text-green-600">
                      Пропущено: {result.skipped}
                    </p>
                  )}
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="rounded-lg bg-orange-50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    <p className="font-medium text-orange-800">
                      Предупреждения ({result.errors.length})
                    </p>
                  </div>
                  <ul className="space-y-1 text-sm text-orange-700 max-h-32 overflow-y-auto">
                    {result.errors.map((error, idx) => (
                      <li key={idx}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <ModalFooter className="pt-4">
              <Button onClick={handleClose}>Готово</Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
