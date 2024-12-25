import betterSqlite3 from 'better-sqlite3';
import express from 'express';
import AdminForth, { AdminUser, Filters } from '../adminforth/index.js';

import AuditLogPlugin from '../adminforth/plugins/audit-log/index.js';
import clicksResource from './resources/clicks.js';
import apartmentsResource from './resources/apartments.js';
import auditLogResource from './resources/audit_log.js';
import descriptionImageResource from './resources/description_image.js';
import usersResource from './resources/users.js';
import gameResource from './resources/game.js';
import gamesUsersResource from './resources/games_users.js';
import gamesResource from './resources/games.js';
import translationsResource from './resources/translation.js';

const ADMIN_BASE_URL = '';

// create test1.db 
const dbPath = 'db.sqlite';
const db = betterSqlite3(dbPath)

async function seedDatabase() {
  if (await admin.resource('aparts').count() > 0) {
    return
  }
  for (let i = 0; i <= 50; i++) {
    await admin.resource('aparts').create({
      id: `${i}`,
      title: `Apartment ${i}`,
      square_meter: (Math.random() * 100).toFixed(1),
      price: (Math.random() * 10000).toFixed(2),
      number_of_rooms: Math.floor(Math.random() * 4) + 1,
      description: 'Next gen apartments',
      created_at: (new Date(Date.now() - Math.random() * 60 * 60 * 24 * 14 * 1000)).toISOString(),
      listed: i % 2 == 0,
      country: `${['US', 'DE', 'FR', 'GB', 'NL', 'IT', 'ES', 'DK', 'PL', 'UA'][Math.floor(Math.random() * 10)]}`,
      property_type: Math.random() > 0.5 ? "'house'" : "'apartment'",
    });
  };
};


const demoChecker = async ({ record, adminUser, resource }) => {
  if (adminUser.dbUser.role !== 'superadmin') {
    return { ok: false, error: "You can't do this on demo.adminforth.dev" }
  }
  return { ok: true };
}

export const admin = new AdminForth({
  baseUrl : ADMIN_BASE_URL,
  auth: {
    usersResourceId: 'users',  // resource for getting user
    usernameField: 'email',
    passwordHashField: 'password_hash',
    userFullNameField: 'fullName', // optional
    loginBackgroundImage: 'https://images.unsplash.com/photo-1534239697798-120952b76f2b?q=80&w=3389&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    loginBackgroundPosition: '1/2', // over, 3/4, 2/5, 3/5 (tailwind grid)
    demoCredentials: "adminforth:adminforth",  // never use it for production
    loginPromptHTML: "Use email <b>adminforth</b> and password <b>adminforth</b> to login",
    // loginBackgroundImage: '@@/pho.jpg',
    rememberMeDays: 30,
    beforeLoginConfirmation: [async ({adminUser, adminforth, extra}) => {
      adminforth.resource('users').update(adminUser.dbUser.id, { last_login_ip: adminforth.auth.getClientIp(extra.headers) });
    }],
    websocketTopicAuth: async (topic: string, adminUser: AdminUser) => {
      if (!adminUser) {
        // don't allow anonymous users to subscribe
        return false;
      }
      const [subject, param] = /^\/(.+?)\/(.+)/.exec(topic)!.slice(1);
      console.log(`Websocket user ${adminUser.username} tries to subscribe to topic ${subject} with param ${param}`);
      if (subject === 'property-cost') {
        return param === adminUser.dbUser.id;
      }
      return false;
    },
    websocketSubscribed: async (topic, adminUser) => {
      const [subject, param] = /^\/(.+?)\/(.+)/.exec(topic)!.slice(1);
      if (adminUser) {
        console.log(`Websocket user ${adminUser.username} subscribed to topic ${subject} with param ${param}`);
      } else {
        console.log(`Unauthenticated user subscribed to topic ${subject} with param ${param}`);
      }
      if (subject === 'property-cost') {
        const userId = param;
        const totalCost = (await admin.resource('aparts').list(Filters.EQ('user_id', userId))).map((r) => r.price).reduce((a, b) => a + b, 0);
        admin.websocket.publish(topic, { type: 'message', totalCost });
      }
    }
  },
  customization: {
    customComponentsDir: './custom',
    globalInjections: {
      // userMenu: '@@/login2.vue',
      header: '@@/PropertyCost.vue',
    },
    customPages:[{
      path : '/login2',
      component: {
        file:'@@/login2.vue',
        meta: {
          customLayout: true,
      }}
    }],
   
    vueUsesFile: '@@/vueUses.ts',  // @@ is alias to custom directory,
    brandName: 'New Reality',
    showBrandNameInSidebar: true,
    // datesFormat: 'D MMM YY',
    // timeFormat: 'HH:mm:ss',
    datesFormat: 'DD MMM',
    timeFormat: 'hh:mm a',

    // title: 'Devforth Admin',
    // brandLogo: '@@/df.svg',
    emptyFieldPlaceholder: '-',
    // styles:{
    //   colors: {
    //     light: {
    //       primary: '#425BB8',
    //       sidebar: {main:'#1c2a5b', text:'white'},
    //     },
    //   }
    // },

    styles:{
      colors: {
        light: {
          // color for buttons, links, etc.
          primary: '#16537e',
          // color for sidebar and text
          sidebar: {
            main:'#232323', 
            text:'white'
          },
        },
        dark: {
          primary: '#8a158d',
          sidebar: {
            main:'#8a158d', 
            text:'white'
          },
        }
      }
    },

    announcementBadge: (adminUser: AdminUser) => {
      return { 
        html: `
<svg xmlns="http://www.w3.org/2000/svg" style="display:inline; margin-top: -4px" width="16" height="16" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/></svg> 
<a href="https://github.com/devforth/adminforth" style="font-weight: bold; text-decoration: underline" target="_blank">Star us on GitHub</a> to support a project!`,
        closable: true,
        title: 'Support us for free',
      }
    },

    // loginPageInjections: {
    //   underInputs: '@@/login2.vue',
    // }
    
    loginPageInjections: {
      underInputs: '@@/CustomLoginFooter.vue',
    },
   },
 


  dataSources: [
    {
      id: 'maindb',
      url: `sqlite://${dbPath}`
    },
    {
      id: 'db2',
      url: 'postgres://postgres:35ozenad@test-db.c3sosskwwcnd.eu-central-1.rds.amazonaws.com:5432'
    },
    {
      id: 'db3',
      url: 'mongodb://127.0.0.1:27017/betbolt?retryWrites=true&w=majority&authSource=admin',
    },
    {
      id: 'ch',
      url: 'clickhouse://demo:demo@localhost:8124/demo',

    }
  ],
  resources: [
    clicksResource,
    auditLogResource,
    apartmentsResource,
    usersResource,
    descriptionImageResource,
    gamesResource,
    gamesUsersResource,
    gameResource,
    translationsResource,
  ],
  menu: [
    {
      label: 'Dashboard',
      icon: 'flowbite:chart-pie-solid',
      component: '@@/Dash.vue',
      path: '/dashboard',
      // homepage: true,
      isStaticRoute:false,
      // meta:{
      //   title: 'Dashboard',
      // }
    },
    {
      label: 'Core',
      icon: 'flowbite:brain-solid', //from here https://icon-sets.iconify.design/flowbite/
      open: true,
      children: [
        {
          label: 'Apartments',
          icon: 'flowbite:home-solid',
          resourceId: 'aparts',
          badge: async (adminUser) => {
            return '10'
          }
        },
        {
          label: 'Description Images',
          resourceId: 'description_images',
          icon: 'flowbite:image-solid',

        },

        // {
        //   label: 'Games',
        //   icon: 'flowbite:caret-right-solid',
        //   resourceId: 'games',
        // },
        // {
        //   label: 'Games Users',
        //   icon: 'flowbite:user-solid',
        //   resourceId: 'games_users',
        //   visible:(user) => {
        //     return user.dbUser.role === 'superadmin'
        //   }
        // },
        // {
        //   label: 'Casino Games',
        //   icon: 'flowbite:caret-right-solid',
        //   resourceId: 'game',
        // },

        {
          label: 'Clicks',
          icon: 'flowbite:search-outline',
          resourceId: 'clicks',
        },
        {
          label: 'Translations',
          icon: 'material-symbols:translate',
          resourceId: 'translations',
        }
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
      // visible:(user) => {
      //   return user.dbUser.role === 'superadmin'
      // }
    },
    {
      label: 'Logs',
      icon: 'flowbite:search-outline',
      resourceId: 'audit_log',
    },
  ],
})


const app = express()
app.use(express.json());
const port = 3000;

(async () => {
    console.log('🅿️🅿️🅿️ 🅿️Bundling AdminForth...');
    // needed to compile SPA. Call it here or from a build script e.g. in Docker build time to reduce downtime
    await admin.bundleNow({ hotReload: process.env.NODE_ENV === 'development'});
    console.log('Bundling AdminForth done. For faster serving consider calling bundleNow() from a build script.');

})();


// add api before .serve
app.get(
  '/api/testtest/', 
  admin.express.authorize(
    async (req, res, next) => {
        res.json({ ok: true, data: [1,2,3], adminUser: req.adminUser });
    }
  )
)

app.get(`${ADMIN_BASE_URL}/api/dashboard/`,
  admin.express.authorize(
    admin.express.translatable(
      async (req, res) => {
        admin.getPluginByClassName<AuditLogPlugin>('AuditLogPlugin').logCustomAction(
          'aparts',
          null,
          'visitedDashboard',
          { dashboard: 'main' },
          req.adminUser,
          req.headers
        )

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

        const totalAparts = apartsByDays.reduce((acc, { count }) => acc + count, 0);

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
          
        const totalListedPrice = Math.round(listedVsUnlistedByDays.reduce((acc, { listedPrice }) => acc + listedPrice, 0));
        const totalUnlistedPrice = Math.round(listedVsUnlistedByDays.reduce((acc, { unlistedPrice }) => acc + unlistedPrice, 0));

        res.json({ 
          apartsByDays,
          totalAparts,
          listedVsUnlistedByDays,
          totalListedPrice,
          totalUnlistedPrice,
          listedVsUnlistedPriceByDays,
          greeting: await req.tr('Welcome, {name}', 'customApis', { name: req.adminUser.username }),
        });
      }
    )
  )
);

// serve after you added all api
admin.express.serve(app)
admin.discoverDatabases().then(async () => {
  console.log('🅿️🅿️🅿️ 🅿️Database discovered');

  if (!await admin.resource('users').get([Filters.EQ('email', 'adminforth')])) {
    await admin.resource('users').create({
      email: 'adminforth',
      password_hash: await AdminForth.Utils.generatePasswordHash('adminforth'),
      role: 'superadmin',
    });
  }
  await seedDatabase();
});

admin.express.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
  console.log(`\n⚡ AdminForth is available at http://localhost:${port}${ADMIN_BASE_URL}\n`)
});