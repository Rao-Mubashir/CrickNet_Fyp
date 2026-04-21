# Backend Setup & Deployment Guide

## Prerequisites
- Python 3.10+ (not 3.14, use Python 3.10)
- Virtual environment (venv)
- Supabase account with project

## Quick Start

### 1. Setup Python Environment
```bash
cd backend

# Create virtual environment using Python 3.10
py -3.10 -m venv venv

# Activate virtual environment
# Windows CMD:
venv\Scripts\activate.bat

# Windows PowerShell:
venv\Scripts\Activate.ps1

# Mac/Linux:
source venv/bin/activate
```

### 2. Install Dependencies
```bash
# Upgrade pip
pip install --upgrade pip

# Install requirements
pip install -r requirements.txt
```

### 3. Configure Environment
Ensure `.env` file exists with:
```
SUPABASE_URL=https://jwixmhrsagenbhrecjpr.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SECRET_KEY=your_secret_key_here
```

### 4. Setup Database (One-time)

#### Option A: Manual Setup (Recommended)
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to SQL Editor
3. Create a new query
4. Copy-paste SQL from `supabase/migrations/001_create_users_table.sql`
5. Execute query
6. Repeat steps 3-5 for `002_create_analyses_table.sql` and `003_create_updated_at_trigger.sql`

#### Option B: Using CLI
```bash
npm install -g supabase
supabase login
supabase db push
```

### 5. Run the Backend

#### Development Mode
```bash
# With auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Production Mode
```bash
# Without auto-reload
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

The API will be available at: `http://localhost:8000`
Documentation: `http://localhost:8000/docs`

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── config.py              # Configuration
│   ├── auth/                  # Authentication
│   │   ├── __init__.py
│   │   ├── models.py          # Pydantic models
│   │   ├── utils.py           # Helper functions
│   │   └── routes.py          # Endpoints
│   ├── analysis/              # Video analysis
│   │   ├── __init__.py
│   │   ├── models.py          # Models
│   │   ├── utils.py           # Utilities
│   │   └── routes.py          # Endpoints
│   └── database/              # Database
│       ├── __init__.py
│       ├── models.py          # DB models
│       └── client.py          # Supabase client
├── main.py                    # App entry point
├── requirements.txt           # Dependencies
├── .env                       # Environment variables (gitignored)
├── .gitignore                 # Git ignore rules
├── API_ENDPOINTS.md           # API documentation
├── uploads/                   # Video uploads directory
└── supabase/                  # Database setup
    ├── migrations/            # SQL migrations
    ├── README.md              # Setup guide
    └── config.json            # Configuration
```

## Common Commands

### Run tests
```bash
pytest tests/
```

### Format code
```bash
black .
```

### Lint
```bash
flake8 app/
```

### Check types
```bash
mypy app/
```

## Troubleshooting

### "ModuleNotFoundError: No module named 'app'"
- Ensure you're running from the `backend/` directory
- Check that `.env` file exists with Supabase credentials

### "Failed to connect to Supabase"
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env`
- Check Supabase project is active
- Verify network connectivity

### "Table does not exist"
- Run the migrations from `supabase/migrations/`
- Check database in Supabase Dashboard → Tables

### Port 8000 already in use
```bash
# Use a different port
uvicorn main:app --port 8001
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Supabase project URL | `https://xxxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Anonymous key for client | `eyJhbGc...` |
| `SECRET_KEY` | JWT secret key | Random 32+ char string |

## Security Notes

- Never commit `.env` file
- Rotate keys regularly in production
- Use environment-specific keys for different deployments
- Enable CORS only for your frontend domain in production

## Performance Tips

- Use `--workers 4` in production for multi-core systems
- Enable caching for frequently accessed data
- Use CDN for video uploads
- Monitor database query performance in Supabase Dashboard

## Next Steps

1. ✅ Backend setup complete
2. Update frontend API client to use new endpoints
3. Add additional features (video storage, analytics)
4. Setup CI/CD pipeline
5. Deploy to production server
