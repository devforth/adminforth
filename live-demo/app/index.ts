import betterSqlite3 from 'better-sqlite3';
import express from 'express';
import AdminForth, { AdminForthDataTypes, Filters,  AdminForthResource, AdminForthResourceColumn  } from 'adminforth';
import fs from 'fs';
import usersResource from "./resources/users";
import apartmentsResource from "./resources/apartments";
import auditLogsResource from "./resources/auditLogs"
import translations from "./resources/translations";
import { randomUUID } from 'crypto';
try { fs.mkdirSync('db') } catch (e) {} 


let db;

const ADMIN_BASE_URL = '';
const DEMO_EMAIL  = 'demo@adminfoth.dev';
const DEMO_PASSWORD = 'demo';


export const admin = 
new AdminForth({
  baseUrl : ADMIN_BASE_URL,
  auth: {
    //loginBackgroundImage: '@@/adminforthloginimg.avif',
    usersResourceId: 'users',  // resource to get user during login
    usernameField: 'email',  // field where username is stored, should exist in resource
    passwordHashField: 'password_hash',
    demoCredentials: `${DEMO_EMAIL}:${DEMO_PASSWORD}`,  // never use it for production
    loginPromptHTML: `Use email <b>${DEMO_EMAIL}</b> and password <b>${DEMO_PASSWORD}</b> to login`,
  },
  customization: {
    brandName: 'My Admin',
    datesFormat: 'D MMM YY',
    timeFormat: 'HH:mm:ss',
    iconOnlySidebar: {
      logo: '@/assets/logo.svg',
    },
    emptyFieldPlaceholder: '-',
    title: 'My App Admin',  // used to set HTML meta title tag
    // brandLogo: '@@/logo.svg',
    // favicon: '@@/favicon.png',
    announcementBadge: (adminUser: AdminUser) => {
      return {
        html: `
<svg xmlns="http://www.w3.org/2000/svg" style="display:inline; margin-top: -4px" width="16" height="16" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/></svg> 
<a href="https://github.com/devforth/adminforth" style="font-weight: bold; text-decoration: underline" target="_blank">Star us on GitHub</a> to support a project!`,
        closable: true,
        // title: 'Support us for free',
      }
    },
      globalInjections: {
      header: [
        {
          file: '@/custom/GitHubButton.vue',
          meta: { thinEnoughToShrinkHeader: true }
        }
      ]
    }
  },

  dataSources: [
    {
      id: 'maindb',
      url: `sqlite://${process.env.DATABASE_FILE_URL?.replace('file:', '')}`,
    },
  ],
  resources: [
    apartmentsResource,
    usersResource,
    auditLogsResource,
    translations,
  ],
  menu: [

    {
        label: 'Dashboard',
        path: '/overview',
        homepage: true,
        icon: 'flowbite:chart-pie-solid',
        component: '@@/Dashboard.vue',
      },
    {
      label: 'Core',
      icon: 'flowbite:brain-solid', // any icon from iconify supported in format <setname>:<icon>, e.g. from here https://icon-sets.iconify.design/flowbite/
      open: true,
      children: [
        {
          label: 'Apartments',
          icon: 'flowbite:home-solid',
          resourceId: 'aparts',
        },
        {
          label: 'Translations',
          icon: 'material-symbols:translate',
          resourceId: 'translations',
        },
      ]
    },
    {
      type: 'gap'
    },
    {
      type: 'divider'
    },
    {
      type: 'heading',
      label: 'SYSTEM',
    },
    {
      label: 'Users',
      icon: 'flowbite:user-solid',
      resourceId: 'users',
    },
    {
      label: 'Audit Logs',
      icon: 'flowbite:search-outline',
      resourceId: 'audit_logs',
    },
  ],
});

async function seedDatabase() {
  if (await admin.resource('aparts').count() > 0) {
    return
  }
  for (let i = 0; i <= 100; i++) {
    await admin.resource('aparts').create({
      id: randomUUID(),
      title: `Apartment ${i}`,
      square_meter: (Math.random() * 100).toFixed(1),
      price: (Math.random() * 10000).toFixed(2),
      number_of_rooms: Math.floor(Math.random() * 4) + 1,
      description: 'Next gen apartments',
      created_at: (new Date(Date.now() - Math.random() * 60 * 60 * 24 * 14 * 1000)).toISOString(),
      listed: i % 2 == 0,
      country: `${['US', 'DE', 'FR', 'GB', 'NL', 'IT', 'ES', 'DK', 'PL', 'UA'][Math.floor(Math.random() * 10)]}`
    });
  };
};

if (import.meta.url === `file://${process.argv[1]}`) {
  // if script is executed directly e.g. node index.ts or npm start
  const app = express()
  app.use(express.json());
  const port = 3500;

  // needed to compile SPA. Call it here or from a build script e.g. in Docker build time to reduce downtime
  if (process.env.NODE_ENV === 'development') {
    await admin.bundleNow({ hotReload: true});
    console.log('Bundling AdminForth done');
  }

  app.get(`${ADMIN_BASE_URL}/api/dashboard/`,
    admin.express.authorize(
      async (req, res) => {
        const db = admin.resource('aparts').dataConnector.client;
        const days = req.body.days || 7;
        const apartsByDays = await db.prepare(
          `SELECT 
            strftime('%Y-%m-%d', created_at) as day, 
            COUNT(*) as count 
          FROM apartments 
          GROUP BY day 
          ORDER BY day DESC
          LIMIT ?;
          `
        ).all(days);

        const totalAparts = apartsByDays.reduce((acc: number, { count }: { count:number }) => acc + count, 0);

        // add listed, unlisted, listedPrice, unlistedPrice
        const listedVsUnlistedByDays = await db.prepare(
          `SELECT 
            strftime('%Y-%m-%d', created_at) as day, 
            SUM(listed) as listed, 
            COUNT(*) - SUM(listed) as unlisted,
            SUM(listed * price) as listedPrice,
            SUM((1 - listed) * price) as unlistedPrice
          FROM apartments
          GROUP BY day
          ORDER BY day DESC
          LIMIT ?;
          `
        ).all(days);

        const apartsCountsByRooms = await db.prepare(
          `SELECT 
            number_of_rooms, 
            COUNT(*) as count 
          FROM apartments 
          GROUP BY number_of_rooms 
          ORDER BY number_of_rooms;
          `
        ).all();

        const topCountries = await db.prepare(
          `SELECT 
            country, 
            COUNT(*) as count 
          FROM apartments 
          GROUP BY country 
          ORDER BY count DESC
          LIMIT 4;
          `
        ).all();

        const totalSquare = await db.prepare(
          `SELECT 
            SUM(square_meter) as totalSquare 
          FROM apartments;
          `
        ).get();

        const listedVsUnlistedPriceByDays = await db.prepare(
          `SELECT 
            strftime('%Y-%m-%d', created_at) as day, 
            SUM(listed * price) as listedPrice,
            SUM((1 - listed) * price) as unlistedPrice
          FROM apartments
          GROUP BY day
          ORDER BY day DESC
          LIMIT ?;
          `
        ).all(days);
          
        const totalListedPrice = Math.round(listedVsUnlistedByDays.reduce((
          acc: number, { listedPrice }: { listedPrice:number }
        ) => acc + listedPrice, 0));
        const totalUnlistedPrice = Math.round(listedVsUnlistedByDays.reduce((
          acc: number, { unlistedPrice }: { unlistedPrice:number } 
        ) => acc + unlistedPrice, 0));

        res.json({ 
          apartsByDays,
          totalAparts,
          listedVsUnlistedByDays,
          apartsCountsByRooms,
          topCountries,
          totalSquareMeters: totalSquare.totalSquare,
          totalListedPrice,
          totalUnlistedPrice,
          listedVsUnlistedPriceByDays,
        });
      }
    )
  );
  

  // serve after you added all api
  admin.express.serve(app)
  admin.discoverDatabases().then(async () => {
    //
    // !!! IMPORTANT !!!
    // NEVER COMMIT ANY COMMANDS TO INSERT USER WITH superadmin ROLE HERE!!!
    // it is live demo and can be read easily if secret is
    //
    if (!await admin.resource('users').get([Filters.EQ('email', DEMO_EMAIL)])) {
      await admin.resource('users').create({
        email: DEMO_EMAIL,
        password_hash: await AdminForth.Utils.generatePasswordHash(DEMO_PASSWORD),
        role: 'user',  // THE DEMO user role is 'user' not 'superadmin', he can't do any destructive actions
      });
    }
    if (!await admin.resource('users').get([Filters.EQ('email', "admin1@adminfoth.dev")])) {
      await admin.resource('users').create({
        email: "admin1@adminfoth.dev",
        password_hash: await AdminForth.Utils.generatePasswordHash(process.env.ADMIN_PASSWORD),
        role: 'superadmin',  // THE DEMO user role is 'user' not 'superadmin', he can't do any destructive actions
      });
    }

    await seedDatabase();
  });


  admin.express.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
    console.log(`\n⚡ AdminForth is available at http://localhost:${port}${ADMIN_BASE_URL}\n`)
  });
}
