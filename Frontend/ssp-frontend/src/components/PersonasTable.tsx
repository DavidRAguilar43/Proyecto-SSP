import { useState } from 'react';
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
  Chip,
  Tooltip,
  TablePagination,
  Box,
  Typography
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import type { Persona } from '../types';
import { useBulkSelection } from '../hooks/useBulkSelection';
import BulkDeleteToolbar from './BulkDeleteToolbar';
import BulkDeleteDialog from './BulkDeleteDialog';

interface PersonasTableProps {
  personas: Persona[];
  loading?: boolean;
  onEdit: (persona: Persona) => void;
  onDelete: (persona: Persona) => void;
  onBulkDelete: (ids: number[]) => void;
  currentUserRole?: string;
}

const PersonasTable = ({
  personas,
  loading = false,
  onEdit,
  onDelete,
  onBulkDelete,
  currentUserRole
}: PersonasTableProps) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  const bulkSelection = useBulkSelection({
    items: personas,
    getItemId: (persona) => persona.id
  });

  const handleBulkDeleteClick = () => {
    setBulkDeleteDialogOpen(true);
  };

  const handleBulkDeleteConfirm = () => {
    onBulkDelete(bulkSelection.selectedIds);
    bulkSelection.clearSelection();
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

  const getRolColor = (rol: string) => {
    switch (rol) {
      case 'admin':
        return 'error';
      case 'coordinador':
        return 'secondary';
      case 'personal':
        return 'warning';
      case 'docente':
        return 'info';
      case 'alumno':
        return 'success';
      default:
        return 'default';
    }
  };

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - personas.length) : 0;

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

      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="tabla de personas">
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
              <TableCell padding="checkbox" sx={{ minWidth: 60 }}>
                <Checkbox
                  color="primary"
                  indeterminate={bulkSelection.isIndeterminate}
                  checked={bulkSelection.isAllSelected}
                  onChange={bulkSelection.handleSelectAll}
                />
              </TableCell>
              <TableCell sx={{ minWidth: 60 }}>ID</TableCell>
              <TableCell sx={{ minWidth: 220 }}>Correo Institucional</TableCell>
              <TableCell sx={{ minWidth: 120 }}>Matrícula</TableCell>
              <TableCell sx={{ minWidth: 120 }}>Rol</TableCell>
              <TableCell sx={{ minWidth: 100 }}>Estado</TableCell>
              <TableCell sx={{ minWidth: 180 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {personas
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((persona) => {
                const isItemSelected = bulkSelection.isSelected(persona);
                return (
                  <TableRow
                    hover
                    onClick={(event) => {
                      // Solo seleccionar si el click no fue en el checkbox o en botones de acción
                      const target = event.target as HTMLElement;
                      if (!target.closest('.MuiCheckbox-root') && !target.closest('.MuiIconButton-root')) {
                        bulkSelection.handleSelectItem(persona);
                      }
                    }}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={persona.id}
                    selected={isItemSelected}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        color="primary"
                        checked={isItemSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          bulkSelection.handleSelectItem(persona);
                        }}
                      />
                    </TableCell>
                    <TableCell>{persona.id}</TableCell>
                    <TableCell>{persona.correo_institucional}</TableCell>
                    <TableCell>{persona.matricula || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        label={persona.rol}
                        color={getRolColor(persona.rol) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={persona.is_active ? 'Activo' : 'Inactivo'}
                        color={persona.is_active ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(persona);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(persona);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            {emptyRows > 0 && (
              <TableRow style={{ height: 53 * emptyRows }}>
                <TableCell colSpan={7} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={personas.length}
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
    {currentUserRole === 'admin' && (
      <>
        <BulkDeleteToolbar
          selectedCount={bulkSelection.selectedCount}
          onBulkDelete={handleBulkDeleteClick}
          onClearSelection={bulkSelection.clearSelection}
          loading={loading}
          entityName="personas"
        />

        <BulkDeleteDialog
          open={bulkDeleteDialogOpen}
          onClose={handleBulkDeleteCancel}
          onConfirm={handleBulkDeleteConfirm}
          selectedCount={bulkSelection.selectedCount}
          entityName="personas"
          loading={loading}
          warningMessage="Se eliminarán permanentemente todas las personas seleccionadas junto con sus datos asociados (atenciones, contactos de emergencia, etc.)."
        />
      </>
    )}
  </>
  );
};

export default PersonasTable;
