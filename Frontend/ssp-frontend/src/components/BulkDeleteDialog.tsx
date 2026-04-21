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
  dialogTitle?: string; // e.g., "Confirmar eliminación" or "Confirmar cancelación"
  actionLabel?: string; // e.g., "Eliminar" or "Cancelar"
  actionVerb?: string; // e.g., "eliminar" or "cancelar"
}

const BulkDeleteDialog: React.FC<BulkDeleteDialogProps> = ({
  open,
  onClose,
  onConfirm,
  selectedCount,
  entityName = "elementos",
  loading = false,
  warningMessage,
  dialogTitle = "Confirmar Eliminación Masiva",
  actionLabel = "Sí, Eliminar",
  actionVerb = "eliminar"
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
            {dialogTitle}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body1" gutterBottom>
          ¿Está seguro de que desea {actionVerb} <strong>{selectedCount}</strong> {entityName}?
        </Typography>

        {!warningMessage && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Esta acción {actionVerb === 'eliminar' ? 'eliminará permanentemente todos los registros seleccionados y no se puede deshacer' : 'afectará a todos los registros seleccionados'}.
          </Typography>
        )}

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
          {loading ? `${actionVerb.charAt(0).toUpperCase() + actionVerb.slice(1)}ando...` : actionLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkDeleteDialog;
