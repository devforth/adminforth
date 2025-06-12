import betterSqlite3 from 'better-sqlite3';
import express from 'express';
import AdminForth, { AdminUser, Filters } from '../adminforth/index.js';

import clicksResource from './resources/clicks.js';
import apartmentsResource from './resources/apartments.js';
import apartmentBuyersResource from './resources/apartment_buyers.js';
import auditLogResource from './resources/audit_log.js';
import descriptionImageResource from './resources/description_image.js';
import usersResource from './resources/users.js';
// import gameResource from './resources/game.js';
// import gamesUsersResource from './resources/games_users.js';
// import gamesResource from './resources/games.js';
import translationsResource from './resources/translation.js';
import clinicsResource from './resources/clinics.js';
import providersResource from './resources/providers.js';
import apiKeysResource from './resources/api_keys.js';
import CompletionAdapterOpenAIChatGPT from '../adapters/adminforth-completion-adapter-open-ai-chat-gpt/index.js';
import pkg from 'pg';
import I18nPlugin from '../plugins/adminforth-i18n/index.js';
const { Client } = pkg;


declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: string;
      DATABASE_URL: string;
      OPENAI_API_KEY: string;
      PORT: string;
    }
  }
}

// const ADMIN_BASE_URL = '/portal';
const ADMIN_BASE_URL = '';

async function seedDatabase() {

  const adapter = new CompletionAdapterOpenAIChatGPT({
    openAiApiKey: process.env.OPENAI_API_KEY as string,
    model: 'gpt-4o-mini',
    expert: {
      // for UI translation it is better to lower down the temperature from default 0.7. Less creative and more accurate
      temperature: 0.5,
    },
  });

  if (await admin.resource('aparts').count() > 0) {
    return
  }
  for (let i = 0; i <= 100; i++) {
    const country = `${['US', 'DE', 'FR', 'GB', 'NL', 'IT', 'ES', 'DK', 'PL', 'UA'][Math.floor(Math.random() * 10)]}`;
    const resp = await adapter.complete(`Generate some example apartment name (like AirBNB style) in some city of ${country}. Answer in JSON format { "title": "<generated title>" }. Do not talk to me, return JSON only.`);
    const json = JSON.parse(resp.content?.replace(/```json\n/, '').replace(/\n```/, ''));
    await admin.resource('aparts').create({
      id: `${i}`,
      title: json.title,
      square_meter: (Math.random() * 100).toFixed(1),
      price: (Math.random() * 10000).toFixed(2),
      number_of_rooms: Math.floor(Math.random() * 4) + 1,
      description: 'Next gen apartments',
      created_at: (new Date(Date.now() - Math.random() * 60 * 60 * 24 * 14 * 1000)).toISOString(),
      listed: (Math.random() > 0.5),
      country,
    });
  };
};


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
    adminforthUserExists: async (): Promise<boolean> => {
      return !!await admin.resource('users').get([Filters.EQ('email', 'adminforth')]);
    },
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
      userMenu: '@@/login2.vue',
      // header: '@@/PropertyCost.vue',
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

    adminforthUserCleanupWarning: (adminUser: AdminUser) => {
      return {
        html: `
          <p>The default admin user adminforth is still active in production.</p>
          <p>For security reasons, it's strongly recommended to create your own account and delete this default user.</p>
          <br>
          <p><strong>This action is critical and cannot be undone.</strong></p>
        `,
        closable: false,
        title: 'Critical Security Warning',
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
      url: process.env.DATABASE_URL,
    },
    {
      id: 'pg',
      url: 'postgres://demo:demo@localhost:53321/demo',
    },
    {
      id: 'db3',
      url: 'mongodb://127.0.0.1:27028/demo?retryWrites=true&w=majority&authSource=admin',
    },
    {
      id: 'ch',
      url: 'clickhouse://demo:demo@localhost:8125/demo',
    },
    {
      id: 'mysql',
      url: 'mysql://demo:demo@localhost:3307/demo',
    },
  ],
  resources: [
    clicksResource,
    auditLogResource,
    apartmentsResource,
    apartmentBuyersResource,
    usersResource,
    descriptionImageResource,
    clinicsResource,
    providersResource,
    apiKeysResource,
    // gamesResource,
    // gamesUsersResource,
    // gameResource,
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
          label: 'Potential Buyers',
          icon: 'flowbite:user-solid',
          resourceId: 'apartment_buyers',
        },
        {
          label: 'Description Images',
          resourceId: 'description_images',
          icon: 'flowbite:image-solid',

        },

        // {
        //   label: 'Games',
        //   icon: 'flowbite:caret-right-solid',
        //   resourceId: 'game',
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
          label: 'Clinics',
          icon: 'flowbite:building-solid',
          resourceId: 'clinics',
        },
        {
          label: 'Providers',
          icon: 'flowbite:user-solid',
          resourceId: 'providers',
        },
        {
          label: 'API Keys',
          icon: 'flowbite:search-outline',
          resourceId: 'api_keys',
        },
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
const port = process.env.PORT || 3000;

(async () => {
    console.log('🅿️  Bundling AdminForth...');
    // needed to compile SPA. Call it here or from a build script e.g. in Docker build time to reduce downtime
    await admin.bundleNow({ hotReload: process.env.NODE_ENV === 'development'});
    console.log('Bundling AdminForth SPA done.');
})();


// add api before .serve
app.get(
  '/api/testtest/', 
  admin.express.authorize(
    async (req: express.Request, res: express.Response, next: express.NextFunction) => { 
        res.json({ ok: true, data: [1,2,3], adminUser: req.adminUser });
    }
  )
)

app.get(`${ADMIN_BASE_URL}/api/dashboard/`,
  admin.express.authorize(
    admin.express.translatable(
      async (req: any, res: express.Response) => {
        const days = req.body.days || 7;
        const apartsByDays = await admin.resource('aparts').dataConnector.client.prepare( 
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
        const listedVsUnlistedByDays = await admin.resource('aparts').dataConnector.client.prepare(
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

        const apartsCountsByRooms = await admin.resource('aparts').dataConnector.client.prepare(
          `SELECT 
            number_of_rooms, 
            COUNT(*) as count 
          FROM apartments 
          GROUP BY number_of_rooms 
          ORDER BY number_of_rooms;
          `
        ).all();

        const topCountries = await admin.resource('aparts').dataConnector.client.prepare(
          `SELECT 
            country, 
            COUNT(*) as count 
          FROM apartments 
          GROUP BY country 
          ORDER BY count DESC
          LIMIT 4;
          `
        ).all();

        const totalSquare = await admin.resource('aparts').dataConnector.client.prepare(
          `SELECT 
            SUM(square_meter) as totalSquare 
          FROM apartments;
          `
        ).get();

        const listedVsUnlistedPriceByDays = await admin.resource('aparts').dataConnector.client.prepare(
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

        const apartsCount = 10;
        res.json({ 
          apartsByDays,
          totalApartsString: await req.tr('{count} apartment | {count} apartments', 'test', {count: apartsCount}, apartsCount),
          totalAparts: apartsCount,
          listedVsUnlistedByDays,
          apartsCountsByRooms,
          topCountries,
          totalSquareMeters: totalSquare.totalSquare,
          totalListedPrice,
          totalUnlistedPrice,
          listedVsUnlistedPriceByDays,

          languages: await admin.getPluginByClassName<I18nPlugin>('I18nPlugin').languagesList(),
          trExample: await req.tr('Hello there2', 'test'),
        });
      }
    )
  )
);

app.get(`${ADMIN_BASE_URL}/api/aparts-by-room-percentages/`,
  admin.express.authorize(
    async (req, res) => {
      const roomPercentages = await admin.resource('aparts').dataConnector.client.prepare(
        `SELECT 
          number_of_rooms, 
          COUNT(*) as count 
        FROM apartments 
        GROUP BY number_of_rooms
        ORDER BY number_of_rooms;
        `
      ).all()
      

      const totalAparts = roomPercentages.reduce((acc, { count }) => acc + count, 0);

      res.json(
        roomPercentages.map(
          ({ number_of_rooms, count }) => ({
            amount: Math.round(count / totalAparts * 100),
            label: `${number_of_rooms} rooms`,
          })
        )
      );
    }
  )
);


// serve after you added all api
admin.express.serve(app);


(async function () {
  const c = new Client({
      connectionString: 'postgres://demo:demo@localhost:53321/demo',
  });
  await c.connect();
  await c.query(
    `CREATE TABLE IF NOT EXISTS clinics (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL
    );`
  );
})();

admin.discoverDatabases().then(async () => {
  console.log('🅿️  Database discovered');

  if (!await admin.resource('users').get([Filters.EQ('email', 'adminforth')])) {
    await admin.resource('users').create({
      email: 'adminforth',
      password_hash: await AdminForth.Utils.generatePasswordHash('adminforth'),
      role: 'superadmin',
    });
  }
  await seedDatabase();

  // create table clinics in postgress,
 // id               Int               @id @db.SmallInt @default(autoincrement()) 
 // name            String            @db.VarChar(255)

});

admin.express.listen(port, () => {
  // word adminforth should be colored (blue) in the console and bold
  console.log(`\n\n ${admin.formatAdminForth()} available at http://localhost:${port}${ADMIN_BASE_URL}\n\n`)
});