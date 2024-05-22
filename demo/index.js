import express from 'express';
import AdminForth from '../adminforth/index.js';
import betterSqlite3 from 'better-sqlite3';

const ADMIN_BASE_URL = '/bo';


// create test1.db

const db = betterSqlite3('test1.sqlite')
  
const tableExists = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='apartments';`).get();
if (!tableExists) {
  await db.prepare(`
    CREATE TABLE apartments (
        id VARCHAR(20) PRIMARY KEY NOT NULL,
        title VARCHAR(255) NOT NULL,
        square_meter REAL,
        price DECIMAL(10, 2) NOT NULL,
        number_of_rooms INT,
        description TEXT,
        created_at TIMESTAMP
    );`).run();

  await db.prepare(`
    CREATE TABLE users (
        id VARCHAR(255) PRIMARY KEY NOT NULL,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at VARCHAR(255) NOT NULL
    );`).run();

  await db.prepare(`
    INSERT INTO apartments (name, square_meter, price, number_of_rooms, description) VALUES ('Zhashkiv high residense', 50.8, 10000.12, 2, 'Nice apartment at the city center');
    `).run();
}

const admin = new AdminForth({
  // baseUrl : ADMIN_BASE_URL,
  brandName: 'My App',
  dataSources: [
    {
      id: 'maindb',
      url: 'sqlite://test1.sqlite',
    },
    {
      id: 'db2',
      url: 'postgres://postgres:35ozenad@test-db.c3sosskwwcnd.eu-central-1.rds.amazonaws.com:5432',
    }
  ],
  resources: [
    {
      dataSource: 'maindb',
      table: 'apartments',
      resourceId: 'apparts', // resourceId is defaulted to table name but you can change it e.g. 
                             // in case of same table names from different data sources
      label: 'Apartments',   // label is defaulted to table name but you can change it
      columns: [
        {
          name: 'id',
          readOnly: true,
        },
        {
          name: 'title',
          required: true,
        },
        {
          name: 'price',
        },
        {
          name: 'description',
        },
        {
          name: 'created_at',
          readOnly: true,
        }
      ]
    },
    {
      dataSource: 'maindb',
      table: 'users',
    },
    // {
    //     dataSource: 'db2',
    //     table: 'games',
    //     columns: [
    //         {
    //             name: 'id',
    //             readOnly: true,
    //         }
    //     ]
    // }
  ],
  menu: [
    {
      label: 'Core',
      icon: 'flowbite:brain-solid', //from here https://icon-sets.iconify.design/flowbite/
      open: true,
      children: [
        {
          label: 'Appartments',
          icon: 'flowbite:home-solid',
          resourceId: 'apparts',
        },
      ]
    },
    {
      type: 'gap'
    },
    {
      label: 'Users',
      icon: 'flowbite:user-solid',
      resourceId: 'users',
    },
    {
      type: 'divider'
    },
    {
      label: 'Users',
      icon: 'flowbite:user-solid',
      resourceId: 'users',
    }
  ],
})


const app = express()
app.use(express.json());
const port = 3000;

(async () => {

    // needed to compile SPA. Call it here or from a build script e.g. in Docker build time to reduce downtime
    await admin.bundleNow({ hotReload: process.env.NODE_ENV === 'development' });
    console.log('Bundling AdminForth done. For faster serving consider calling bundleNow() from a build script.');

})();


admin.express.serve(app, express)
admin.discoverDatabases();

app.get(
  '/api/custom_data', 
  admin.express.authorize(
    (req, res) => {

      res.json({
        number: 124,
      })
    }
  )
)

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
  console.log(`AdminForth is available at http://localhost:${port}${ADMIN_BASE_URL}`)
});