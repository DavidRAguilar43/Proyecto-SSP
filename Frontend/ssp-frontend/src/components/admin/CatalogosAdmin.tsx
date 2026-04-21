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
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import ConfirmDialog from '../ConfirmDialog';
import GenericTableWithBulkDelete from '../GenericTableWithBulkDelete';
import { catalogosApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import type { Religion, GrupoEtnico, Discapacidad, ModeloIA, ElementosPendientes, CatalogoCreate, CatalogoUpdate, ModeloIACreate, ModeloIAUpdate, TableColumn } from '../../types';

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
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [religiones, setReligiones] = useState<Religion[]>([]);
  const [gruposEtnicos, setGruposEtnicos] = useState<GrupoEtnico[]>([]);
  const [discapacidades, setDiscapacidades] = useState<Discapacidad[]>([]);
  const [modelosIA, setModelosIA] = useState<ModeloIA[]>([]);
  const [pendientes, setPendientes] = useState<ElementosPendientes | null>(null);

  // Estados para diálogos
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [currentCatalogo, setCurrentCatalogo] = useState<'religiones' | 'grupos-etnicos' | 'discapacidades' | 'modelos-ia'>('religiones');
  const [editingItem, setEditingItem] = useState<any>(null);

  // Estados para diálogo de confirmación
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{item: any, catalogo: 'religiones' | 'grupos-etnicos' | 'discapacidades' | 'modelos-ia'} | null>(null);

  // Estados para formulario
  const [formData, setFormData] = useState<CatalogoCreate>({ titulo: '', activo: true });
  const [modeloIAFormData, setModeloIAFormData] = useState<ModeloIACreate>({
    titulo: '',
    model_id: '',
    proveedor: '',
    descripcion: '',
    categoria: 'standard',
    recomendado: false,
    activo: true
  });

  // Estados para notificaciones
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [religionesData, gruposData, discapacidadesData, modelosIAData, pendientesData] = await Promise.all([
        catalogosApi.religiones.getAll(),
        catalogosApi.gruposEtnicos.getAll(),
        catalogosApi.discapacidades.getAll(),
        catalogosApi.modelosIA.getAll(),
        catalogosApi.getPendientes()
      ]);

      setReligiones(religionesData);
      setGruposEtnicos(gruposData);
      setDiscapacidades(discapacidadesData);
      setModelosIA(modelosIAData);
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

  const openCreateDialog = (catalogo: 'religiones' | 'grupos-etnicos' | 'discapacidades' | 'modelos-ia') => {
    setCurrentCatalogo(catalogo);
    setDialogMode('create');
    if (catalogo === 'modelos-ia') {
      setModeloIAFormData({
        titulo: '',
        model_id: '',
        proveedor: '',
        descripcion: '',
        categoria: 'standard',
        recomendado: false,
        activo: true
      });
    } else {
      setFormData({ titulo: '', activo: true });
    }
    setEditingItem(null);
    setOpenDialog(true);
  };

  const openEditDialog = (item: any, catalogo: 'religiones' | 'grupos-etnicos' | 'discapacidades' | 'modelos-ia') => {
    setCurrentCatalogo(catalogo);
    setDialogMode('edit');
    if (catalogo === 'modelos-ia') {
      setModeloIAFormData({
        titulo: item.titulo,
        model_id: item.model_id,
        proveedor: item.proveedor,
        descripcion: item.descripcion || '',
        categoria: item.categoria,
        recomendado: item.recomendado,
        activo: item.activo
      });
    } else {
      setFormData({ titulo: item.titulo, activo: item.activo });
    }
    setEditingItem(item);
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      if (dialogMode === 'create') {
        if (currentCatalogo === 'modelos-ia') {
          await catalogosApi.modelosIA.create(modeloIAFormData);
        } else if (currentCatalogo === 'religiones') {
          await catalogosApi.religiones.create(formData);
        } else if (currentCatalogo === 'grupos-etnicos') {
          await catalogosApi.gruposEtnicos.create(formData);
        } else if (currentCatalogo === 'discapacidades') {
          await catalogosApi.discapacidades.create(formData);
        }
        showSnackbar('Elemento creado exitosamente', 'success');
      } else {
        if (currentCatalogo === 'modelos-ia') {
          const updateData: ModeloIAUpdate = {
            titulo: modeloIAFormData.titulo,
            model_id: modeloIAFormData.model_id,
            proveedor: modeloIAFormData.proveedor,
            descripcion: modeloIAFormData.descripcion,
            categoria: modeloIAFormData.categoria,
            recomendado: modeloIAFormData.recomendado,
            activo: modeloIAFormData.activo
          };
          await catalogosApi.modelosIA.update(editingItem.id, updateData);
        } else {
          const updateData: CatalogoUpdate = { titulo: formData.titulo, activo: formData.activo };

          if (currentCatalogo === 'religiones') {
            await catalogosApi.religiones.update(editingItem.id, updateData);
          } else if (currentCatalogo === 'grupos-etnicos') {
            await catalogosApi.gruposEtnicos.update(editingItem.id, updateData);
          } else if (currentCatalogo === 'discapacidades') {
            await catalogosApi.discapacidades.update(editingItem.id, updateData);
          }
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

  const handleDelete = (item: any, catalogo: 'religiones' | 'grupos-etnicos' | 'discapacidades' | 'modelos-ia') => {
    setItemToDelete({ item, catalogo });
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      setLoading(true);

      if (itemToDelete.catalogo === 'modelos-ia') {
        await catalogosApi.modelosIA.delete(itemToDelete.item.id);
      } else if (itemToDelete.catalogo === 'religiones') {
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

  const activarElemento = async (item: any, catalogo: 'religiones' | 'grupos-etnicos' | 'discapacidades' | 'modelos-ia') => {
    try {
      setLoading(true);

      if (catalogo === 'modelos-ia') {
        const updateData: ModeloIAUpdate = { activo: true };
        await catalogosApi.modelosIA.update(item.id, updateData);
      } else {
        const updateData: CatalogoUpdate = { activo: true };

        if (catalogo === 'religiones') {
          await catalogosApi.religiones.update(item.id, updateData);
        } else if (catalogo === 'grupos-etnicos') {
          await catalogosApi.gruposEtnicos.update(item.id, updateData);
        } else if (catalogo === 'discapacidades') {
          await catalogosApi.discapacidades.update(item.id, updateData);
        }
      }

      showSnackbar('Elemento activado exitosamente', 'success');
      loadData();
    } catch (error: any) {
      showSnackbar(error.response?.data?.detail || 'Error al activar', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Funciones de batch delete
  const handleBulkDeleteReligiones = async (ids: number[]) => {
    try {
      setLoading(true);
      await catalogosApi.religiones.bulkDelete(ids);
      showSnackbar(`${ids.length} religiones eliminadas exitosamente`, 'success');
      loadData();
    } catch (error: any) {
      showSnackbar(error.response?.data?.detail || 'Error al eliminar religiones', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDeleteGruposEtnicos = async (ids: number[]) => {
    try {
      setLoading(true);
      await catalogosApi.gruposEtnicos.bulkDelete(ids);
      showSnackbar(`${ids.length} grupos étnicos eliminados exitosamente`, 'success');
      loadData();
    } catch (error: any) {
      showSnackbar(error.response?.data?.detail || 'Error al eliminar grupos étnicos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDeleteDiscapacidades = async (ids: number[]) => {
    try {
      setLoading(true);
      await catalogosApi.discapacidades.bulkDelete(ids);
      showSnackbar(`${ids.length} discapacidades eliminadas exitosamente`, 'success');
      loadData();
    } catch (error: any) {
      showSnackbar(error.response?.data?.detail || 'Error al eliminar discapacidades', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDeleteModelosIA = async (ids: number[]) => {
    try {
      setLoading(true);
      await catalogosApi.modelosIA.bulkDelete(ids);
      showSnackbar(`${ids.length} modelos de IA eliminados exitosamente`, 'success');
      loadData();
    } catch (error: any) {
      showSnackbar(error.response?.data?.detail || 'Error al eliminar modelos de IA', 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderModelosIAList = (items: ModeloIA[]) => {
    const columns: TableColumn<ModeloIA>[] = [
      {
        id: 'titulo',
        label: 'Título',
        render: (item) => (
          <Typography variant="body2" fontWeight="medium">
            {item.titulo}
          </Typography>
        )
      },
      {
        id: 'model_id',
        label: 'ID del Modelo',
        render: (item) => (
          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
            {item.model_id}
          </Typography>
        )
      },
      {
        id: 'proveedor',
        label: 'Proveedor',
        render: (item) => (
          <Typography variant="body2">
            {item.proveedor}
          </Typography>
        )
      },
      {
        id: 'categoria',
        label: 'Categoría',
        render: (item) => (
          <Chip
            label={item.categoria}
            size="small"
            color={
              item.categoria === 'premium'
                ? 'primary'
                : item.categoria === 'standard'
                ? 'default'
                : 'secondary'
            }
          />
        )
      },
      {
        id: 'descripcion',
        label: 'Descripción',
        render: (item) => (
          <Tooltip title={item.descripcion || ''} arrow>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                maxWidth: 200,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {item.descripcion || '-'}
            </Typography>
          </Tooltip>
        )
      },
      {
        id: 'recomendado',
        label: 'Recomendado',
        align: 'center',
        render: (item) => (
          item.recomendado ? (
            <Chip
              label="Sí"
              size="small"
              color="success"
              variant="outlined"
            />
          ) : (
            <Typography variant="body2" color="text.secondary">
              No
            </Typography>
          )
        )
      },
      {
        id: 'activo',
        label: 'Estado',
        align: 'center',
        render: (item) => (
          <Chip
            label={item.activo ? 'Activo' : 'Inactivo'}
            color={item.activo ? 'success' : 'default'}
            size="small"
          />
        )
      }
    ];

    const actions = [
      {
        icon: <CheckCircleIcon />,
        tooltip: 'Activar',
        onClick: (item: ModeloIA) => activarElemento(item, 'modelos-ia'),
        color: 'success' as const,
        show: (item: ModeloIA) => !item.activo
      }
    ];

    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Modelos de IA</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => openCreateDialog('modelos-ia')}
            >
              Agregar Modelo
            </Button>
          </Box>

          <GenericTableWithBulkDelete
            data={items}
            columns={columns}
            getItemId={(item) => item.id}
            onEdit={(item) => openEditDialog(item, 'modelos-ia')}
            onDelete={canDelete ? (item) => handleDelete(item, 'modelos-ia') : undefined}
            onBulkDelete={handleBulkDeleteModelosIA}
            actions={actions}
            loading={loading}
            entityName="modelos de IA"
            currentUserRole={user?.rol}
            allowBulkDelete={canDelete}
            bulkDeleteWarning="Se eliminarán permanentemente todos los modelos de IA seleccionados."
            emptyMessage="No hay modelos de IA registrados"
          />
        </CardContent>
      </Card>
    );
  };

  const renderCatalogoList = (items: any[], catalogoType: 'religiones' | 'grupos-etnicos' | 'discapacidades', title: string) => {
    const columns: TableColumn<any>[] = [
      {
        id: 'titulo',
        label: 'Título',
        render: (item) => (
          <Typography variant="body2" fontWeight="medium">
            {item.titulo}
          </Typography>
        )
      },
      {
        id: 'activo',
        label: 'Estado',
        align: 'center',
        render: (item) => (
          <Chip
            label={item.activo ? 'Activo' : 'Inactivo'}
            color={item.activo ? 'success' : 'default'}
            size="small"
          />
        )
      },
      {
        id: 'fecha_creacion',
        label: 'Fecha Creación',
        render: (item) => (
          <Typography variant="caption" color="text.secondary">
            {new Date(item.fecha_creacion).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </Typography>
        )
      },
      {
        id: 'fecha_actualizacion',
        label: 'Última Actualización',
        render: (item) => (
          <Typography variant="caption" color="text.secondary">
            {new Date(item.fecha_actualizacion).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </Typography>
        )
      }
    ];

    const actions = [
      {
        icon: <CheckCircleIcon />,
        tooltip: 'Activar',
        onClick: (item: any) => activarElemento(item, catalogoType),
        color: 'success' as const,
        show: (item: any) => !item.activo
      }
    ];

    const getBulkDeleteHandler = () => {
      switch (catalogoType) {
        case 'religiones':
          return handleBulkDeleteReligiones;
        case 'grupos-etnicos':
          return handleBulkDeleteGruposEtnicos;
        case 'discapacidades':
          return handleBulkDeleteDiscapacidades;
        default:
          return handleBulkDeleteReligiones;
      }
    };

    const getEntityName = () => {
      switch (catalogoType) {
        case 'religiones':
          return 'religiones';
        case 'grupos-etnicos':
          return 'grupos étnicos';
        case 'discapacidades':
          return 'discapacidades';
        default:
          return 'elementos';
      }
    };

    return (
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

          <GenericTableWithBulkDelete
            data={items}
            columns={columns}
            getItemId={(item) => item.id}
            onEdit={(item) => openEditDialog(item, catalogoType)}
            onDelete={canDelete ? (item) => handleDelete(item, catalogoType) : undefined}
            onBulkDelete={getBulkDeleteHandler()}
            actions={actions}
            loading={loading}
            entityName={getEntityName()}
            currentUserRole={user?.rol}
            allowBulkDelete={canDelete}
            bulkDeleteWarning={`Se eliminarán permanentemente todos los ${getEntityName()} seleccionados.`}
            emptyMessage="No hay elementos registrados"
          />
        </CardContent>
      </Card>
    );
  };

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
          <Tab label="Modelos IA" />
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
        {renderModelosIAList(modelosIA)}
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
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
          {dialogMode === 'create' ? 'Crear' : 'Editar'} {currentCatalogo === 'modelos-ia' ? 'Modelo de IA' : 'Elemento'}
        </DialogTitle>
        <DialogContent>
          {currentCatalogo === 'modelos-ia' ? (
            <>
              <TextField
                autoFocus
                margin="dense"
                label="Título"
                fullWidth
                variant="outlined"
                value={modeloIAFormData.titulo}
                onChange={(e) => setModeloIAFormData({ ...modeloIAFormData, titulo: e.target.value })}
                helperText="Nombre amigable del modelo (ej: GPT-4 Turbo)"
              />
              <TextField
                margin="dense"
                label="ID del Modelo"
                fullWidth
                variant="outlined"
                value={modeloIAFormData.model_id}
                onChange={(e) => setModeloIAFormData({ ...modeloIAFormData, model_id: e.target.value })}
                helperText="ID técnico para la API (ej: openai/gpt-4-turbo)"
              />
              <TextField
                margin="dense"
                label="Proveedor"
                fullWidth
                variant="outlined"
                value={modeloIAFormData.proveedor}
                onChange={(e) => setModeloIAFormData({ ...modeloIAFormData, proveedor: e.target.value })}
                helperText="Proveedor del modelo (ej: OpenAI, Anthropic, Meta)"
              />
              <TextField
                margin="dense"
                label="Descripción"
                fullWidth
                variant="outlined"
                multiline
                rows={3}
                value={modeloIAFormData.descripcion}
                onChange={(e) => setModeloIAFormData({ ...modeloIAFormData, descripcion: e.target.value })}
                helperText="Descripción del modelo y sus características"
              />
              <FormControl fullWidth margin="dense">
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={modeloIAFormData.categoria}
                  label="Categoría"
                  onChange={(e) => setModeloIAFormData({ ...modeloIAFormData, categoria: e.target.value as 'premium' | 'standard' | 'budget' })}
                >
                  <MenuItem value="premium">Premium</MenuItem>
                  <MenuItem value="standard">Standard</MenuItem>
                  <MenuItem value="budget">Budget</MenuItem>
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Switch
                    checked={modeloIAFormData.recomendado}
                    onChange={(e) => setModeloIAFormData({ ...modeloIAFormData, recomendado: e.target.checked })}
                  />
                }
                label="Recomendado para reportes psicopedagógicos"
                sx={{ mt: 2 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={modeloIAFormData.activo}
                    onChange={(e) => setModeloIAFormData({ ...modeloIAFormData, activo: e.target.checked })}
                  />
                }
                label="Activo"
                sx={{ mt: 1 }}
              />
            </>
          ) : (
            <>
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
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={
              currentCatalogo === 'modelos-ia'
                ? (!modeloIAFormData.titulo.trim() || !modeloIAFormData.model_id.trim() || !modeloIAFormData.proveedor.trim() || loading)
                : (!formData.titulo.trim() || loading)
            }
          >
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
