// Test file to verify imports work correctly
import React from 'react';
import GenericTableWithBulkDelete from '../components/GenericTableWithBulkDelete';
import { TableColumn, TableAction } from '../types';

interface TestItem {
  id: number;
  name: string;
}

const ImportTest: React.FC = () => {
  const columns: TableColumn<TestItem>[] = [
    {
      id: 'id',
      label: 'ID',
      render: (item) => item.id
    },
    {
      id: 'name', 
      label: 'Name',
      render: (item) => item.name
    }
  ];

  const actions: TableAction<TestItem>[] = [];

  return (
    <div>
      <h1>Import Test</h1>
      <p>If this compiles, imports are working correctly.</p>
      <GenericTableWithBulkDelete
        data={[]}
        columns={columns}
        getItemId={(item) => item.id}
        actions={actions}
        entityName="test items"
      />
    </div>
  );
};

export default ImportTest;
