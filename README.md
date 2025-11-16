Retailer Sales Representative App

Goal: Build the backend for an app that helps Sales Representatives (SRs) sell products to retailers across Bangladesh. Each SR is assigned to a small list of ~70 retailers from a nationwide pool of ~1 million. The backend should focus on data modeling, performance, and scalability.



Core Features

Auth (JWT) for Admin and Sales Reps.

Retailer Listing (SR): View only assigned retailers (fast & paginated).

Retailer Details: View retailer info (Name, UID, Phone, Region, Area, Distributor, Territory, Points, Routes).

Search & Filter: Search by name/code/phone; filter by region/area/distributor/territory.

Update: SR can update allowed fields (Points, Routes, Notes).

Admin:CRUD for Region, Area, Distributor, Territory.

Bulk import retailers (CSV).

Assign/unassign retailers to SRs (bulk).



Data Model (Key Tables)

regions(id, name)

areas(id, name, region_id)

distributors(id, name)

territories(id, name, area_id)

retailers(id, uid, name, phone, region_id, area_id, distributor_id, territory_id, points, routes, updated_at)

sales_reps(id, username, name, phone, password_hash)

sales_rep_retailers(sales_rep_id, retailer_id, assigned_at)

Each SR → ~70 retailers.

Use proper indexes on retailer lookups and mapping tables.

Technical Requirements

Stack: Node.js/Nest.js.

DB: PostgreSQL (with ORM of your choice - we prefer Prisma).

Use Redis for caching.

Include migrations, seed scripts, and Dockerfile/docker-compose.

Provide unit tests (min 5).

Add Swagger/OpenAPI or Postman documentation.

Ensure secure and efficient queries (no N+1).



Example APIs :

MethodEndpointDescriptionPOST/auth/loginLogin & receive JWTGET/retailersPaginated assigned retailersGET/retailers/{uid}Retailer detailPATCH/retailers/{uid}Update allowed fieldsPOST/admin/assignments/bulkAssign retailers to SRPOST/admin/retailers/importBulk import CSVFeel free to add APIs as needed.



Deliverables

GitHub repo with:Source code + migrations + seeds

README (setup, usage, API list)

Postman/Swagger

Tests

Dockerfile & docker-compose

Short note (1–2 paragraphs) on scaling approach for your backend


