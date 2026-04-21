"""merge_heads

Revision ID: c82fa1995974
Revises: 005, fix_reportes_tz_20251105_192457, e12fca05d442
Create Date: 2025-11-06 13:09:49.871465

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c82fa1995974'
down_revision: Union[str, None] = ('005', 'fix_reportes_tz_20251105_192457', 'e12fca05d442')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
