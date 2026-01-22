## Starting the application

Install dependencies:

```bash
npm ci
```

Migrate the database:

```bash
npm run migrate:local
```

Start the server:

```bash
npm run dev
```

## Changing schema

Open `schema.prisma` and change schema as needed: add new tables, columns, etc (See [Prisma schema reference](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-schema)).

Run the following command to generate a new migration and apply it instantly in local database:

```bash
npm run makemigration -- --name <name_of_changes>
```

Your colleagues will need to pull the changes and run `npm run migrateLocal` to apply the migration in their local database.

## Deployment tips

You have Dockerfile ready for production deployment. You can test the build with:

```bash
docker build -t dev-demo-image .
docker run -p 3500:3500 -e ADMINFORTH_SECRET=123 -v $(pwd)/db:/code/db dev-demo-image
```

To set non-sensitive environment variables in production, use `.env.prod` file.
For sensitive variables, use direct docker environment variables or secrets from your vault.

## Documentation

- [Customizing AdminForth Branding](https://adminforth.dev/docs/tutorial/Customization/branding/)
- [Custom Field Rendering](https://adminforth.dev/docs/tutorial/Customization/customFieldRendering/)
- [Hooks](https://adminforth.dev/docs/tutorial/Customization/hooks/)
- [Custom Pages](https://adminforth.dev/docs/tutorial/Customization/customPages/)
