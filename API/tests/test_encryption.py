"""
Tests unitarios para el módulo de cifrado.

Ejecutar con:
    pytest tests/test_encryption.py -v
"""

import pytest
from unittest.mock import patch, MagicMock
from cryptography.fernet import Fernet

from app.security.encryption import (
    FieldEncryption,
    encrypt_value,
    decrypt_value,
    encrypt_json,
    decrypt_json,
    EncryptionError,
    DecryptionError,
    KeyNotFoundError
)
from app.core.encryption_keys import KeyManager


class TestFieldEncryption:
    """Tests para la clase FieldEncryption."""
    
    @pytest.fixture
    def mock_key_manager(self):
        """Fixture para crear un KeyManager mock."""
        key = Fernet.generate_key().decode()
        key_id = "test_key_v1"
        
        mock_km = MagicMock(spec=KeyManager)
        mock_km.is_encryption_enabled.return_value = True
        mock_km.get_active_key.return_value = (key, key_id)
        mock_km.get_key_by_id.return_value = key
        
        return mock_km
    
    @pytest.fixture
    def field_encryption(self, mock_key_manager):
        """Fixture para crear una instancia de FieldEncryption."""
        fe = FieldEncryption()
        fe.key_manager = mock_key_manager
        return fe
    
    def test_encrypt_decrypt_basic(self, field_encryption):
        """Test básico de cifrado y descifrado."""
        original = "Datos sensibles de prueba"
        
        # Cifrar
        encrypted = field_encryption.encrypt_value(original)
        
        # Verificar formato
        assert encrypted is not None
        assert "|" in encrypted
        assert encrypted != original
        
        # Descifrar
        decrypted = field_encryption.decrypt_value(encrypted)
        
        # Verificar resultado
        assert decrypted == original
    
    def test_encrypt_none_value(self, field_encryption):
        """Test de cifrado de valor None."""
        result = field_encryption.encrypt_value(None)
        assert result is None
    
    def test_encrypt_empty_string(self, field_encryption):
        """Test de cifrado de string vacío."""
        result = field_encryption.encrypt_value("")
        assert result == ""
    
    def test_decrypt_none_value(self, field_encryption):
        """Test de descifrado de valor None."""
        result = field_encryption.decrypt_value(None)
        assert result is None
    
    def test_decrypt_empty_string(self, field_encryption):
        """Test de descifrado de string vacío."""
        result = field_encryption.decrypt_value("")
        assert result == ""
    
    def test_decrypt_unencrypted_value(self, field_encryption):
        """Test de descifrado de valor no cifrado."""
        unencrypted = "valor sin cifrar"
        result = field_encryption.decrypt_value(unencrypted)
        # Debe retornar el valor original con warning
        assert result == unencrypted
    
    def test_encrypt_with_special_characters(self, field_encryption):
        """Test de cifrado con caracteres especiales."""
        original = "Datos con ñ, á, é, í, ó, ú y símbolos: @#$%&*()"
        
        encrypted = field_encryption.encrypt_value(original)
        decrypted = field_encryption.decrypt_value(encrypted)
        
        assert decrypted == original
    
    def test_encrypt_with_unicode(self, field_encryption):
        """Test de cifrado con caracteres Unicode."""
        original = "Datos con emojis 😀🎉 y caracteres chinos 你好"
        
        encrypted = field_encryption.encrypt_value(original)
        decrypted = field_encryption.decrypt_value(encrypted)
        
        assert decrypted == original
    
    def test_encrypt_long_text(self, field_encryption):
        """Test de cifrado de texto largo."""
        original = "A" * 10000  # 10KB de texto
        
        encrypted = field_encryption.encrypt_value(original)
        decrypted = field_encryption.decrypt_value(encrypted)
        
        assert decrypted == original
    
    def test_encryption_disabled(self, field_encryption, mock_key_manager):
        """Test cuando el cifrado está deshabilitado."""
        mock_key_manager.is_encryption_enabled.return_value = False
        
        original = "Datos de prueba"
        result = field_encryption.encrypt_value(original)
        
        # Debe retornar el valor sin cifrar
        assert result == original
    
    def test_decrypt_with_invalid_format(self, field_encryption):
        """Test de descifrado con formato inválido."""
        invalid = "datos|invalidos|con|muchos|separadores"
        
        # Debe intentar descifrar y fallar o retornar original
        with pytest.raises(DecryptionError):
            field_encryption.decrypt_value(invalid)
    
    def test_decrypt_with_wrong_key(self, field_encryption, mock_key_manager):
        """Test de descifrado con llave incorrecta."""
        # Cifrar con una llave
        original = "Datos sensibles"
        encrypted = field_encryption.encrypt_value(original)
        
        # Cambiar la llave en el key_manager
        wrong_key = Fernet.generate_key().decode()
        mock_key_manager.get_key_by_id.return_value = wrong_key
        
        # Intentar descifrar debe fallar
        with pytest.raises(DecryptionError):
            field_encryption.decrypt_value(encrypted)
    
    def test_decrypt_with_missing_key(self, field_encryption, mock_key_manager):
        """Test de descifrado cuando no se encuentra la llave."""
        encrypted = "gAAAAABhkN3x...fake_encrypted_data...|missing_key_id"

        # Configurar key_manager para lanzar KeyError
        mock_key_manager.get_key_by_id.side_effect = KeyError("Llave no encontrada")

        # Debe lanzar KeyNotFoundError
        with pytest.raises(KeyNotFoundError):
            field_encryption.decrypt_value(encrypted)
    
    def test_encrypt_json_basic(self, field_encryption):
        """Test de cifrado de JSON básico."""
        original = {"nombre": "Juan", "edad": 25, "activo": True}
        
        encrypted = field_encryption.encrypt_json(original)
        decrypted = field_encryption.decrypt_json(encrypted)
        
        assert decrypted == original
    
    def test_encrypt_json_nested(self, field_encryption):
        """Test de cifrado de JSON anidado."""
        original = {
            "usuario": {
                "nombre": "María",
                "contacto": {
                    "email": "maria@example.com",
                    "telefono": "1234567890"
                }
            },
            "respuestas": [1, 2, 3, 4, 5]
        }
        
        encrypted = field_encryption.encrypt_json(original)
        decrypted = field_encryption.decrypt_json(encrypted)
        
        assert decrypted == original
    
    def test_encrypt_json_none(self, field_encryption):
        """Test de cifrado de JSON None."""
        result = field_encryption.encrypt_json(None)
        assert result is None
    
    def test_decrypt_json_none(self, field_encryption):
        """Test de descifrado de JSON None."""
        result = field_encryption.decrypt_json(None)
        assert result is None
    
    def test_key_id_in_encrypted_value(self, field_encryption, mock_key_manager):
        """Test que verifica que el key_id esté en el valor cifrado."""
        key_id = "test_key_v1"
        mock_key_manager.get_active_key.return_value = (Fernet.generate_key().decode(), key_id)
        
        original = "Datos de prueba"
        encrypted = field_encryption.encrypt_value(original)
        
        # Verificar que el key_id esté al final
        assert encrypted.endswith(f"|{key_id}")
    
    def test_multiple_encryptions_different_results(self, field_encryption):
        """Test que verifica que múltiples cifrados del mismo valor den resultados diferentes."""
        original = "Datos de prueba"
        
        encrypted1 = field_encryption.encrypt_value(original)
        encrypted2 = field_encryption.encrypt_value(original)
        
        # Los valores cifrados deben ser diferentes (Fernet usa IV aleatorio)
        assert encrypted1 != encrypted2
        
        # Pero ambos deben descifrar al mismo valor
        assert field_encryption.decrypt_value(encrypted1) == original
        assert field_encryption.decrypt_value(encrypted2) == original


class TestConvenienceFunctions:
    """Tests para las funciones de conveniencia."""
    
    @pytest.fixture(autouse=True)
    def setup_encryption(self):
        """Setup para cada test."""
        # Generar llave temporal para tests
        test_key = Fernet.generate_key().decode()
        
        with patch('app.security.encryption.key_manager') as mock_km:
            mock_km.is_encryption_enabled.return_value = True
            mock_km.get_active_key.return_value = (test_key, "test_key")
            mock_km.get_key_by_id.return_value = test_key
            yield
    
    def test_encrypt_value_function(self):
        """Test de función encrypt_value."""
        original = "Datos de prueba"
        encrypted = encrypt_value(original)
        
        assert encrypted is not None
        assert "|" in encrypted
    
    def test_decrypt_value_function(self):
        """Test de función decrypt_value."""
        original = "Datos de prueba"
        encrypted = encrypt_value(original)
        decrypted = decrypt_value(encrypted)
        
        assert decrypted == original
    
    def test_encrypt_json_function(self):
        """Test de función encrypt_json."""
        original = {"test": "data"}
        encrypted = encrypt_json(original)
        
        assert encrypted is not None
        assert "|" in encrypted
    
    def test_decrypt_json_function(self):
        """Test de función decrypt_json."""
        original = {"test": "data", "number": 123}
        encrypted = encrypt_json(original)
        decrypted = decrypt_json(encrypted)
        
        assert decrypted == original


class TestPerformance:
    """Tests de rendimiento."""
    
    @pytest.fixture
    def field_encryption(self):
        """Fixture para crear una instancia de FieldEncryption."""
        key = Fernet.generate_key().decode()
        key_id = "perf_test_key"
        
        mock_km = MagicMock(spec=KeyManager)
        mock_km.is_encryption_enabled.return_value = True
        mock_km.get_active_key.return_value = (key, key_id)
        mock_km.get_key_by_id.return_value = key
        
        fe = FieldEncryption()
        fe.key_manager = mock_km
        return fe
    
    def test_encryption_performance(self, field_encryption, benchmark):
        """Test de rendimiento de cifrado."""
        original = "Datos de prueba para benchmark"
        
        result = benchmark(field_encryption.encrypt_value, original)
        
        assert result is not None
        # El benchmark mostrará el tiempo de ejecución
    
    def test_decryption_performance(self, field_encryption, benchmark):
        """Test de rendimiento de descifrado."""
        original = "Datos de prueba para benchmark"
        encrypted = field_encryption.encrypt_value(original)
        
        result = benchmark(field_encryption.decrypt_value, encrypted)
        
        assert result == original
        # El benchmark mostrará el tiempo de ejecución


class TestKeyRotation:
    """Tests para rotación de llaves."""
    
    def test_decrypt_with_old_key(self):
        """Test de descifrado con llave antigua después de rotación."""
        # Simular dos llaves: una antigua y una nueva
        old_key = Fernet.generate_key().decode()
        new_key = Fernet.generate_key().decode()
        
        old_key_id = "key_v0_2023"
        new_key_id = "key_v1_2024"
        
        # Crear key_manager con llave antigua activa
        mock_km_old = MagicMock(spec=KeyManager)
        mock_km_old.is_encryption_enabled.return_value = True
        mock_km_old.get_active_key.return_value = (old_key, old_key_id)
        mock_km_old.get_key_by_id.return_value = old_key
        
        fe = FieldEncryption()
        fe.key_manager = mock_km_old
        
        # Cifrar con llave antigua
        original = "Datos cifrados con llave antigua"
        encrypted_with_old = fe.encrypt_value(original)
        
        # Verificar que tiene el key_id antiguo
        assert encrypted_with_old.endswith(f"|{old_key_id}")
        
        # Simular rotación: nueva llave activa, antigua en rotation_keys
        mock_km_new = MagicMock(spec=KeyManager)
        mock_km_new.is_encryption_enabled.return_value = True
        mock_km_new.get_active_key.return_value = (new_key, new_key_id)
        
        # Configurar get_key_by_id para retornar la llave correcta según el ID
        def get_key_by_id(key_id):
            if key_id == old_key_id:
                return old_key
            elif key_id == new_key_id:
                return new_key
            return None
        
        mock_km_new.get_key_by_id.side_effect = get_key_by_id
        
        fe.key_manager = mock_km_new
        
        # Debe poder descifrar datos antiguos
        decrypted = fe.decrypt_value(encrypted_with_old)
        assert decrypted == original
        
        # Nuevos cifrados deben usar la nueva llave
        new_encrypted = fe.encrypt_value("Nuevos datos")
        assert new_encrypted.endswith(f"|{new_key_id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

