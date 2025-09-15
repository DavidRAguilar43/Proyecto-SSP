import React from 'react';

export interface TableColumn<T> {
  id: string;
  label: string;
  render: (item: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

export interface TableAction<T> {
  icon: React.ReactNode;
  tooltip: string;
  onClick: (item: T) => void;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  show?: (item: T) => boolean;
}
