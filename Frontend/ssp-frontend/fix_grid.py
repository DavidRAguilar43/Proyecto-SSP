#!/usr/bin/env python3
"""
Script para corregir los Grid items de MUI v5 a v6
"""

import re
import os

def fix_grid_items(file_path):
    """Corregir Grid items en un archivo"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Reemplazar Grid item xs={12} sm={6} con Grid size={{ xs: 12, sm: 6 }}
    content = re.sub(r'<Grid item xs=\{12\} sm=\{6\}>', '<Grid size={{ xs: 12, sm: 6 }}>', content)
    
    # Reemplazar Grid item xs={12} con Grid size={{ xs: 12 }}
    content = re.sub(r'<Grid item xs=\{12\}>', '<Grid size={{ xs: 12 }}>', content)
    
    # Reemplazar Grid item xs={12} md={4} con Grid size={{ xs: 12, md: 4 }}
    content = re.sub(r'<Grid item xs=\{12\} md=\{4\}>', '<Grid size={{ xs: 12, md: 4 }}>', content)
    
    # Reemplazar Grid item xs={12} md={8} con Grid size={{ xs: 12, md: 8 }}
    content = re.sub(r'<Grid item xs=\{12\} md=\{8\}>', '<Grid size={{ xs: 12, md: 8 }}>', content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ Corregido: {file_path}")

# Archivos a corregir
files_to_fix = [
    'src/components/AlumnoPerfilForm.tsx',
    'src/components/AlumnoRegistroForm.tsx'
]

for file_path in files_to_fix:
    if os.path.exists(file_path):
        fix_grid_items(file_path)
    else:
        print(f"❌ Archivo no encontrado: {file_path}")

print("🎉 ¡Corrección de Grid items completada!")
