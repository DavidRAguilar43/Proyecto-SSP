// ... (imports existentes)

export const AtencionForm: React.FC<AtencionFormProps> = ({
  open,
  onClose,
  onSubmit,
  atencion,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    fecha_atencion: new Date(),
    motivo_psicologico: false,
    motivo_academico: false,
    salud_en_general: false,
    requiere_seguimiento: false,
    requiere_canalizacion_externa: false,
    estatus_canalizacion_externa: '',
    observaciones: '',
    fecha_proxima_sesion: null as Date | null,
    id_persona: null as number | null,
    atendido: false,
    ultima_fecha_contacto: new Date(), // Precargar fecha actual
  });

  // ... (resto del código existente)

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {atencion ? `Editar Atención #${atencion.id}` : 'Nueva Atención Psicopedagógica'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              {/* Sección 1: Información básica */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color="primary">
                  Información Básica
                </Typography>
                <Divider />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={estudiantes}
                  getOptionLabel={(option) => `${option.nombre} ${option.apellido} - ${option.matricula || 'Sin matrícula'}`}
                  value={selectedEstudiante}
                  onChange={handleEstudianteChange}
                  loading={estudiantesLoading}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Estudiante"
                      required
                      fullWidth
                      placeholder="Buscar por nombre o matrícula..."
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Fecha de atención"
                  value={formData.fecha_atencion}
                  onChange={handleDateChange('fecha_atencion')}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth required />
                  )}
                />
              </Grid>

              {/* Sección 2: Motivos de atención */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color="primary">
                  Motivos de Atención
                </Typography>
                <Divider />
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.motivo_psicologico}
                      onChange={handleChange('motivo_psicologico')}
                      color="primary"
                    />
                  }
                  label="Psicológico"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.motivo_academico}
                      onChange={handleChange('motivo_academico')}
                      color="primary"
                    />
                  }
                  label="Académico"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.salud_en_general}
                      onChange={handleChange('salud_en_general')}
                      color="primary"
                    />
                  }
                  label="Salud general"
                />
              </Grid>

              {/* Sección 3: Seguimiento */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color="primary">
                  Seguimiento
                </Typography>
                <Divider />
              </Grid>

              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Último contacto"
                  value={formData.ultima_fecha_contacto}
                  onChange={handleDateChange('ultima_fecha_contacto')}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.atendido}
                      onChange={handleChange('atendido')}
                      color="primary"
                    />
                  }
                  label="Atendido"
                />
              </Grid>

              {/* Sección 4: Observaciones */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color="primary">
                  Observaciones
                </Typography>
                <Divider />
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Detalles de la atención"
                  value={formData.observaciones}
                  onChange={handleChange('observaciones')}
                  sx={{ mt: 2 }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="secondary">
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={loading || !isFormValid()}
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};
