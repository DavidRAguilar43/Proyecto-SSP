"""
Servicio para renderizar Markdown a HTML.
"""

from typing import Optional
import markdown2
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MarkdownService:
    """Servicio para convertir Markdown a HTML."""

    def __init__(self):
        """Inicializar el servicio de Markdown."""
        # Configurar extras de markdown2 para mejor renderizado
        self.extras = [
            'fenced-code-blocks',  # Bloques de código con ```
            'tables',              # Tablas
            'break-on-newline',    # Saltos de línea
            'header-ids',          # IDs en headers
            'task_list',           # Listas de tareas
            'strike',              # Texto tachado
            'cuddled-lists',       # Listas mejor formateadas
        ]

    def render_to_html(self, markdown_content: str, add_css: bool = True) -> str:
        """
        Convertir contenido Markdown a HTML.

        Args:
            markdown_content: Contenido en formato Markdown
            add_css: Si se debe agregar CSS básico para estilizar el HTML

        Returns:
            str: Contenido HTML renderizado
        """
        try:
            # Convertir Markdown a HTML
            html_content = markdown2.markdown(
                markdown_content,
                extras=self.extras
            )

            # Agregar CSS básico si se solicita
            if add_css:
                html_content = self._wrap_with_css(html_content)

            return html_content

        except Exception as e:
            logger.error(f"Error renderizando Markdown a HTML: {e}")
            # En caso de error, devolver el contenido original envuelto en <pre>
            return f"<pre>{markdown_content}</pre>"

    def _wrap_with_css(self, html_content: str) -> str:
        """
        Envolver el contenido HTML con CSS básico para mejor visualización.

        Args:
            html_content: Contenido HTML

        Returns:
            str: HTML con CSS incluido
        """
        css = """
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 900px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f9f9f9;
            }
            h1, h2, h3, h4, h5, h6 {
                color: #2c3e50;
                margin-top: 24px;
                margin-bottom: 16px;
                font-weight: 600;
                line-height: 1.25;
            }
            h1 {
                font-size: 2em;
                border-bottom: 2px solid #eaecef;
                padding-bottom: 0.3em;
            }
            h2 {
                font-size: 1.5em;
                border-bottom: 1px solid #eaecef;
                padding-bottom: 0.3em;
            }
            h3 {
                font-size: 1.25em;
            }
            p {
                margin-bottom: 16px;
            }
            ul, ol {
                margin-bottom: 16px;
                padding-left: 2em;
            }
            li {
                margin-bottom: 8px;
            }
            code {
                background-color: #f6f8fa;
                border-radius: 3px;
                font-size: 85%;
                margin: 0;
                padding: 0.2em 0.4em;
                font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
            }
            pre {
                background-color: #f6f8fa;
                border-radius: 6px;
                font-size: 85%;
                line-height: 1.45;
                overflow: auto;
                padding: 16px;
                margin-bottom: 16px;
            }
            pre code {
                background-color: transparent;
                border: 0;
                display: inline;
                line-height: inherit;
                margin: 0;
                overflow: visible;
                padding: 0;
                word-wrap: normal;
            }
            table {
                border-collapse: collapse;
                border-spacing: 0;
                margin-bottom: 16px;
                width: 100%;
            }
            table th {
                font-weight: 600;
                background-color: #f6f8fa;
            }
            table th, table td {
                border: 1px solid #dfe2e5;
                padding: 6px 13px;
            }
            table tr {
                background-color: #fff;
                border-top: 1px solid #c6cbd1;
            }
            table tr:nth-child(2n) {
                background-color: #f6f8fa;
            }
            blockquote {
                border-left: 4px solid #dfe2e5;
                color: #6a737d;
                padding: 0 1em;
                margin: 0 0 16px 0;
            }
            hr {
                background-color: #e1e4e8;
                border: 0;
                height: 2px;
                margin: 24px 0;
            }
            .urgente {
                background-color: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 12px;
                margin: 16px 0;
                border-radius: 4px;
            }
            .importante {
                background-color: #d1ecf1;
                border-left: 4px solid #17a2b8;
                padding: 12px;
                margin: 16px 0;
                border-radius: 4px;
            }
        </style>
        """

        # Resaltar palabras clave importantes
        html_content = html_content.replace(
            'URGENTE',
            '<span style="color: #dc3545; font-weight: bold;">⚠️ URGENTE</span>'
        )
        html_content = html_content.replace(
            'IMPORTANTE:',
            '<span style="color: #ffc107; font-weight: bold;">⚡ IMPORTANTE:</span>'
        )

        return f"""
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reporte Psicopedagógico</title>
            {css}
        </head>
        <body>
            {html_content}
        </body>
        </html>
        """


# Instancia global del servicio
markdown_service = MarkdownService()

