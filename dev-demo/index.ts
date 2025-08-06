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
    // loginPromptHTML: async () => { 
    //   const adminforthUserExists = await admin.resource("users").count(Filters.EQ('email', 'adminforth')) > 0;
    //     if (adminforthUserExists) {
    //       return "Please useeee <b>adminforth</b> as username and <b>adminforth</b> as password"
    //     }
    //   },
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
          primary: '#00acb5',
          ListTableHeading: '#2fe0c9',
          Form:"#fffa94",

          List: "#FFFFFF", 
          ListTable: "#FFFFFF",
          // ListTableHeading: "#f5f5f8", 
          ListTableHeadingText: "alias:lightListTableHeading inverse",
          ListTableText: "#alias:lightListTableHeadingText",
          ListTableRowHover: "rgb(249 250 251)",
          ListBreadcrumbsText: "#666666",
          ListBorder: "#DDDDDD", 

          //Form: "alias:lightListTableHeading lighten", 
          Border: "#F5F5F5", 
          FormHeading: "alias:lightListTableHeading", 
          FormFieldTextColor: "alias:lightListTableText",

          Buttons: "#FFFFFF", 
          ButtonsBorder: "#DDDDDD", 
          ButtonsText: "#111827",
          ButtonsHover: "#f3f4f6",
          ButtonsBorderHover: "#f3f4f6",  
          ButtonsActive: "#f3f4f6", 
          ButtonsDisabled: "#f3f4f6", 
          ButtonsDisabledText: "#f3f4f6", 
          ButtonsIcon: "#333333",
          
          DropdownButtonsBackground: "alias:lightForm lighten", 
          DropownButtonsBorder: "alias:lightForm darken",
          DropdownButtonsText: "alias:lightFormFieldTextColor",
          DropdownButtonsPlaceholderText: "alias:lightFormFieldTextColor opacity:0.6", 

          DropdownOptionsBackground: "alias:lightForm lighten",
          DropdownOptionsHoverBackground: "#alias:lightForm darken",
          DropdownPicked:"alias:lightDropdownOptionsHoverBackground opacity:0.5", 
          DropdownOptionsText: "alias:lightFormFieldTextColor", 

          DropdownMultipleSelectBackground: "alias:lightDropdownOptionsBackground opacity:0.8",
          DropdownMultipleSelectText: "alias:lightDropdownOptionsText lighten",
          DropdownMultipleSelectIcon: "alias:lightPrimary",
          DropdownMultipleSelectIconHover: "alias:lightPrimary darken",
          DropdownMultipleSelectIconFocus: "alias:lightPrimary darken",
          DropdownMultipleSelectIconFocusBackground: "alias:lightPrimary opacity:0.1",

          CheckboxBgUnchecked: "alias:lightPrimaryContrast lighten",
          CheckboxBgChecked: "alias:lightPrimary",
          CheckboxIconColor: "alias:lightPrimaryContrast lighten", 
          CheckboxBorderColor: "alias:lightPrimary darken", 
          FocusRing: "alias:lightPrimary lighten",
          TextLabel: "black",

          ToggleBgUnactive: "alias:lightPrimaryContrast darken",
          ToggleBgActive: "alias:lightPrimary darken",
          ToggleCircle: "alias:lightPrimaryContrast lighten",
          ToggleRing: "alias:lightPrimary lighten",
          ToggleText: "black",
          ToggleBorderUnactive: "alias:lightPrimary lighten", 
          ToggleBorderActive: "alias:lightPrimary darken", 

          ColumnValueInputBackground: "alias:lightForm lighten", 
          ColumnValueInputPlaceholderText: "alias:lightFormFieldTextColor opacity:0.6", 
          ColumnValueInputText: "alias:lightFormFieldTextColor",
          ColumnValueInputBorder: "alias:lightForm darken",
          ColumnValueInputIcons: "alias:lightPrimary",

          InputBackground: "alias:lightForm lighten",
          InputPlaceholderText: "alias:lightFormFieldTextColor opacity:0.6",
          InputText: "alias:lightFormFieldTextColor",
          InputBorder: "alias:lightForm darken",
          InputBackgroundHover: "alias:lightInputBackground darken",
          InputTextHover: "alias:lightInputText lighten",
          InputBorderHover: "alias:lightInputBorder darken",
          InputFocusRing: "alias:lightInputBorderHover opacity:0.4",
          InputIconColor: "alias:lightPrimary opacity:0.8",
          InputErrorColor: "#DC2626",
          RequiredIconColor: "alias:lightPrimary",

          TooltipBackground: "alias:lightPrimary opacity:0.6",
          TooltipText: "alias:lightTooltipBackground inverse",

          VerticalTabsText: "alias:lightPrimaryContrast",
          VerticalTabsTextHover: "alias:lightVerticalTabsText lighten",
          VerticalTabsBackground: "alias:lightPrimary opacity:0.2",
          VerticalTabsBackgroundHover: "alias:lightPrimary opacity:0.5",
          VerticalTabsTextActive: "alias:lightPrimaryContrast",
          VerticalTabsBackgroundActive: "alias:lightPrimary",
          VerticalTabsSlotText: "alias:lightHtml inverse",

          DialogBackgorund: "alias:lightPrimary",
          DialogBreakLine: "alias:lightDialogBackgorund darken",
          DialogHeaderText: "alias:lightDialogBackgorund inverse",
          DialogCloseButton: "alias:lightDialogBreakLine",
          DialogCloseButtonHover: "alias:lightDialogCloseButton darken",
          DialogCloseButtonHoverBackground: "alias:lightDialogBreakLine",
          DialogBodyText: "alias:lightDialogBackgorund inverse",

        },
        dark: {
          primary: '#bd1a76',

          List: "#111111", 
          ListTable: "#1f2937", 
          ListTableHeading: "#db0dbc", 
          ListTableHeadingText: "alias:darkListTableHeading inverse",
          ListTableText: "alias:darkListTableHeadingText", 
          ListTableRowHover: "rgb(35 47 65)",
          ListBreadcrumbsText: "#BBBBBB", 
          ListBorder: "#444444", 

          Form: "#36bfb4", 
          FormBorder: "#222222", 
          FormHeading: "alias:darkListTableHeading",
          FormFieldTextColor: "alias:darkListTableText",

          DropdownButtonsBackground: "alias:darkForm darken",
          DropownButtonsBorder: "alias:darkForm lighten", 
          DropdownButtonsText: "alias:darkListTableText",
          DropdownButtonsPlaceholderText: "alias:darkListTableText opacity:0.6",

          DropdownOptionsBackground: "alias:darkForm ",
          DropdownOptionsHoverBackground: "#alias:darkForm darken",
          DropdownPicked:"alias:darkDropdownOptionsHoverBackground opacity:0.5",
          DropdownOptionsText: "alias:darkListTableText",

          DropdownMultipleSelectBackground: "alias:darkDropdownOptionsBackground opacity:0.8",
          DropdownMultipleSelectText: "alias:darkDropdownOptionsText lighten",
          DropdownMultipleSelectIcon: "alias:darkPrimary",
          DropdownMultipleSelectIconHover: "alias:darkPrimary darken",
          DropdownMultipleSelectIconFocus: "alias:darkPrimary darken",
          DropdownMultipleSelectIconFocusBackground: "alias:darkPrimary opacity:0.1",

          CheckboxBgUnchecked: "alias:darkPrimaryContrast lighten",   
          CheckboxBgChecked: "alias:darkPrimary",      
          CheckboxIconColor: "alias:darkPrimaryContrast lighten",    
          CheckboxBorderColor: "alias:darkPrimary darken",  
          FocusRing: "alias:darkPrimary lighten",
          TextLabel: "white",

          ToggleBgUnactive: "alias:darkPrimaryContrast darken",
          ToggleBgActive: "alias:darkPrimary darken",
          ToggleCircle: "alias:darkPrimaryContrast lighten",
          ToggleRing: "alias:darkPrimary lighten",
          ToggleText: "alias:darkPrimaryContrast lighten", 
          ToggleBorderUnactive: "alias:darkPrimary lighten",
          ToggleBorderActive: "alias:darkPrimary darken",

          ColumnValueInputBackground: "alias:darkForm darken",
          ColumnValueInputPlaceholderText: "alias:darkFormFieldTextColor opacity:0.6",
          ColumnValueInputText: "alias:darkFormFieldTextColor",
          ColumnValueInputBorder: "alias:darkForm darken",
          ColumnValueInputIcons: "alias:darkPrimary",

          InputBackground: "alias:darkForm darken",
          InputPlaceholderText: "alias:darkFormFieldTextColor opacity:0.6",
          InputText: "alias:darkFormFieldTextColor",
          InputBorder: "alias:darkForm lighten",
          InputHover: "alias:darkInputBackground darken",
          InputTextHover: "alias:darkInputText darken",
          InputBorderHover: "alias:darkInputBorder darken",
          InputFocusRing: "alias:darkInputBorderHover opacity:0.4",
          InputIconColor: "alias:darkPrimary opacity:0.8",
          InputErrorColor: "#DC2626",
          RequiredIconColor: "alias:darkPrimary",

          TooltipBackground: "alias:darkPrimary opacity:0.6",
          TooltipText: "alias:darkTooltipBackground inverse",

          VerticalTabsText: "alias:darkPrimaryContrast",
          VerticalTabsTextHover: "alias:darkVerticalTabsText darken",
          VerticalTabsBackground: "alias:darkPrimary opacity:0.2",
          VerticalTabsBackgroundHover: "alias:darkPrimary opacity:0.5",
          VerticalTabsTextActive: "alias:darkPrimaryContrast",
          VerticalTabsBackgroundActive: "alias:darkPrimary",
          VerticalTabsSlotText: "alias:darkHtml inverse",

          DialogBackgorund: "alias:darkPrimary",
          DialogBreakLine: "alias:darkDialogBackgorund darken",
          DialogHeaderText: "alias:darkDialogBackgorund inverse",
          DialogCloseButton: "alias:darkDialogBreakLine",
          DialogCloseButtonHover: "alias:darkDialogCloseButton darken",
          DialogCloseButtonHoverBackground: "alias:darkDialogBreakLine",
          DialogBodyText: "alias:darkDialogBackgorund inverse",
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
      url: 'clickhouse://demo:demo@localhost:8124/demo',
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