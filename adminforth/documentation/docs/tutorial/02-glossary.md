# Glossary

## dataSource

A DataSource is a connection to one database. Datasources have id for references from resources and URL which follows the standard URI format. For example `mysql://user:password@localhost:3306/database`.
It used to:

* Discover the columns in the database
* Make queries to get the list and show records
* Make queries to modify data

There might be several datasources in the system for various databases e.g. One 2 Mongo DBs and 1 Postgres DB. 

## resource

A [Resource](/docs/api/types/AdminForthConfig/type-aliases/AdminForthResource.md) is a representation of a table or collection in AdminForth. One resource is one table in the database.
It has a `name` which should match name in database, a datasource id, and a list of columns.
Also it has various customization options. 

## column

A [Column](/docs/api/types/AdminForthConfig/type-aliases/AdminForthResourceColumn.md) is a representation of a column in a table. It has a `name` which should be equal to name in database and various configuration options.

## record

A record is a row in a relational database table. Or Document in document database table.

## action

Action is one of operations which can be performed on the resource or it's records. 

There are next [actions](/docs/api/types/AdminForthConfig/enumerations/AllowedActionsEnum.md):

* create
* edit
* delete
* list
* show
* filter



## adminUser

[Object](/docs/api/types/AdminForthConfig/type-aliases/AdminUser.md) which represents a user who logged in to the AdminForth. 


## hook

Hook is a optional async function which allows to inject in backend logic before executing the datasource query or after it

## component

Component is a Vue component which is used to add or modify UI elements in AdminForth. It can be used as a full custom page with a link in menu or as a part of the existing AdminForth page

## field

Value of the column in the record.