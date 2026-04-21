"""
Tests de integración para cifrado automático en modelos.

Estos tests verifican que el cifrado/descifrado funciona correctamente
cuando se usan los modelos con la base de datos.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime

from app.db.database import Base
from app.models.persona import User
from app.models.contacto_emergencia import ContactoEmergencia
from app.models.cuestionario_admin import RespuestaPregunta, ReporteIA, RespuestaCuestionario
from app.models.encryption_mixin import setup_all_encryption_listeners
from app.core.security import get_password_hash


# Configurar base de datos de prueba en memoria
TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(scope="function")
def db_session():
    """
    Crea una sesión de base de datos de prueba.
    
    Usa SQLite en memoria para tests rápidos y aislados.
    """
    # Crear engine de prueba
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
    
    # Crear todas las tablas
    Base.metadata.create_all(bind=engine)
    
    # Configurar listeners de cifrado
    setup_all_encryption_listeners()
    
    # Crear sesión
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    
    yield session
    
    # Limpiar
    session.close()
    Base.metadata.drop_all(bind=engine)


class TestUserEncryption:
    """Tests de cifrado para el modelo User."""
    
    def test_user_fields_encrypted_on_insert(self, db_session):
        """Test que los campos se cifran al insertar un usuario."""
        # Crear usuario
        user = User(
            sexo="masculino",
            genero="masculino",
            edad=25,
            estado_civil="soltero",
            lugar_trabajo="UNAM",
            lugar_origen="CDMX",
            colonia_residencia_actual="Del Valle",
            celular="5551234567",
            extension_telefonica="1234",
            correo_institucional="test@unam.mx",
            observaciones="Estudiante destacado",
            matricula="2024001",
            rol="alumno",
            hashed_password=get_password_hash("password123")
        )

        db_session.add(user)
        db_session.commit()
        user_id = user.id

        # Verificar que el usuario se guardó
        assert user_id is not None

        # Recargar el usuario para verificar que se descifra correctamente
        db_session.expunge_all()
        loaded_user = db_session.query(User).filter(User.id == user_id).first()

        # Los campos deben estar descifrados después de recargar
        assert loaded_user.celular == "5551234567"
        assert loaded_user.lugar_trabajo == "UNAM"
        assert loaded_user.colonia_residencia_actual == "Del Valle"
        assert loaded_user.extension_telefonica == "1234"
        assert loaded_user.observaciones == "Estudiante destacado"
    
    def test_user_fields_decrypted_on_load(self, db_session):
        """Test que los campos se descifran al cargar un usuario."""
        # Crear y guardar usuario
        user = User(
            sexo="femenino",
            genero="femenino",
            edad=22,
            estado_civil="soltera",
            lugar_trabajo="IPN",
            lugar_origen="Guadalajara",
            colonia_residencia_actual="Roma Norte",
            celular="5559876543",
            correo_institucional="test2@unam.mx",
            matricula="2024002",
            rol="alumno",
            hashed_password=get_password_hash("password456")
        )
        
        db_session.add(user)
        db_session.commit()
        user_id = user.id
        
        # Limpiar sesión para forzar recarga desde BD
        db_session.expunge_all()
        
        # Cargar usuario desde BD
        loaded_user = db_session.query(User).filter(User.id == user_id).first()
        
        # Verificar que los campos están descifrados
        assert loaded_user.celular == "5559876543"
        assert loaded_user.lugar_trabajo == "IPN"
        assert loaded_user.colonia_residencia_actual == "Roma Norte"
    
    def test_user_fields_with_none_values(self, db_session):
        """Test que los campos None se manejan correctamente."""
        user = User(
            sexo="otro",
            genero="no_binario",
            edad=30,
            estado_civil="soltero",
            lugar_origen="Monterrey",
            colonia_residencia_actual="Centro",
            celular="5551111111",
            correo_institucional="test3@unam.mx",
            matricula="2024003",
            rol="alumno",
            hashed_password=get_password_hash("password789"),
            # Campos opcionales como None
            lugar_trabajo=None,
            extension_telefonica=None,
            observaciones=None
        )
        
        db_session.add(user)
        db_session.commit()
        user_id = user.id
        
        # Recargar
        db_session.expunge_all()
        loaded_user = db_session.query(User).filter(User.id == user_id).first()
        
        # Verificar que None se mantiene
        assert loaded_user.lugar_trabajo is None
        assert loaded_user.extension_telefonica is None
        assert loaded_user.observaciones is None


class TestContactoEmergenciaEncryption:
    """Tests de cifrado para el modelo ContactoEmergencia."""
    
    def test_contacto_fields_encrypted(self, db_session):
        """Test que los campos de contacto se cifran."""
        # Primero crear un usuario
        user = User(
            sexo="masculino",
            genero="masculino",
            edad=20,
            estado_civil="soltero",
            lugar_origen="CDMX",
            colonia_residencia_actual="Polanco",
            celular="5552222222",
            correo_institucional="test4@unam.mx",
            matricula="2024004",
            rol="alumno",
            hashed_password=get_password_hash("password000")
        )
        db_session.add(user)
        db_session.commit()
        
        # Crear contacto de emergencia
        contacto = ContactoEmergencia(
            nombre_contacto="María García",
            telefono_contacto="5553333333",
            parentesco="Madre",
            id_user=user.id
        )
        
        db_session.add(contacto)
        db_session.commit()
        contacto_id = contacto.id_contacto
        
        # Recargar
        db_session.expunge_all()
        loaded_contacto = db_session.query(ContactoEmergencia).filter(
            ContactoEmergencia.id_contacto == contacto_id
        ).first()
        
        # Verificar descifrado
        assert loaded_contacto.nombre_contacto == "María García"
        assert loaded_contacto.telefono_contacto == "5553333333"


class TestRespuestaPreguntaEncryption:
    """Tests de cifrado para el modelo RespuestaPregunta."""
    
    def test_respuesta_json_encrypted(self, db_session):
        """Test que el campo JSON valor se cifra."""
        # Crear usuario
        user = User(
            sexo="femenino",
            genero="femenino",
            edad=21,
            estado_civil="soltera",
            lugar_origen="Puebla",
            colonia_residencia_actual="Condesa",
            celular="5554444444",
            correo_institucional="test5@unam.mx",
            matricula="2024005",
            rol="alumno",
            hashed_password=get_password_hash("password111")
        )
        db_session.add(user)
        db_session.commit()
        
        # Crear respuesta de cuestionario
        respuesta_cuestionario = RespuestaCuestionario(
            id="resp-001",
            usuario_id=user.id,
            estado="completado"
        )
        db_session.add(respuesta_cuestionario)
        db_session.commit()
        
        # Crear respuesta de pregunta con JSON
        respuesta_pregunta = RespuestaPregunta(
            respuesta_cuestionario_id="resp-001",
            valor={"pregunta_1": "Me siento ansioso", "nivel": 7},
            texto_otro="Detalles adicionales sensibles"
        )
        
        db_session.add(respuesta_pregunta)
        db_session.commit()
        respuesta_id = respuesta_pregunta.id
        
        # Recargar
        db_session.expunge_all()
        loaded_respuesta = db_session.query(RespuestaPregunta).filter(
            RespuestaPregunta.id == respuesta_id
        ).first()
        
        # Verificar descifrado de JSON
        assert loaded_respuesta.valor == {"pregunta_1": "Me siento ansioso", "nivel": 7}
        assert loaded_respuesta.texto_otro == "Detalles adicionales sensibles"


class TestReporteIAEncryption:
    """Tests de cifrado para el modelo ReporteIA."""
    
    def test_reporte_contenido_encrypted(self, db_session):
        """Test que el contenido del reporte se cifra."""
        # Crear usuario
        user = User(
            sexo="masculino",
            genero="masculino",
            edad=23,
            estado_civil="soltero",
            lugar_origen="Querétaro",
            colonia_residencia_actual="Coyoacán",
            celular="5555555555",
            correo_institucional="test6@unam.mx",
            matricula="2024006",
            rol="alumno",
            hashed_password=get_password_hash("password222")
        )
        db_session.add(user)
        db_session.commit()
        
        # Crear respuesta de cuestionario
        respuesta_cuestionario = RespuestaCuestionario(
            id="resp-002",
            usuario_id=user.id,
            estado="completado"
        )
        db_session.add(respuesta_cuestionario)
        db_session.commit()
        
        # Crear reporte IA
        reporte = ReporteIA(
            id="reporte-001",
            respuesta_cuestionario_id="resp-002",
            contenido="Análisis psicopedagógico confidencial del estudiante...",
            version=1,
            es_actual=True
        )
        
        db_session.add(reporte)
        db_session.commit()
        reporte_id = reporte.id
        
        # Recargar
        db_session.expunge_all()
        loaded_reporte = db_session.query(ReporteIA).filter(
            ReporteIA.id == reporte_id
        ).first()
        
        # Verificar descifrado
        assert loaded_reporte.contenido == "Análisis psicopedagógico confidencial del estudiante..."

