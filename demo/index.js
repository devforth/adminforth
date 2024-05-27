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
        property_type VARCHAR(255) DEFAULT 'apartment',
        listed BOOLEAN DEFAULT FALSE,
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
    INSERT INTO apartments (id, title, square_meter, price, number_of_rooms, description) VALUES ('123', 'Zhashkiv high residense', 50.8, 10000.12, 2, 'Nice apartment at the city center');
  `).run();

  for (let i = 0; i < 50; i++) {
    await db.prepare(`
      INSERT INTO apartments (
        id, title, square_meter, price, number_of_rooms, description, created_at, listed, property_type
      ) VALUES ('${i}', 'Apartment ${i}', ${Math.random() * 100}, ${Math.random() * 10000}, ${Math
        .floor(Math.random() * 5) }, 'Next gen appartments', ${Date.now() / 1000 - i * 60 * 60 * 24}, ${i % 2 == 0}, ${i % 2 == 0 ? "'house'" : "'apartment'"});
      `).run();
  }
}

const admin = new AdminForth({
  // baseUrl : ADMIN_BASE_URL,
  brandName: 'My App',
  dataSources: [
    {
      id: 'maindb',
      url: 'sqlite://test1.sqlite'
    },
    {
      id: 'db2',
      url: 'postgres://postgres:35ozenad@test-db.c3sosskwwcnd.eu-central-1.rds.amazonaws.com:5432'
    },
    // {
    //   id: 'db3',
    //   url: 'mongodb://127.0.0.1:27017/betbolt?retryWrites=true&w=majority&authSource=admin',
    //   fieldtypesByTable: {
    //     'game': {
    //         _id: {
    //             "type": "string",
    //             "_underlineType": "varchar",
    //             "maxLength": 255,
    //             "_baseTypeDebug": "character varying(255)",
    //             "required": true,
    //             "primaryKey": false,
    //             "default": "",
    //             "name": "_id"
    //         }
    //     }
    //   }
    // }
  ],
  resources: [
    {
      dataSource: 'maindb', table: 'apartments',
      resourceId: 'apparts', // resourceId is defaulted to table name but you can change it e.g. 
                             // in case of same table names from different data sources
      label: 'Apartments',   // label is defaulted to table name but you can change it
      columns: [
        { 
          name: 'id', 
          readOnly: true, 
          label: 'Identifier',  // if you wish you can redefine label
          showIn: 'CEFS',
          primaryKey: true,
        },
        { 
          name: 'title',
          required: true,
          showIn: 'LCEFS',  // L - List, C - Create, E - Edit, F - Filter, S - Show, LCEFS is default mode
        }, 
        { 
          name: 'price',
          allowMinMaxQuery: true,  // use better experience for filtering e.g. date range, set it only if you have index on this column or if there will be low number of rows
        },
        { 
          name: 'square_meter', 
          label: 'Square', 
          allowMinMaxQuery: true,
         },
        { 
          name: 'number_of_rooms',
          allowMinMaxQuery: true,
        },
        { 
          name: 'description' 
        },
        {
          name: 'property_type',
          enum: [{
            value: 'house',
            label: 'House'
          }, {
            value: 'apartment',
            label: 'Apartment'
          }, {
            value: null,
            label: 'Not defined'
          }],
          // allowCustomValue: true,
        },
        {
          name: 'listed',
        },
        { 
          name: 'created_at', 
          readOnly: true,
          allowMinMaxQuery: true,
        }
      ],
      listPageSize: 20, 
    },
    // { dataSource: 'maindb', table: 'users' },
    {
        dataSource: 'db2', table: 'games',
        resourceId: 'games',
        label: 'Games',
        columns: [
            { name: 'id', readOnly: true, label: 'Identifier'},
            { name: 'name', required: true },
            { name: 'created_by', required: true },
            { name: 'release_date', readOnly: true },
            { name: 'description' },
            { name: 'price' }
        ],
        listPageSize: 5, 
    },
    // {
    //     dataSource: 'db3', table: 'game',
    //     columns: [
    //         { name: '_id', readOnly: true, primaryKey: true },
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
        {
          label: 'Games',
          icon: 'flowbite:caret-right-solid',
          resourceId: 'games',
        },
        {
          label: 'Casino Games',
          icon: 'flowbite:caret-right-solid',
          resourceId: 'game',
        }
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
  console.log(`\n⚡ AdminForth is available at http://localhost:${port}${ADMIN_BASE_URL}\n`)
});