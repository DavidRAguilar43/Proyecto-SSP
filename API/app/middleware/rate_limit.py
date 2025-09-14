"""
Rate limiting middleware para endpoints sensibles.
"""
from typing import Dict
from datetime import datetime, timedelta
from fastapi import HTTPException, Request
import logging

# Logger para rate limiting
rate_limit_logger = logging.getLogger("rate_limit")

# Almacén en memoria para rate limiting (en producción usar Redis)
rate_limit_store: Dict[str, Dict[str, any]] = {}

class RateLimiter:
    def __init__(self, max_requests: int = 5, window_minutes: int = 15):
        """
        Rate limiter simple.
        
        Args:
            max_requests: Máximo número de requests permitidos
            window_minutes: Ventana de tiempo en minutos
        """
        self.max_requests = max_requests
        self.window_minutes = window_minutes
    
    def check_rate_limit(self, request: Request, endpoint: str = "default") -> bool:
        """
        Verifica si la IP ha excedido el rate limit.
        
        Args:
            request: Request de FastAPI
            endpoint: Nombre del endpoint para tracking separado
            
        Returns:
            True si está dentro del límite, False si excede
            
        Raises:
            HTTPException: Si excede el rate limit
        """
        client_ip = request.client.host
        key = f"{client_ip}:{endpoint}"
        now = datetime.now()
        
        # Limpiar entradas expiradas
        self._cleanup_expired_entries(now)
        
        # Obtener o crear entrada para esta IP
        if key not in rate_limit_store:
            rate_limit_store[key] = {
                'requests': [],
                'first_request': now
            }
        
        entry = rate_limit_store[key]
        window_start = now - timedelta(minutes=self.window_minutes)
        
        # Filtrar requests dentro de la ventana de tiempo
        entry['requests'] = [req_time for req_time in entry['requests'] if req_time > window_start]
        
        # Verificar si excede el límite
        if len(entry['requests']) >= self.max_requests:
            rate_limit_logger.warning(
                f"RATE LIMIT EXCEEDED: IP {client_ip} excedió {self.max_requests} "
                f"requests en {self.window_minutes} minutos para endpoint {endpoint}"
            )
            raise HTTPException(
                status_code=429,
                detail=f"Demasiadas solicitudes. Máximo {self.max_requests} por {self.window_minutes} minutos."
            )
        
        # Agregar esta request
        entry['requests'].append(now)
        
        rate_limit_logger.info(
            f"RATE LIMIT OK: IP {client_ip} - {len(entry['requests'])}/{self.max_requests} "
            f"requests en ventana de {self.window_minutes} minutos"
        )
        
        return True
    
    def _cleanup_expired_entries(self, now: datetime):
        """Limpia entradas expiradas del store."""
        cutoff = now - timedelta(minutes=self.window_minutes * 2)  # Doble ventana para seguridad
        
        expired_keys = []
        for key, entry in rate_limit_store.items():
            if entry.get('first_request', now) < cutoff and not entry.get('requests'):
                expired_keys.append(key)
        
        for key in expired_keys:
            del rate_limit_store[key]

# Instancia global para registro
registro_rate_limiter = RateLimiter(max_requests=3, window_minutes=15)
