"""add billing_day to leases

Revision ID: add_billing_day
Revises: 9dcf47f1d225
Create Date: 2026-02-27 15:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_billing_day'
down_revision: Union[str, None] = '9dcf47f1d225'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 添加 billing_day 字段，默认为 1
    op.add_column('leases', sa.Column('billing_day', sa.Integer(), nullable=True))

    # 将现有租约的 billing_day 设置为 start_date 的日
    op.execute("""
        UPDATE leases
        SET billing_day = EXTRACT(DAY FROM start_date)::integer
        WHERE billing_day IS NULL
    """)

    # 限制 billing_day 范围为 1-28
    op.execute("""
        UPDATE leases
        SET billing_day = 28
        WHERE billing_day > 28
    """)

    # 设置为非空
    op.alter_column('leases', 'billing_day', nullable=False)


def downgrade() -> None:
    op.drop_column('leases', 'billing_day')
