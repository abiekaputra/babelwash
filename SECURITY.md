# Security policy

## Supported version

Security fixes are applied to the latest commit on `main`.

## Reporting

Please do not open a public issue for a suspected vulnerability. Contact the repository owner through the email listed on the GitHub profile and include the affected path, reproduction steps, impact, and any suggested mitigation. Do not include real customer data.

## Local configuration

- Replace `BABELWASH_JWT_SECRET` with at least 32 random characters outside the repository.
- Treat `.env` and `runtime/` as private machine state; both are ignored by Git.
- Replace or disable demonstration users before entering non-demo data.
- Restrict `BABELWASH_WEB_ORIGIN` to the exact client origin.
- Back up the SQLite database before upgrading code or changing schema in a real evaluation environment.

The current release is designed for local portfolio evaluation and has not undergone an external security audit.
