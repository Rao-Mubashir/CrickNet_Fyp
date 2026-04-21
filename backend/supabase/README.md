# Supabase Configuration Guide

## Setup Instructions

### 1. Project Credentials
Your Supabase credentials are already stored in `.env`:
- `SUPABASE_URL`: Your project URL
- `SUPABASE_ANON_KEY`: Anonymous key for client operations

### 2. Database Schema
The database schema is managed through SQL migrations in the `migrations/` folder:

1. **001_create_users_table.sql** - User accounts table
   - Fields: id, name, email, hashed_password, created_at, updated_at
   - Row Level Security enabled
   - Email uniqueness enforced

2. **002_create_analyses_table.sql** - Cricket analysis results table
   - Fields: id, user_id, speed, trajectory, detections, processing_time, created_at
   - Foreign key to users table
   - Row Level Security enabled

3. **003_create_updated_at_trigger.sql** - Automatic timestamp updates
   - Auto-updates the `updated_at` field on user modifications

### 3. Applying Migrations

#### Option A: Manual (Recommended for first setup)
1. Go to Supabase Dashboard → SQL Editor
2. Create a new query
3. Copy-paste contents from each migration file in order (001, 002, 003)
4. Execute each migration

#### Option B: Using Supabase CLI
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Apply migrations
supabase db push
```

### 4. Row Level Security (RLS)
All tables have RLS enabled with policies that ensure users can only access their own data:

**Users Table:**
- `SELECT`: Users can view their own data (auth.uid() = id)
- `UPDATE`: Users can update their own data

**Analyses Table:**
- `SELECT`: Users can view only their analyses
- `INSERT`: Users can insert only their analyses
- `DELETE`: Users can delete only their analyses

### 5. Testing Connection
Run the backend and test the database connection:
```bash
python -m pytest tests/test_db_connection.py
```

### 6. Troubleshooting

**Error: "Supabase credentials not configured"**
- Ensure `.env` file exists with `SUPABASE_URL` and `SUPABASE_ANON_KEY`

**Error: "Failed to create user"**
- Check if users table exists (run migrations)
- Verify RLS policies allow INSERT operations

**Error: "Foreign key constraint"**
- Ensure user_id references valid user in users table
- Check that analyses table has been created (migration 002)

### 7. Security Notes
- Never commit `.env` file to version control
- Rotate `SUPABASE_ANON_KEY` regularly in production
- Use environment-specific keys for different deployments
