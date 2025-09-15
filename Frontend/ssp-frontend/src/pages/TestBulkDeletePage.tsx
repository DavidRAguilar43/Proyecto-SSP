import React, { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import GenericTableWithBulkDelete, { TableColumn } from '@/components/GenericTableWithBulkDelete';

interface TestItem {
  id: number;
  name: string;
  description: string;
}

const TestBulkDeletePage: React.FC = () => {
  const [items, setItems] = useState<TestItem[]>([
    { id: 1, name: 'Item 1', description: 'Description 1' },
    { id: 2, name: 'Item 2', description: 'Description 2' },
    { id: 3, name: 'Item 3', description: 'Description 3' },
    { id: 4, name: 'Item 4', description: 'Description 4' },
    { id: 5, name: 'Item 5', description: 'Description 5' },
  ]);

  const [loading, setLoading] = useState(false);

  const columns: TableColumn<TestItem>[] = [
    {
      id: 'id',
      label: 'ID',
      render: (item) => item.id
    },
    {
      id: 'name',
      label: 'Nombre',
      render: (item) => item.name
    },
    {
      id: 'description',
      label: 'Descripción',
      render: (item) => item.description
    }
  ];

  const handleEdit = (item: TestItem) => {
    console.log('Edit item:', item);
  };

  const handleDelete = (item: TestItem) => {
    console.log('Delete item:', item);
    setItems(prev => prev.filter(i => i.id !== item.id));
  };

  const handleBulkDelete = async (ids: number[]) => {
    console.log('Bulk delete items:', ids);
    setLoading(true);
    
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setItems(prev => prev.filter(item => !ids.includes(item.id)));
    setLoading(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Test Bulk Delete Functionality
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 3 }}>
        Esta es una página de prueba para verificar la funcionalidad de eliminación por lotes.
        Solo los usuarios admin pueden ver y usar la funcionalidad de bulk delete.
      </Typography>

      <GenericTableWithBulkDelete
        data={items}
        columns={columns}
        getItemId={(item) => item.id}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBulkDelete={handleBulkDelete}
        loading={loading}
        entityName="elementos de prueba"
        currentUserRole="admin" // Hardcoded para prueba
        allowBulkDelete={true}
        bulkDeleteWarning="Esta es una prueba. Los elementos se eliminarán de la lista."
        emptyMessage="No hay elementos de prueba"
      />
    </Box>
  );
};

export default TestBulkDeletePage;
