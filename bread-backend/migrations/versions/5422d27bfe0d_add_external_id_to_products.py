"""add external_id to products

Revision ID: 5422d27bfe0d
Revises: 
Create Date: 2026-02-02 07:46:55.521628

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5422d27bfe0d'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('products', sa.Column('external_id', sa.String(), nullable=True))
    op.create_index('ix_products_external_id', 'products', ['external_id'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_products_external_id', table_name='products')
    op.drop_column('products', 'external_id')
