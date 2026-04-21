"""Fix timezone for reportes IA fecha_generacion

Revision ID: fix_reportes_tz_20251105_192457
Revises: 
Create Date: 2025-11-05 19:24:57

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

# revision identifiers, used by Alembic.
revision = 'fix_reportes_tz_20251105_192457'
down_revision = None  # Actualizar esto manualmente si hay una migración anterior
branch_labels = None
depends_on = None

MEXICO_TZ = ZoneInfo("America/Mexico_City")

def upgrade():
    """
    Corregir las fechas de reportes IA que están en UTC a hora de México.
    Resta 6 horas (diferencia UTC vs México Central) a todas las fechas existentes.
    """
    # Usar raw SQL para SQLite
    # SQLite no tiene funciones de timezone nativas, pero podemos restar 6 horas
    # usando datetime con modificadores
    
    connection = op.get_bind()
    
    # Actualizar fecha_generacion restando 6 horas (UTC-6 = México)
    connection.execute(sa.text(
        """
        UPDATE reportes_ia 
        SET fecha_generacion = datetime(fecha_generacion, '-6 hours')
        WHERE fecha_generacion IS NOT NULL
        """
    ))
    
    # Actualizar created_at restando 6 horas
    connection.execute(sa.text(
        """
        UPDATE reportes_ia 
        SET created_at = datetime(created_at, '-6 hours')
        WHERE created_at IS NOT NULL
        """
    ))
    
    print("✅ Fechas de reportes IA corregidas a hora de México")

def downgrade():
    """
    Revertir las fechas a UTC (sumar 6 horas).
    """
    connection = op.get_bind()
    
    # Revertir fecha_generacion sumando 6 horas
    connection.execute(sa.text(
        """
        UPDATE reportes_ia 
        SET fecha_generacion = datetime(fecha_generacion, '+6 hours')
        WHERE fecha_generacion IS NOT NULL
        """
    ))
    
    # Revertir created_at sumando 6 horas
    connection.execute(sa.text(
        """
        UPDATE reportes_ia 
        SET created_at = datetime(created_at, '+6 hours')
        WHERE created_at IS NOT NULL
        """
    ))
    
    print("⏪ Fechas de reportes IA revertidas a UTC")
