import { useState, useCallback } from 'react';

interface UseBulkSelectionProps<T> {
  items: T[];
  getItemId: (item: T) => number;
}

interface UseBulkSelectionReturn<T> {
  selectedIds: number[];
  isSelected: (item: T) => boolean;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  handleSelectAll: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectItem: (item: T) => void;
  clearSelection: () => void;
  selectedCount: number;
}

export function useBulkSelection<T>({
  items,
  getItemId
}: UseBulkSelectionProps<T>): UseBulkSelectionReturn<T> {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const isSelected = useCallback((item: T) => {
    return selectedIds.includes(getItemId(item));
  }, [selectedIds, getItemId]);

  const isAllSelected = items.length > 0 && selectedIds.length === items.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < items.length;

  const handleSelectAll = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const allIds = items.map(getItemId);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  }, [items, getItemId]);

  const handleSelectItem = useCallback((item: T) => {
    const itemId = getItemId(item);
    setSelectedIds(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  }, [getItemId]);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  return {
    selectedIds,
    isSelected,
    isAllSelected,
    isIndeterminate,
    handleSelectAll,
    handleSelectItem,
    clearSelection,
    selectedCount: selectedIds.length
  };
}
