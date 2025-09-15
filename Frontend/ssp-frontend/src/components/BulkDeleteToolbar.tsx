import React from 'react';
import {
  Box,
  Button,
  Typography,
  Fade,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Close as CloseIcon
} from '@mui/icons-material';

interface BulkDeleteToolbarProps {
  selectedCount: number;
  onBulkDelete: () => void;
  onClearSelection: () => void;
  loading?: boolean;
  entityName?: string; // e.g., "personas", "grupos", etc.
}

const BulkDeleteToolbar: React.FC<BulkDeleteToolbarProps> = ({
  selectedCount,
  onBulkDelete,
  onClearSelection,
  loading = false,
  entityName = "elementos"
}) => {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <Fade in={selectedCount > 0}>
      <Paper
        elevation={4}
        sx={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1300,
          px: 3,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          backgroundColor: 'primary.main',
          color: 'primary.contrastText',
          borderRadius: 2,
          minWidth: 300
        }}
      >
        <Typography variant="body1" sx={{ flexGrow: 1 }}>
          {selectedCount} {entityName} seleccionado{selectedCount !== 1 ? 's' : ''}
        </Typography>
        
        <Button
          variant="contained"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={onBulkDelete}
          disabled={loading}
          size="small"
          sx={{
            backgroundColor: 'error.main',
            '&:hover': {
              backgroundColor: 'error.dark'
            }
          }}
        >
          Eliminar
        </Button>
        
        <Tooltip title="Cancelar selección">
          <IconButton
            size="small"
            onClick={onClearSelection}
            disabled={loading}
            sx={{ 
              color: 'primary.contrastText',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </Paper>
    </Fade>
  );
};

export default BulkDeleteToolbar;
