# ER Diagram

The full SCMS database can be represented as follows. Mermaid renders this
nicely on GitHub.

```mermaid
erDiagram
    USERS ||--|| SKIN_PROFILES : has
    USERS ||--o{ USER_SKIN_CONCERNS : has
    SKIN_CONCERNS ||--o{ USER_SKIN_CONCERNS : assigned_to
    PRODUCT_CATEGORIES ||--o{ PRODUCTS : contains
    USERS ||--o{ USER_PRODUCTS : owns
    PRODUCTS ||--o{ USER_PRODUCTS : tracked_by
    USERS ||--o{ ROUTINES : creates
    ROUTINES ||--o{ ROUTINE_PRODUCTS : contains
    PRODUCTS ||--o{ ROUTINE_PRODUCTS : included_in
    USERS ||--o{ PROGRESS_RECORDS : records
    USERS ||--o{ APPOINTMENTS : books
    USERS ||--o{ AUDIT_LOGS : generates

    USERS {
        bigint id PK
        varchar full_name
        varchar email "UNIQUE"
        text password_hash
        varchar role "USER|ADMIN"
        varchar phone
        date date_of_birth
        varchar gender
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    SKIN_PROFILES {
        bigint id PK
        bigint user_id FK "UNIQUE"
        varchar skin_type
        text notes
        timestamp created_at
        timestamp updated_at
    }

    SKIN_CONCERNS {
        bigint id PK
        varchar name "UNIQUE"
        text description
    }

    USER_SKIN_CONCERNS {
        bigint id PK
        bigint user_id FK
        bigint concern_id FK
        int severity "1-5"
        text notes
    }

    PRODUCT_CATEGORIES {
        bigint id PK
        varchar name "UNIQUE"
        text description
        boolean is_active
    }

    PRODUCTS {
        bigint id PK
        bigint category_id FK
        varchar name
        varchar brand
        text description
        text key_ingredients
        text suitable_skin_types
        text usage_instructions
        numeric price
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    USER_PRODUCTS {
        bigint id PK
        bigint user_id FK
        bigint product_id FK
        date start_date
        date end_date
        varchar status
        varchar frequency
        text personal_notes
        int rating "1-5"
        timestamp created_at
    }

    ROUTINES {
        bigint id PK
        bigint user_id FK
        varchar name
        varchar routine_type "MORNING|NIGHT|WEEKLY|CUSTOM"
        text description
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    ROUTINE_PRODUCTS {
        bigint id PK
        bigint routine_id FK
        bigint product_id FK
        int step_order
        varchar frequency
        text usage_instructions
        text notes
    }

    PROGRESS_RECORDS {
        bigint id PK
        bigint user_id FK
        date recorded_date
        int acne_severity
        int dryness_level
        int oiliness_level
        int redness_level
        int overall_condition_score
        text image_url
        text notes
        timestamp created_at
    }

    APPOINTMENTS {
        bigint id PK
        bigint user_id FK
        date appointment_date
        time appointment_time
        text reason
        text notes
        varchar status "REQUESTED|CONFIRMED|COMPLETED|CANCELLED"
        timestamp created_at
        timestamp updated_at
    }

    AUDIT_LOGS {
        bigint id PK
        bigint user_id FK "nullable"
        varchar action
        varchar entity_type
        bigint entity_id
        jsonb details
        timestamp created_at
    }
```

## Relationship summary

| Relationship | Cardinality | Notes |
|--------------|-------------|-------|
| `users → skin_profiles` | 1:1 | A user has at most one profile |
| `users ↔ skin_concerns` | M:N | Via `user_skin_concerns`, includes severity |
| `product_categories → products` | 1:N | A category has many products |
| `users ↔ products` | M:N | Via `user_products` (personal cabinet) |
| `users → routines` | 1:N | A user creates many routines |
| `routines ↔ products` | M:N | Via `routine_products` (with `step_order`) |
| `users → progress_records` | 1:N | Self-reported progress |
| `users → appointments` | 1:N | With admin-managed status |
| `users → audit_logs` | 1:N | Action trail; nullable for system events |