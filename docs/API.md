# SCMS API Reference

Base URL: `/api`

All responses use the same envelope:

```json
{ "success": true,  "message": "Optional message", "data": { ... } }
{ "success": false, "message": "Human message",   "error": "Optional technical detail" }
```

Authentication: `Authorization: Bearer <jwt>`. Tokens are returned by `/auth/login` and `/auth/register`.

| Role    | Description |
|---------|-------------|
| Public  | No token required |
| User    | Any authenticated user |
| Admin   | User with `role = 'ADMIN'` |

---

## Auth

### `POST /auth/register` *(public, rate-limited)*
```json
{
  "full_name": "Alice",
  "email": "alice@example.com",
  "password": "StrongP@ss123",
  "phone": "+1-555-0000",
  "date_of_birth": "1990-01-01",
  "gender": "FEMALE"
}
```
→ `{ "data": { "token": "...", "user": { ... } } }`

### `POST /auth/login` *(public, rate-limited)*
```json
{ "email": "alice@example.com", "password": "StrongP@ss123" }
```

### `GET /auth/me` *(user)*
Returns the authenticated user.

### `POST /auth/logout` *(user)*
Stateless logout — client should drop the token.

---

## Skin profile

### `GET /profile` *(user)*
### `POST /profile` *(user)*
### `PUT /profile` *(user)*
Body: `{ skin_type: "COMBINATION", notes: "..." }`

### `GET /skin-concerns` *(public)*
### `GET /profile/concerns` *(user)*
### `PUT /profile/concerns` *(user)*
Body:
```json
{
  "concerns": [
    { "concern_id": "1", "severity": 3, "notes": "Mostly chin" }
  ]
}
```

---

## Products

### `GET /products` *(public)* — supports `?search=`, `?category_id=`, `?skin_type=`
### `GET /products/:id` *(public)*

### `POST /products` *(admin)*
### `PUT /products/:id` *(admin)*
### `PATCH /products/:id/status` *(admin)* — `{ is_active: true|false }`
### `DELETE /products/:id` *(admin)* — soft delete

---

## Categories

### `GET /categories` *(public)*

### `POST /categories` *(admin)* — `{ name, description? }`
### `PUT /categories/:id` *(admin)*
### `PATCH /categories/:id/status` *(admin)* — `{ is_active }`

---

## My products (cabinet)

### `GET /my-products` *(user)*
### `POST /my-products` *(user)*
```json
{ "product_id": "5", "status": "CURRENT", "frequency": "Daily", "rating": 4 }
```
### `PUT /my-products/:id` *(user)*
### `DELETE /my-products/:id` *(user)*

---

## Routines

### `GET /routines` *(user)*
### `GET /routines/:id` *(user)* — includes products in `step_order`
### `POST /routines` *(user)* — supports `products: [{ product_id, step_order, frequency? }]`
### `PUT /routines/:id` *(user)* — replacing `products` reorders the routine atomically
### `DELETE /routines/:id` *(user)*

### `POST /routines/:id/products` *(user)*
### `PUT /routines/:id/products/:routineProductId` *(user)*
### `DELETE /routines/:id/products/:routineProductId` *(user)*

---

## Progress

### `GET /progress` *(user)*
### `GET /progress/:id` *(user)*
### `POST /progress` *(user)*
```json
{
  "recorded_date": "2024-05-01",
  "acne_severity": 3,
  "dryness_level": 2,
  "oiliness_level": 3,
  "redness_level": 1,
  "overall_condition_score": 4,
  "notes": "Skin felt calmer",
  "image_url": "https://..."
}
```
### `PUT /progress/:id` *(user)*
### `DELETE /progress/:id` *(user)*

---

## Appointments

### `GET /appointments` *(user, admin can pass `?user_id=`)* — also supports `?status=`, `?from=`, `?to=`
### `POST /appointments` *(user)*
```json
{ "appointment_date": "2024-05-15", "appointment_time": "10:00", "reason": "Skin review", "notes": "..." }
```
### `PUT /appointments/:id` *(user)* — owner only
### `PATCH /appointments/:id/status` *(admin)* — `{ "status": "CONFIRMED" }`

---

## Dashboard

### `GET /dashboard` *(user)*
Returns aggregated user data for the dashboard, including `progress_history` for the chart.

---

## Admin

### `GET /admin/stats` *(admin)*
Aggregate totals + recent registrations + products per category.

### `GET /admin/users` *(admin)* — supports `?search=`
### `PATCH /admin/users/:id/status` *(admin)* — `{ is_active: true|false }`
### `GET /admin/audit-logs` *(admin)*

---

## Error codes

| Status | When |
|--------|------|
| 400 | Validation / bad input |
| 401 | Missing or invalid token |
| 403 | Authenticated but role insufficient |
| 404 | Resource not found |
| 409 | Duplicate value violates a unique constraint |
| 429 | Too many auth requests |
| 500 | Unexpected server error |