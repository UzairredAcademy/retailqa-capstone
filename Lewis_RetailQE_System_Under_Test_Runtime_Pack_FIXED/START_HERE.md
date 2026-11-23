# Lewis RetailQE - System Under Test Runtime Pack

This is the **runnable System Under Test (SUT)** for the Lewis RetailQE Capstone.

It contains the resources that are required to run the system that the sprinters will test:

- runnable backend REST API;
- runnable React web application;
- SQL Server schema;
- synthetic seed data;
- database reset script;
- Docker Compose configuration;
- OpenAPI contract;
- local test credentials and connection details.

This pack does **not** contain facilitator marking answers, a known-defect list, completed
Cypress tests, completed Postman collections, completed SQL validation queries, or a
completed RTM.

---

## 1. Prerequisites

Install the following before starting:

1. Docker Desktop
2. A web browser
3. Postman
4. SQL Server Management Studio (SSMS), Azure Data Studio, or another approved SQL client
5. Node.js is only required if you choose to run the React/API projects outside Docker

Make sure Docker Desktop is running before continuing.

---

## 2. Start the Complete System

Open a terminal in the root of this extracted folder and run:

```bash
docker compose up --build
```

The first start can take several minutes because Docker may need to download SQL Server,
Node and Nginx images and install project dependencies.

Wait until the API reports that it is listening and the containers are running.

---

## 3. Open the System

After startup:

- Web Application: `http://localhost:5173`
- API: `http://localhost:4000/api`
- API Health Check: `http://localhost:4000/health`
- SQL Server: `localhost,1433`
- Database: `RetailQEDb`

The OpenAPI contract is located at:

`api-contract/RetailQE_OpenAPI.yaml`

---

## 4. Test Login Accounts

| Role | Email | Password |
|---|---|---|
| Customer | `customer1@retailqe.test` | `Pass123!` |
| Customer | `customer2@retailqe.test` | `Pass123!` |
| Admin | `admin@retailqe.test` | `Admin123!` |

All accounts and records are synthetic training data.

---


## Navigation After Login

After a successful customer login, the header must immediately show:

- **Dashboard**
- **Orders**
- **New Order**
- **Profile**
- **Sign out**

The Customer Dashboard also includes visible quick-action buttons for **View My Orders**,
**Create New Order** and **My Profile**.

A browser refresh is **not required** after login.

## 5. SQL Connection

For the local Docker environment:

- Server: `localhost,1433`
- Authentication: SQL Server Authentication
- Username: `sa`
- Password: `RetailQE_Str0ng!2026`
- Database: `RetailQEDb`

The database scripts are available in the `database/` folder:

- `01_schema.sql` - creates the database tables
- `02_seed.sql` - inserts the starting synthetic data
- `03_reset_training_data.sql` - removes changed training data and restores the seed state

---

## 6. Stop the System

Press `Ctrl+C` in the Docker terminal or run:

```bash
docker compose down
```

This stops the containers while retaining the SQL Server Docker volume.

---

## 7. Full Reset

To completely remove the current database volume and rebuild the environment:

```bash
docker compose down -v
docker compose up --build
```

Use this only when the training environment must be returned to a clean state.

---

## 8. Sprinter Testing Rule

The purpose of this system is to be **tested**, not rebuilt.

Sprinters are expected to create their own:

- Cypress UI tests;
- Postman/Newman API tests;
- SQL validation queries;
- end-to-end scenarios;
- requirements traceability;
- defect reports;
- test evidence and reports.

Do not alter the application source code to make a failed test pass during the assessment.

---

## 9. Folder Structure

```text
Lewis_RetailQE_System_Under_Test_Runtime_Pack/
├── START_HERE.md
├── docker-compose.yml
├── .env.example
├── RUN_SYSTEM.bat
├── STOP_SYSTEM.bat
├── RESET_SYSTEM.bat
├── api-contract/
│   └── RetailQE_OpenAPI.yaml
├── access/
│   ├── LOCAL_SYSTEM_ACCESS.md
│   └── TEST_CREDENTIALS.md
├── database/
│   ├── 01_schema.sql
│   ├── 02_seed.sql
│   └── 03_reset_training_data.sql
└── system/
    ├── api/
    │   ├── Dockerfile
    │   ├── package.json
    │   └── src/
    └── web/
        ├── Dockerfile
        ├── package.json
        └── src/
```

---

## 10. Troubleshooting

### Docker command is not recognised
Install Docker Desktop and restart the machine.

### Port 1433 is already in use
Stop the local SQL Server instance using the port, or change the SQL port mapping in
`docker-compose.yml`.

### Port 4000 or 5173 is already in use
Stop the application using the port or adjust the corresponding port in
`docker-compose.yml`.

### API starts before SQL Server is ready
The API contains connection retry logic. Give SQL Server a short time to initialise.

### Browser cannot load the UI
Check:

```bash
docker compose ps
```

All three services should be running.

### Need to inspect API availability
Open:

`http://localhost:4000/health`

### Need a clean database
Use the Full Reset procedure above.
