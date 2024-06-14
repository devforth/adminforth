
# dataSource

A DataSource is a connection to one database. Datasources has id for references from resources and URL which follows the standard URI format. For example `mysql://user:password@localhost:3306/database`.
It used to:

* Discover the columns in the database
* Make queries to get the list and show records
* Make queries to modify data

There might be several datasources in the system for vairous databases e.g. One 2 Mongo DBs and 1 Postgres DB. 

# resource

A Resource is a representation of a table or collection in AdminForth. One resource is one table in the database.
It has a `name` which should match name in database, a datasource id, and a list of columns.
Also it has various customization options.

# column

A Column is a representation of a column in a table. It has a `name` which should be equal to name in database and various configuration options.

# record

A record is a row in a relational database table. Or Document in document database table.

# adminUser

Object which represents a user who logged in to the AdminForth

# hook

Hook is a optional async function which allows to inject in backend logic before exuting the datasource query or after it

# component

Component is a Vue component which is used to add or modify UI elements in AdminForth.