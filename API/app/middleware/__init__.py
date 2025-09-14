"""
Middleware para la aplicación.
"""
from .rate_limit import registro_rate_limiter

__all__ = ['registro_rate_limiter']
