import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Warning as WarningIcon
} from '@mui/icons-material';

interface BulkDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedCount: number;
  entityName?: string; // e.g., "personas", "grupos", etc.
  loading?: boolean;
  warningMessage?: string;
}

const BulkDeleteDialog: React.FC<BulkDeleteDialogProps> = ({
  open,
  onClose,
  onConfirm,
  selectedCount,
  entityName = "elementos",
  loading = false,
  warningMessage
}) => {
  return (
    <Dialog
      open={open}
      onClose={!loading ? onClose : undefined}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <WarningIcon color="error" />
          <Typography variant="h6">
            Confirmar Eliminación Masiva
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          ¿Está seguro de que desea eliminar <strong>{selectedCount}</strong> {entityName}?
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Esta acción eliminará permanentemente todos los registros seleccionados y no se puede deshacer.
        </Typography>
        
        {warningMessage && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {warningMessage}
          </Alert>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button
          onClick={onClose}
          disabled={loading}
          color="inherit"
        >
          Cancelar
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          color="error"
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} /> : undefined}
        >
          {loading ? 'Eliminando...' : 'Sí, Eliminar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkDeleteDialog;
