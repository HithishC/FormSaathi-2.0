# FormSaathi 2.0

A scholarship assistance platform built with Next.js, React, TypeScript and FastAPI.

## Project Structure

- frontend/ — Next.js application
- backend/ — FastAPI application

## Requirements

- Node.js and npm
- Python 3.10+

## Backend Setup

    cd backend
    python -m venv .venv
    .\.venv\Scripts\Activate.ps1
    pip install -r requirements.txt
    Copy-Item .env.example .env

Configure SECRET_KEY and ENCRYPTION_KEY in backend/.env.

Start backend:

    python run.py

## Frontend Setup

    cd frontend
    npm ci

Create frontend/.env.local:

    NEXT_PUBLIC_API_URL=http://localhost:8000/api

Start frontend:

    npm run dev

Open http://localhost:3000.

## Important

- DigiLocker is configured for sandbox use.
- Some AI features require API credentials.
- Verify scholarship requirements with official authorities.
- Never upload .env files, passwords, encryption keys or private databases.

## License

All rights reserved. No open-source license has been granted.
