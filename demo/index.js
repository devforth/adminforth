import express from 'express';
import AdminForth from '../adminforth/index.js';
import sqlite3 from 'sqlite3';

const ADMIN_BASE_URL = '/bo';


// create test1.db
const db = new sqlite3.Database('test1.db');
db.serialize(async function() {
  //check table exists
  const exists = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='apartments'");
  if (exists) {
    await db.run(`
      CREATE TABLE apartments (
          id INT PRIMARY KEY VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          square_meter REAL,
          price DECIMAL(10, 2) NOT NULL,
          number_of_rooms INT,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      )

      CREATE TABLE users (
          id INT PRIMARY KEY VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          created_at VARCHAR(255) NOT NULL,
      );

      INSERT INTO apartments (name, square_meter, price, number_of_rooms, description) VALUES ('Zhashkiv high residense', 50.8, 10000.12, 2, 'Nice apartment at the city center');
      `
    );
    console.log('Demo tables created');
  }
});

const admin = new AdminForth({
  // baseUrl : ADMIN_BASE_URL,
  brandName: 'My App',
  dataSources: [
    {
      id: 'maindb',
      url: 'sqlite://test1.db',
    }
  ],
  resources: [
    {
      dataSource: 'maindb',
      table: 'appartments',
      resourceId: 'apparts', // resourceId is defaulted to table name but you can change it e.g. 
                             // in case of same table names from different data sources
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
    }
  ],
  menu: [
    {
      label: 'Core',
      icon: 'flowbite:brain-solid', //from here https://icon-sets.iconify.design/flowbite/
      open: false,
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
const port = 3000;

(async () => {

    // needed to compile SPA. Call it here or from a build script e.g. in Docker build time to reduce downtime
    await admin.bundleNow({ hotReload: process.env.NODE_ENV === 'development' });
    console.log('Bundling AdminForth done. For faster serving consider calling bundleNow() from a build script.');

})();


admin.express.serve(app, express)

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