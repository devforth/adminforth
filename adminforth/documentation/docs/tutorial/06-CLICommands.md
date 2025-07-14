# CLI Commands

> **CLI Reference**: A list of all available CLI commands for AdminForth.

## Usage

```bash

adminforth <command> [...options]

```

## Commands

### `create-app`

> Create a new AdminForth application with initial project structure and configuration.

**Description:**

This command scaffolds a brand new AdminForth application in a specified directory. It guides you through setup using command-line arguments or interactive prompts, generates the necessary configuration and project files, installs dependencies, and sets up the development environment.

**Usage:**

```bash
adminforth create-app [--app-name <name>] [--db <database_url>]
```

**Options:**

- **`--app-name`**: The name of your new application. This becomes the project directory. Defaults to `adminforth-app`.
- **`--db `**: The connection URL for your database. Currently PostgreSQL, MongoDB, SQLite, MySQL, Clickhouse are supported. If not provided, defaults to `sqlite://.db.sqlite`.

<!-- **What it does:**

1. ✅ Parses CLI arguments (or prompts if missing).
2. 🔍 Validates Node.js version and checks if target folder exists.
3. 📁 Creates project directory structure:
   - `custom/`
   - `resources/`
   - `.env`, `package.json`, `tsconfig.json`, etc.
4. 🛠 Applies database-specific templates using Handlebars.
5. 📦 Installs dependencies in both main and custom directories.
6. 📌 Prints helpful next steps to start developing immediately. -->

**Example:**

```bash
adminforth create-app --app-name my-app --db sqlite://mydb.sqlite
```

**Result:**

Creates a folder `my-app/` with the entire AdminForth app ready to go.

---























### `create-plugin`

> Scaffold a new plugin for an AdminForth application.

**Description:**

This command sets up a fresh AdminForth plugin project by generating the required files, installing dependencies, and preparing the environment for local development and testing.

**Usage:**

```bash
adminforth create-plugin [--plugin-name <name>]
```

**Options:**

- **`--plugin-name`**: The name of your new plugin. This becomes the folder name and is used in generated files. If not provided, you'll be prompted.

<!-- **What it does:**

1. ✅ Parses CLI arguments (or prompts interactively).
2. 🔍 Performs initial checks:
   - Validates Node.js version (>= 20)
   - Ensures no existing `package.json` exists in the current directory
3. 📁 Creates a plugin folder structure with files such as:
   - `tsconfig.json`
   - `package.json`
   - `index.ts`, `types.ts`
   - `custom/tsconfig.json`
   - `.gitignore`
4. 📦 Installs dependencies in both root and `custom` directories.
5. 📌 Prints post-setup instructions for building and testing. -->

**Example:**

```bash
adminforth create-plugin --plugin-name my-awesome-plugin
```

**Result:**

Creates a folder with all the necessary files for your plugin and instructions for linking it into an AdminForth project.

---

**Next steps after creation:**

```bash
cd my-awesome-plugin
npm run build
npm link
```

Then in your AdminForth project:

```bash
npm link my-awesome-plugin
```

---



















### `generate-models`

> Generate TypeScript models from your AdminForth resources.

**Description:**

This command scans the current working directory for a valid AdminForth instance and automatically generates a TypeScript file containing model type definitions for all defined resources. It inspects the resource columns and maps them to appropriate TypeScript types.

**Usage:**

```bash
adminforth generate-models [--env-file=<path>]
```

**Options:**

- **`--env-file=<path>`**: (optional) Path to a custom `.env` file to load environment variables. Defaults to `.env`.

<!-- **What it does:**

1. 📁 Scans the current directory for `.js` or `.ts` files.
2. 🔍 Looks for an AdminForth instance and calls `discoverDatabases()` to introspect resource definitions.
3. 🧠 Extracts all resources and their columns.
4. 🛠 Converts resource definitions into TypeScript type declarations using:
   - Resource ID → PascalCase type name
   - Column types → TypeScript equivalents
5. ✍️ Writes output to:
   ```
   node_modules/adminforth/models/models.ts
   ``` -->

**Example:**

```bash
adminforth generate-models --env-file=.env.dev
```

**Result:**

A file like this will be generated:

```ts
export type User = {
  id: number;
  name: string;
  email: string;
};

export type Product = {
  id: number;
  title: string;
  price: number;
};
```

---
























### `bundle`

> Build the AdminForth Single Page Application (SPA) for production.

**Description:**

This command bundles the AdminForth front-end (SPA) using your current AdminForth instance. It calls the `bundleNow()` method from your AdminForth admin entry point.

**Usage:**

```bash
adminforth bundle
```

<!-- **What it does:**

1. 🔍 Looks for a valid AdminForth instance file using `findAdminInstance()`.
2. 📦 Dynamically loads the instance using `callTsProxy`.
3. 🧰 Calls `admin.bundleNow({ hotReload: false })` to build the production-ready front-end. -->

**Output:**

The output files (typically JavaScript/CSS assets) will be generated in the directory configured by your AdminForth project (usually `dist` or `public`).

**Example:**

```bash
adminforth bundle
```

You should see:

```
Bundling admin SPA...
```

And after successful execution, your compiled AdminForth front-end will be ready for deployment.

---
























### `component`

The `component` command is an interactive CLI tool to scaffold and inject Vue components into your AdminForth plugin.

It helps you generate:
- Custom field components (`fields`)
- CRUD page injections (`crudPage`)
- Login page injections (`login`)
- Global UI injections (`global`)

---

#### 🔤 Custom Fields (`fields`)

Generates components for specific fields in views such as:
- `list`
- `show`
- `edit`
- `create`
- `filter`

It prompts to select a **resource**, then a **column**, and finally injects a file like:
```bash
custom/UserEmailShow.vue
```
Config will be auto-updated.

Usage shortcut:
```bash
adminforth component fields.show.user.email
```

---

#### ➖ CRUD Page Injections (`crudPage`)

Adds components to entire CRUD pages (not just fields).

It supports views:
- `list`
- `show`
- `edit`
- `create`

It then asks:
- Where to inject (top, bottom, dropdown, etc.)
- Optional name (e.g. "ExportButton")
- Whether the component is "thin" (coexists with existing layout)

Generated example:
```bash
custom/OrderShowBottomExportButton.vue
```

---

#### 🔐 Login Page Injections (`login`)

Places a component before or after the login form.

It will prompt for:
- Injection type: `beforeLogin` or `afterLogin`
- Purpose (for naming)
- Updates `index.ts` automatically

Example file:
```bash
custom/CustomLoginSocials.vue
```

---

#### 🌐 Global Injections (`global`)

Injects into:
- `userMenu`
- `header`
- `sidebar`
- `everyPageBottom`

Prompt asks:
- Location
- Description (for naming)

Example:
```bash
custom/CustomGlobalSupportLink.vue
```

---

#### 🛠️ Notes

- All components are placed under a `custom/` folder
- Code uses Handlebars templates (`.vue.hbs`)
- Config file `index.ts` must exist and export `admin`

If the component file already exists, you’ll get a warning and it won’t be overwritten.

---

















### `resource`

> Generate and register a new AdminForth resource based on an existing database table.

**Description:**

This command helps you scaffold a new resource file for a selected table in your database and automatically integrates it into the AdminForth application. It fetches available tables, lets you select one interactively, generates a corresponding resource file using a template, and injects the result into your application’s index file.

**Usage:**

```bash
adminforth resource
```


<!-- **What it does:**

1. 🔍 Discovers all available tables across configured databases.
2. 🧭 Prompts the user to select a table using a searchable list.
3. 📑 Fetches all columns for the selected table.
4. 🛠 Generates a resource file from a Handlebars template (`templates/resource.ts.hbs`), including:
   - Table name
   - Column definitions
   - Database source name
   - Resource metadata
5. 🚫 Skips file creation if a matching resource already exists with the same `dataSource`.
6. 🧠 Appends the new resource to the app’s main `index.ts`:
   - Adds an import statement.
   - Registers the resource in the `resources` array.
   - Adds a corresponding entry to the admin `menu`. -->

**Example:**

```bash
adminforth resource
```

**Result:**

- Prompts the user to select a table, such as `users`, from the available databases.
- Creates a file like `resources/users.ts` (or `users_maindb.ts` if needed).
- Injects this resource into the application’s `index.ts` file.
- Adds a navigation menu item with label "Users" and default icon.

**Example Output:**

```
🔍 Choose a table to generate a resource for:
> maindb.users
  maindb.posts
  ...
✅ Generated resource file: ./resources/users.ts
✅ Injected resource "users" into index
```



















### `help` `--help` `-h`

> Display a list of all available AdminForth CLI commands.

**Description:**

This command outputs a summary of all supported AdminForth commands in the terminal with brief descriptions. It’s useful as a quick reference for developers to understand what functionality is available.

**Usage:**

```bash
adminforth help
```

**Output:**

```
Available commands:
  create-app         Create a new AdminForth app
  create-plugin      Create a plugin for your AdminForth app
  generate-models    Generate TypeScript models from your databases
  bundle             Bundles your AdminForth app SPA for production
  component          Scaffold a custom Vue component
  resource           Scaffold a custom resource
```

This command is typically displayed by running `adminforth` with no arguments or explicitly using `adminforth help`.

---




















### `version` `--version` `-v`

> Show the current version of the AdminForth CLI.

**Description:**

This command displays the version number of the currently installed AdminForth CLI. It's useful for verifying which version you're using, especially when troubleshooting or checking compatibility.

**Usage:**

```bash
adminforth version
```


**Example Output:**

```
AdminForth CLI version: 1.6.2
```
