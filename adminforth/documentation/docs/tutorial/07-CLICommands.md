---
description: "Reference page for the AdminForth CLI, including create-app, create-plugin, generate-models, bundle, and other commands used to scaffold and maintain projects."
---

# CLI Commands

> **CLI Reference**: A list of all available CLI commands for AdminForth.

## Usage

To use a command, write it in format like:

```bash
pnpx adminforth <command> [...options]
```

For example: `pnpx adminforth create-app --app-name myadmin --db "sqlite://.db.sqlite"`

## Commands

### `create-app`

> Create a new AdminForth application with initial project structure and configuration.

**Description:**

The `create-app` command scaffolds a brand new AdminForth application in a specified directory. The `create-app` command guides you through setup using command-line arguments or interactive prompts, generates the necessary configuration and project files, installs dependencies, and sets up the development environment.

**Usage:**

```bash
pnpx adminforth create-app [--app-name <name>] [--db <database_url>]
```

**Options:**

- **`--app-name`**: The name of your new application. This becomes the project directory. Defaults to `adminforth-app`.
- **`--db `**: The connection URL for your database. Currently PostgreSQL, MongoDB, SQLite, MySQL, Clickhouse are supported. If not provided, defaults to `sqlite://.db.sqlite`.

**Example:**

```bash
pnpx adminforth create-app --app-name my-app --db sqlite://mydb.sqlite
```

**Result:**

Creates a folder `my-app/` with the entire AdminForth app ready to go.

---























### `create-plugin`

> Scaffold a new plugin for an AdminForth application.

**Description:**

The `create-plugin` command sets up a fresh AdminForth plugin project by generating the required files, installing dependencies, and preparing the environment for local development and testing.

**Usage:**

```bash
pnpx adminforth create-plugin [--plugin-name <name>]
```

**Options:**

- **`--plugin-name`**: The name of your new plugin. This becomes the folder name and is used in generated files. If not provided, you'll be prompted.

**Example:**

```bash
pnpx adminforth create-plugin --plugin-name my-awesome-plugin
```

**Result:**

Creates a folder with all the necessary files for your plugin and instructions for linking it into an AdminForth project.




















### `generate-models`

> Generate TypeScript models from your AdminForth resources.

**Description:**

The `generate-models` command scans the current working directory for a valid AdminForth instance and automatically generates a TypeScript file containing model type definitions for all defined resources. The `generate-models` command inspects the resource columns and maps them to appropriate TypeScript types.

**Usage:**

```bash
pnpx adminforth generate-models [--env-file=<path>]
```

**Options:**

- **`--env-file=<path>`**: (optional) Path to a custom `.env` file to load environment variables. Defaults to `.env`.

**Example:**

```bash
pnpx adminforth generate-models --env-file=.env.dev
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

The `bundle` command bundles the AdminForth front-end (SPA) using your current AdminForth instance. The `bundle` command calls the `bundleNow()` method from your AdminForth admin entry point.

**Usage:**

```bash
pnpx adminforth bundle
```

**Output:**

The `bundle` command generates output files (typically JavaScript/CSS assets) in the directory configured by your AdminForth project (usually `dist` or `public`).





















### `component`

The `component` command is an interactive CLI tool that scaffolds and injects Vue components into your AdminForth plugin.

The `component` command helps you generate:
- Custom field components (`fields`)
- CRUD page injections (`crudPage`)
- Login page injections (`login`)
- Global UI injections (`global`)

---

#### 🔤 Custom Fields (`fields`)

The `component fields` flow generates components for specific fields in views such as:
- `list`
- `show`
- `edit`
- `create`
- `filter`

The `component fields` flow prompts you to select a **resource**, then a **column**, and finally injects a file like:
```bash
custom/UserEmailShow.vue
```
The `component fields` flow auto-updates the config.

Usage shortcut:
```bash
pnpx adminforth component fields.show.user.email
```

---

#### ➖ CRUD Page Injections (`crudPage`)

The `component crudPage` flow adds components to entire CRUD pages (not just fields).

The `component crudPage` flow supports views:
- `list`
- `show`
- `edit`
- `create`

The `component crudPage` flow then asks:
- Where to inject (top, bottom, dropdown, etc.)
- Optional name (e.g. "ExportButton")
- Whether the component is "thin" (coexists with existing layout)

Generated example:
```bash
custom/OrderShowBottomExportButton.vue
```

#### 🔐 Login Page Injections (`login`)

The `component login` flow places a component before or after the login form.

The `component login` flow prompts for:
- Injection type: `beforeLogin` or `afterLogin`
- Purpose (for naming)
- Updates `index.ts` automatically

Example file:
```bash
custom/CustomLoginSocials.vue
```

---

#### 🌐 Global Injections (`global`)

The `component global` flow injects into:
- `userMenu`
- `header`
- `sidebar`
- `everyPageBottom`

The `component global` flow asks for:
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

If the generated component file already exists, the `component` command shows a warning and does not overwrite the existing file.

---

















### `resource`

> Generate and register a new AdminForth resource based on an existing database table.

**Description:**

The `resource` command helps you scaffold a new resource file for a selected table in your database and automatically integrates it into the AdminForth application. The `resource` command fetches available tables, lets you select one interactively, generates a corresponding resource file using a template, and injects the result into your application’s index file.

**Usage:**

```bash
pnpx adminforth resource
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

The `help` command outputs a summary of all supported AdminForth commands in the terminal with brief descriptions. The `help` command is useful as a quick reference for developers to understand what functionality is available.

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

The `help` output is typically displayed by running `adminforth` with no arguments or explicitly running `adminforth help`.

---




















### `version` `--version` `-v`

> Show the current version of the AdminForth CLI.

**Description:**

The `version` command displays the version number of the currently installed AdminForth CLI. The `version` command is useful for verifying which version you are using, especially when troubleshooting or checking compatibility.

**Usage:**

```bash
adminforth version
```


**Example Output:**

```
AdminForth CLI version: 1.6.2
```
