# Data model

Each reservation points to one room and one team member. Store the slot start in UTC and show it in the viewer's time zone. `(room_id, starts_at)` must be unique among active reservations.

```mermaid
erDiagram
    ROOM ||--o{ RESERVATION : hosts
    MEMBER ||--o{ RESERVATION : makes

    ROOM {
        integer id PK
        string name
    }
    MEMBER {
        integer id PK
        string display_name
    }
    RESERVATION {
        integer id PK
        integer room_id FK
        integer member_id FK
        datetime starts_at
        datetime cancelled_at
    }
```
