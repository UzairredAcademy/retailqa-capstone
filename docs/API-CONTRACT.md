# API Contract / Swagger Documentation

The runnable API serves an interactive Swagger UI at
[`http://localhost:4000/api-docs`](http://localhost:4000/api-docs) after the
runtime pack is started. The OpenAPI 3.0 contract that powers the UI is
[`RetailQE_OpenAPI.yaml`](../Lewis_RetailQE_System_Under_Test_Runtime_Pack_FIXED/api-contract/RetailQE_OpenAPI.yaml).

The contract covers the health check and the authentication, products,
customers, orders, payments, shipments, returns, and customer dashboard
endpoints. Use the `Try it out` controls in Swagger UI to send requests to the
local API at `http://localhost:4000`.

The API is synthetic training software: login returns a synthetic token, but
the other endpoints do not require or validate that token.
