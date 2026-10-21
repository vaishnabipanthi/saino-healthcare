# SAINO Provider + Super Admin + Patient Marketplace — Live Data Patch

This package updates the existing SAINO project so provider, booking, queue, QR and admin views read/write PostgreSQL records instead of showing hardcoded sample patients/providers as live data.

## Important: what is connected

- List Your Care registration creates a PostgreSQL `users` account with a bcrypt password hash and a linked provider record. New providers remain pending and unpublished.
- Provider login validates email/password against PostgreSQL and issues a signed token. The provider dashboard does not open without a valid token.
- Provider dashboard doctor, service, appointments, queue, staff, payment-ledger, review-response and QR screens use records scoped to the signed-in provider.
- Reception bookings and patient website bookings are saved in `provider_appointments`. Patient PID is reused by matching email or phone; each new appointment gets a Booking ID/token, and Visit ID is created when the encounter is checked in/started/completed.
- Super Admin reads provider registrations, doctor/service records, appointments, recorded payments/subscriptions, QR scan events, reviews, notifications and audit events from PostgreSQL.
- Super Admin approval sets a provider as verified and published. Only such provider records appear in the public patient marketplace. Doctors, services and fees shown there are sourced from the provider's saved records.
- Empty database modules show empty states instead of fictional patients, scan counts, fees or vehicle ETAs.

## External integrations not enabled by this package

A real payment gateway/settlement account, live video calling, SMS/email/WhatsApp delivery, patient push notifications and hospital HIS/EMR sync need separate provider credentials and/or integration work. Payment records are labelled as manual records, not gateway-verified transactions. Telemedicine bookings can be recorded, but this does not enable a real video call or complete mandatory online payment.

Blood-stock availability and ambulance dispatch/vehicle GPS are not stored in the current provider schema; the website explicitly indicates these are not connected rather than inventing stock, drivers or ETAs.

## Setup on Windows

1. Extract the ZIP.
2. Copy the `backend` and `saino-health` folders into your project, merging/replacing files when asked. Keep any custom images or unrelated files you added.
3. **Keep your current `backend/.env` and do not replace it.** This package excludes that file to protect your database credentials. If you intentionally made a clean backup first, copy your existing `DATABASE_URL` into `backend/.env` and set a private `JWT_SECRET` at least 32 characters long. `.env.example` is only a template.
4. Make sure your existing PostgreSQL database is running and `DATABASE_URL` points to it (your local database name was `sainodb`). Do not run the old seed scripts; the seed data is only demo data.
5. Open VS Code terminal:

   ```powershell
   cd "C:\Users\lenovo\Downloads\sino health\backend"
   npm install
   npm test
   npm run dev
   ```

6. Open `http://localhost:4000/api/health`. Expected response if PostgreSQL is reachable: `{"success":true,"api":"ok","database":"connected"}`. If it reports disconnected, fix the database service or `DATABASE_URL` before testing screens.

## Test flow

1. Patient marketplace: `http://localhost:4000/`
2. List Your Care: `http://localhost:4000/list-your-care`
3. Provider login: `http://localhost:4000/provider/login.html`
4. Super Admin: `http://localhost:4000/admin/index.html`

1. Register a new provider from List Your Care with a fresh email. Do not use a password you use on other services.
2. After registration, sign in with the same email/password on Provider Login.
3. Add at least one doctor and one service/fee in the Provider Dashboard; add any profile details you need for the test.
4. Open the Super Admin page. On first setup, create an admin account from the backend terminal using `npm run create:superadmin`. Use a unique email and a strong password. There is no default admin password.
5. In Super Admin → Provider Directory, find the new provider and press **Approve & publish**.
6. Refresh the patient homepage; the approved provider, doctor and service/fee should appear from PostgreSQL. Before approval the listing stays hidden.
7. Book through the published provider profile. The confirmation shows Booking ID, PID and queue token. Check that the same booking appears in Provider → Appointments and Super Admin → Bookings. Change appointment status from the Provider Dashboard and check that the admin record changes too.
8. Generate a QR in Provider → QR Management. Open the generated `/api/public/qr/<code>` link after the provider is published. Scans and bookings are counted separately; a scan alone is not a booking.

## Security and backup notes

- Do not send or commit `.env`, database passwords, JWT secrets, or patient details.
- The patch uses additive schema migrations (CREATE/ALTER ADD COLUMN/INDEX) and does not intentionally drop existing tables or seed sample data. Back up your database before client deployment.
- Admin account creation is a separate one-time command. Never use a shared/default admin password.
- This package passed Node syntax checks for the backend and modified frontend scripts. A live database connection and full browser end-to-end test must be run on your machine because this editing environment cannot connect to your local PostgreSQL database.
