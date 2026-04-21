"""Remove min_tokens column

Revision ID: e12fca05d442
Revises: 95389aee6182
Create Date: 2025-11-05 17:58:20.207050

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e12fca05d442'
down_revision: Union[str, None] = '95389aee6182'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: Remove min_tokens column from cuestionarios_admin."""
    # Remove min_tokens column
    op.drop_column('cuestionarios_admin', 'min_tokens')


def downgrade() -> None:
    """Downgrade schema: Restore min_tokens column to cuestionarios_admin."""
    # Restore min_tokens column with default value
    op.add_column('cuestionarios_admin', sa.Column('min_tokens', sa.Integer(), nullable=True, server_default='1000'))
