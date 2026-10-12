# Database folder

This folder contains everything PostgreSQL-related.

## Layout

```
database/
├── migrations/      Numbered SQL files applied in order
└── seed/            Reference data + a Node.js script seeds users
```

## How to apply

From the `backend/` folder:

```bash
npm run migrate    # runs every file in ../database/migrations in lexicographic order
npm run seed       # idempotent; safe to re-run
```

The migration runner opens one transaction per file. A failing migration is rolled back so the schema is never half-applied.

## Notes

- All schema changes happen via migrations, not via ad-hoc application startup code.
- The seed script generates bcrypt-hashed passwords at runtime using the `SEED_*` env vars in `backend/.env`.
- The seed includes a few rows of demo data (skin profile, concerns, progress records, an appointment, and a routine with steps) for the first demo user so the dashboard is not empty on first login.
