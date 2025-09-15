import React, { useState, useEffect } from 'react';

interface CatalogosAdminProps {
  canDelete?: boolean;
}
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  Badge,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import ConfirmDialog from '../ConfirmDialog';
import { catalogosApi } from '../../services/api';
import type { Religion, GrupoEtnico, Discapacidad, ElementosPendientes, CatalogoCreate, CatalogoUpdate } from '../../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`catalogo-tabpanel-${index}`}
      aria-labelledby={`catalogo-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const CatalogosAdmin: React.FC<CatalogosAdminProps> = ({ canDelete = true }) => {
  const [tabValue, setTabValue] = useState(0);
  const [religiones, setReligiones] = useState<Religion[]>([]);
  const [gruposEtnicos, setGruposEtnicos] = useState<GrupoEtnico[]>([]);
  const [discapacidades, setDiscapacidades] = useState<Discapacidad[]>([]);
  const [pendientes, setPendientes] = useState<ElementosPendientes | null>(null);
  
  // Estados para diálogos
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [currentCatalogo, setCurrentCatalogo] = useState<'religiones' | 'grupos-etnicos' | 'discapacidades'>('religiones');
  const [editingItem, setEditingItem] = useState<any>(null);

  // Estados para diálogo de confirmación
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{item: any, catalogo: 'religiones' | 'grupos-etnicos' | 'discapacidades'} | null>(null);
  
  // Estados para formulario
  const [formData, setFormData] = useState<CatalogoCreate>({ titulo: '', activo: true });
  
  // Estados para notificaciones
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [religionesData, gruposData, discapacidadesData, pendientesData] = await Promise.all([
        catalogosApi.religiones.getAll(),
        catalogosApi.gruposEtnicos.getAll(),
        catalogosApi.discapacidades.getAll(),
        catalogosApi.getPendientes()
      ]);
      
      setReligiones(religionesData);
      setGruposEtnicos(gruposData);
      setDiscapacidades(discapacidadesData);
      setPendientes(pendientesData);
    } catch (error) {
      showSnackbar('Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const openCreateDialog = (catalogo: 'religiones' | 'grupos-etnicos' | 'discapacidades') => {
    setCurrentCatalogo(catalogo);
    setDialogMode('create');
    setFormData({ titulo: '', activo: true });
    setEditingItem(null);
    setOpenDialog(true);
  };

  const openEditDialog = (item: any, catalogo: 'religiones' | 'grupos-etnicos' | 'discapacidades') => {
    setCurrentCatalogo(catalogo);
    setDialogMode('edit');
    setFormData({ titulo: item.titulo, activo: item.activo });
    setEditingItem(item);
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      if (dialogMode === 'create') {
        if (currentCatalogo === 'religiones') {
          await catalogosApi.religiones.create(formData);
        } else if (currentCatalogo === 'grupos-etnicos') {
          await catalogosApi.gruposEtnicos.create(formData);
        } else if (currentCatalogo === 'discapacidades') {
          await catalogosApi.discapacidades.create(formData);
        }
        showSnackbar('Elemento creado exitosamente', 'success');
      } else {
        const updateData: CatalogoUpdate = { titulo: formData.titulo, activo: formData.activo };
        
        if (currentCatalogo === 'religiones') {
          await catalogosApi.religiones.update(editingItem.id, updateData);
        } else if (currentCatalogo === 'grupos-etnicos') {
          await catalogosApi.gruposEtnicos.update(editingItem.id, updateData);
        } else if (currentCatalogo === 'discapacidades') {
          await catalogosApi.discapacidades.update(editingItem.id, updateData);
        }
        showSnackbar('Elemento actualizado exitosamente', 'success');
      }
      
      setOpenDialog(false);
      loadData();
    } catch (error: any) {
      showSnackbar(error.response?.data?.detail || 'Error al guardar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (item: any, catalogo: 'religiones' | 'grupos-etnicos' | 'discapacidades') => {
    setItemToDelete({ item, catalogo });
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      setLoading(true);

      if (itemToDelete.catalogo === 'religiones') {
        await catalogosApi.religiones.delete(itemToDelete.item.id);
      } else if (itemToDelete.catalogo === 'grupos-etnicos') {
        await catalogosApi.gruposEtnicos.delete(itemToDelete.item.id);
      } else if (itemToDelete.catalogo === 'discapacidades') {
        await catalogosApi.discapacidades.delete(itemToDelete.item.id);
      }

      showSnackbar('Elemento eliminado exitosamente', 'success');
      loadData();
    } catch (error: any) {
      showSnackbar(error.response?.data?.detail || 'Error al eliminar', 'error');
    } finally {
      setLoading(false);
      setConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  const activarElemento = async (item: any, catalogo: 'religiones' | 'grupos-etnicos' | 'discapacidades') => {
    try {
      setLoading(true);
      const updateData: CatalogoUpdate = { activo: true };
      
      if (catalogo === 'religiones') {
        await catalogosApi.religiones.update(item.id, updateData);
      } else if (catalogo === 'grupos-etnicos') {
        await catalogosApi.gruposEtnicos.update(item.id, updateData);
      } else if (catalogo === 'discapacidades') {
        await catalogosApi.discapacidades.update(item.id, updateData);
      }
      
      showSnackbar('Elemento activado exitosamente', 'success');
      loadData();
    } catch (error: any) {
      showSnackbar(error.response?.data?.detail || 'Error al activar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderCatalogoList = (items: any[], catalogoType: 'religiones' | 'grupos-etnicos' | 'discapacidades', title: string) => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">{title}</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => openCreateDialog(catalogoType)}
          >
            Agregar
          </Button>
        </Box>
        
        <Grid container spacing={2}>
          {items.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body1">{item.titulo}</Typography>
                    <Chip 
                      label={item.activo ? 'Activo' : 'Inactivo'} 
                      color={item.activo ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                  <Box mt={1} display="flex" gap={1}>
                    <IconButton 
                      size="small" 
                      onClick={() => openEditDialog(item, catalogoType)}
                      title="Editar"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    {canDelete && (
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(item, catalogoType)}
                        title="Eliminar"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                    {!item.activo && (
                      <IconButton 
                        size="small" 
                        onClick={() => activarElemento(item, catalogoType)}
                        title="Activar"
                        color="success"
                      >
                        <CheckCircleIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Administración de Catálogos
      </Typography>
      
      {pendientes && pendientes.total > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Hay {pendientes.total} elementos pendientes de activación.
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Religiones" />
          <Tab label="Grupos Étnicos" />
          <Tab label="Discapacidades" />
          <Tab 
            label={
              <Badge badgeContent={pendientes?.total || 0} color="error">
                Pendientes
              </Badge>
            } 
          />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {renderCatalogoList(religiones, 'religiones', 'Religiones')}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {renderCatalogoList(gruposEtnicos, 'grupos-etnicos', 'Grupos Étnicos')}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {renderCatalogoList(discapacidades, 'discapacidades', 'Discapacidades')}
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        {pendientes && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Elementos Pendientes de Activación
            </Typography>
            
            {pendientes.religiones.length > 0 && (
              <Box mb={3}>
                <Typography variant="subtitle1" gutterBottom>Religiones</Typography>
                {renderCatalogoList(pendientes.religiones, 'religiones', '')}
              </Box>
            )}
            
            {pendientes.grupos_etnicos.length > 0 && (
              <Box mb={3}>
                <Typography variant="subtitle1" gutterBottom>Grupos Étnicos</Typography>
                {renderCatalogoList(pendientes.grupos_etnicos, 'grupos-etnicos', '')}
              </Box>
            )}
            
            {pendientes.discapacidades.length > 0 && (
              <Box mb={3}>
                <Typography variant="subtitle1" gutterBottom>Discapacidades</Typography>
                {renderCatalogoList(pendientes.discapacidades, 'discapacidades', '')}
              </Box>
            )}
          </Box>
        )}
      </TabPanel>

      {/* Diálogo para crear/editar */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Crear' : 'Editar'} Elemento
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Título"
            fullWidth
            variant="outlined"
            value={formData.titulo}
            onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.activo}
                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
              />
            }
            label="Activo"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={!formData.titulo.trim() || loading}>
            {dialogMode === 'create' ? 'Crear' : 'Actualizar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDialog
        open={confirmOpen}
        title="Confirmar eliminación"
        message={`¿Está seguro de que desea eliminar este elemento? Esta acción no se puede deshacer.`}
        onConfirm={confirmDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setItemToDelete(null);
        }}
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
        severity="error"
        loading={loading}
      />
    </Box>
  );
};

export default CatalogosAdmin;
