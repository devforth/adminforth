# Glossary

## dataSource

A DataSource is a connection to one database. Datasources have id for references from resources and URL which follows the standard URI format. For example `mysql://user:password@localhost:3306/database`.
It used to:

* Discover the columns in the database
* Make queries to get the list and show records
* Make queries to modify data

There might be several datasources in the system for various databases e.g. One datasource to Mongo DBs and one to Postgres DB. 

## resource

A [Resource](/docs/api/Back/interfaces/AdminForthResource.md) is a AdminForth representation of a table or collection in database. One resource is one table in the database. Resource has `table` property which should be equal to the name of the table in the database.
It has a datasource id to point to database, a  definition of list of columns and various customization options. 

## column

A [Column](/docs/api/Back/interfaces/AdminForthResourceColumn.md) is a representation of a column in a table. It has a `name` which should be equal to name in database and various configuration options.

## record

A record is a row in a relational database table. Or Document in document database table.

## action

Action is one of operations which can be performed on the resource or it's records. 

There are next [actions](/docs/api/Common/enumerations/AllowedActionsEnum.md):

* create
* edit
* delete
* list
* show
* filter

## adminUser

[Object](/docs/api/Common/interfaces/AdminUser) which represents a user who logged in to the AdminForth. 


## hook

Hook is a optional async function which allows to inject in backend logic before executing the datasource query or after it. 
Hooks exist for all database queries including data read queries like list, show, and data write queries like create, edit, delete.
All AdminForth hooks are executed on the backend side only.

## allowedAction

Static boolean value or async function which returns boolean and defines whether the action is allowed for the user.
allowedAction checked before any hooks or datasource queries: this means that if your allowed action function
returned false you can be sure that user attempt to perform the action or get the data will be strictly prohibited on backend side.

## component

Component is a Vue frontend component which is used to add or modify UI elements in AdminForth. It can be used as a full custom page with a link in menu or as a part of the existing AdminForth page

## field

Same to column, but considered in context of record.

## Plugin

Plugin is a class defined to extend AdminForth functionality. Plugin philosophy is to simply modify AdminForth config after it is defined by user. In other words, everything that could be done in config, can be done in plugin and vice versa.

In same way, like config does it, plugins set own Frontend components and backend hooks to modify AdminForth behavior.

The main difference is that plugin allows to simplify routine repeating tasks and reduce the amount of code in the config file and code of cusomtom components.