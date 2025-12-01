"""add house_number to jobs, worker_profiles, employer_profiles

Revision ID: 2025_12_01_1008
Revises: 
Create Date: 2025-12-01 10:08:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2025_12_01_1008'
down_revision = None  # Set this to the previous migration ID if needed
branch_labels = None
depends_on = None


def upgrade():
    # Add house_number column to jobs table
    op.add_column('jobs', sa.Column('house_number', sa.String(), nullable=True))
    
    # Add house_number column to worker_profiles table
    op.add_column('worker_profiles', sa.Column('house_number', sa.String(), nullable=True))
    
    # Add house_number column to employer_profiles table
    op.add_column('employer_profiles', sa.Column('house_number', sa.String(), nullable=True))


def downgrade():
    # Remove house_number column from employer_profiles table
    op.drop_column('employer_profiles', 'house_number')
    
    # Remove house_number column from worker_profiles table
    op.drop_column('worker_profiles', 'house_number')
    
    # Remove house_number column from jobs table
    op.drop_column('jobs', 'house_number')
