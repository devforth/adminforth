# Working without direct database connection

Out of the box, AdminForth connects directly to your database using one of the supported drivers (PostgreSQL, MySQL, ClickHouse, MongoDB) and executes queries against it.

In some cases, you may not want to expose a direct database connection to AdminForth. Instead, you may prefer to allow AdminForth to access and modify data through your own APIs (for example, REST, GraphQL, or JSON-RPC).

With this approach, AdminForth never connects to the database and never even knows its URL. All read and write operations go through your API layer.

Why do this?

- Your API may enforce additional constraints or validation rules.

- You can precisely log all operations using your own logging or audit systems. (The built-in AuditLog tracks data modifications only and does not log read operations.)

- Your API may contain custom logic, such as distributed workflows or complex data-modification rules.

To implement this, you need to extend the data connector class and implement a small set of methods responsible for data access and mutations.

This example demonstrates how to do this using GraphQL, but the same approach can be adapted to REST or any other protocol. The code comments include detailed guidance for these cases.

Another reason to create a custom data source adapter is to support a database that AdminForth does not yet support. In that case, you are welcome to submit a pull request to AdminForth to add native support for that database.