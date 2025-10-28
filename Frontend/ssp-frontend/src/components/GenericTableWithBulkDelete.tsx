import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  IconButton,
  Tooltip,
  TablePagination,
  CircularProgress,
  Typography,
  Box
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import BulkDeleteToolbar from './BulkDeleteToolbar';
import BulkDeleteDialog from './BulkDeleteDialog';
import { TableColumn, TableAction } from '@/types/table';

// Re-export types for convenience
export type { TableColumn, TableAction };

interface GenericTableWithBulkDeleteProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  getItemId: (item: T) => number;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onBulkDelete?: (ids: number[]) => void;
  actions?: TableAction<T>[];
  loading?: boolean;
  entityName?: string;
  currentUserRole?: string;
  allowBulkDelete?: boolean;
  bulkDeleteWarning?: string;
  emptyMessage?: string;
}

function GenericTableWithBulkDelete<T>({
  data,
  columns,
  getItemId,
  onEdit,
  onDelete,
  onBulkDelete,
  actions = [],
  loading = false,
  entityName = "elementos",
  currentUserRole,
  allowBulkDelete = true,
  bulkDeleteWarning,
  emptyMessage = "No hay datos disponibles"
}: GenericTableWithBulkDeleteProps<T>) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  const bulkSelection = useBulkSelection({
    items: data,
    getItemId
  });

  const handleBulkDeleteClick = () => {
    setBulkDeleteDialogOpen(true);
  };

  const handleBulkDeleteConfirm = () => {
    if (onBulkDelete) {
      onBulkDelete(bulkSelection.selectedIds);
      bulkSelection.clearSelection();
    }
    setBulkDeleteDialogOpen(false);
  };

  const handleBulkDeleteCancel = () => {
    setBulkDeleteDialogOpen(false);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Combinar acciones predeterminadas con acciones personalizadas
  const defaultActions: TableAction<T>[] = [];
  
  if (onEdit) {
    defaultActions.push({
      icon: <EditIcon />,
      tooltip: "Editar",
      onClick: onEdit,
      color: "primary"
    });
  }
  
  if (onDelete) {
    defaultActions.push({
      icon: <DeleteIcon />,
      tooltip: "Eliminar",
      onClick: onDelete,
      color: "error"
    });
  }

  const allActions = [...defaultActions, ...actions];
  const showBulkDelete = allowBulkDelete && currentUserRole === 'admin' && onBulkDelete;

  return (
    <>
      <Paper
        sx={{
          width: '100%',
          overflow: 'hidden',
          borderRadius: 2,
          boxShadow: 2
        }}
      >
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader aria-label={`tabla de ${entityName}`}>
            <TableHead>
              <TableRow
                sx={{
                  '& .MuiTableCell-head': {
                    backgroundColor: 'background.secondary',
                    fontWeight: 600,
                    color: 'text.primary',
                    whiteSpace: 'nowrap',
                    minWidth: 'fit-content'
                  }
                }}
              >
                {showBulkDelete && (
                  <TableCell padding="checkbox" sx={{ minWidth: 60 }}>
                    <Checkbox
                      color="primary"
                      indeterminate={bulkSelection.isIndeterminate}
                      checked={bulkSelection.isAllSelected}
                      onChange={bulkSelection.handleSelectAll}
                    />
                  </TableCell>
                )}
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align || 'left'}
                    sx={{ minWidth: column.minWidth || 120 }}
                  >
                    {column.label}
                  </TableCell>
                ))}
                {allActions.length > 0 && (
                  <TableCell align="center" sx={{ minWidth: 150 }}>Acciones</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length + (showBulkDelete ? 1 : 0) + (allActions.length > 0 ? 1 : 0)} align="center">
                    <Box py={2}>
                      <CircularProgress />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Cargando...
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + (showBulkDelete ? 1 : 0) + (allActions.length > 0 ? 1 : 0)} align="center">
                    <Box py={2}>
                      <Typography variant="body2" color="text.secondary">
                        {emptyMessage}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                data
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((item) => {
                    const isItemSelected = showBulkDelete ? bulkSelection.isSelected(item) : false;
                    return (
                      <TableRow
                        hover
                        key={getItemId(item)}
                        selected={isItemSelected}
                        onClick={showBulkDelete ? () => bulkSelection.handleSelectItem(item) : undefined}
                        role={showBulkDelete ? "checkbox" : undefined}
                        aria-checked={showBulkDelete ? isItemSelected : undefined}
                        tabIndex={-1}
                        sx={{ cursor: showBulkDelete ? 'pointer' : 'default' }}
                      >
                        {showBulkDelete && (
                          <TableCell padding="checkbox">
                            <Checkbox
                              color="primary"
                              checked={isItemSelected}
                              onChange={() => bulkSelection.handleSelectItem(item)}
                            />
                          </TableCell>
                        )}
                        {columns.map((column) => (
                          <TableCell key={column.id} align={column.align || 'left'}>
                            {column.render(item)}
                          </TableCell>
                        ))}
                        {allActions.length > 0 && (
                          <TableCell align="center">
                            {allActions.map((action, index) => {
                              if (action.show && !action.show(item)) {
                                return null;
                              }
                              return (
                                <Tooltip key={index} title={action.tooltip}>
                                  <IconButton
                                    size="small"
                                    color={action.color || 'default'}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      action.onClick(item);
                                    }}
                                  >
                                    {action.icon}
                                  </IconButton>
                                </Tooltip>
                              );
                            })}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={data.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
          }
        />
      </Paper>

      {/* Componentes de Batch Delete */}
      {showBulkDelete && (
        <>
          <BulkDeleteToolbar
            selectedCount={bulkSelection.selectedCount}
            onBulkDelete={handleBulkDeleteClick}
            onClearSelection={bulkSelection.clearSelection}
            loading={loading}
            entityName={entityName}
          />
          
          <BulkDeleteDialog
            open={bulkDeleteDialogOpen}
            onClose={handleBulkDeleteCancel}
            onConfirm={handleBulkDeleteConfirm}
            selectedCount={bulkSelection.selectedCount}
            entityName={entityName}
            loading={loading}
            warningMessage={bulkDeleteWarning}
          />
        </>
      )}
    </>
  );
}

export default GenericTableWithBulkDelete;
