# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [v1.5.9] - next

### Changed

- now you should use import adminforth from '@/adminforth' instead of window.adminforth. It has type hints and is more reliable

### Fixed
- show hook is now called as it was when user edits the page
- fixed showRow in ShowTable.vue
- if not ab le to connect postgres, don't crash the app

### Improved
- reduce stdout output from AdminForth itself

### Added
- AFCL Chart components
- add requestUrl param to hooks extra

## [v1.5.8]

### Added

- Command to generate typescript models `npx -y adminforth generate-models --env-file=.env`
- add i18n support: add vue-i18n to frontend and tr function to backend. This will allow to implement translation plugins
- badgeTooltip - now you can add a tooltip to the badge to explain what it means
- ability to authorize not only subscription on websocket but filter out whom users message will be published (updated doc)
- added ability to refresh menu item badge from the backend using websocket publish
- fix bugs when e.g. UR (urdu) can't be recognized by LLM (define names explicitly)
- make user menu switch shorter
- next param support on login route (also preserve next param between login/signup navigation)

### Improved

- Added separate BeforeCreateSave function in types without oldRecord and make oldRecord mandatory in existing BeforeSaveFunction
- Added dataConnector: IAdminForthDataSourceConnectorBase; into IOperationalResource - for reusing connectors from users code

### Fixed

- WS on base URL
- favicon when using BaseURL
- Mongo: fix search by strings with "+" and other special characters
- mongo storing boolean as true/false now. Before it was 1/0 which broke compatibility with many other ORMs

## [v1.5.7] - 2024-12-09

### Fixed

- Resolved issue with filters being displayed incorrectly
- USe  `IS DISTINCT FROM` for [AdminForthFilterOperators.NE] in postgress to properly compare for note equal when values hold zero

### Added
- Added adapters

## [v1.5.6] - 2024-12-06

### Fixed
- Form hooks to fix file upload plugin
- fixed inability to use multiple upload plugins on one resource
- wrong title which not respects title/brandname sometimes or uncovers AdminForth instead of brandName in some cases
- Added dynamic positioning for dropdown in Select component
- Added validation to dropzone
- rounding corderns on show view
- boolean field which is required has no "unset" option

## Updated

- flowbite icons package

## Improved

- Remove border/background and surrounding padding from tab widget


## [v1.5.5]

### Fixed

- if selected checkboxes after refresh have no relevant items, they are now cleared (e.g. after delete manually or switching page)
- for custom pages try use their label (same as in menu) after meta.title for the <meta> <title> tags
- old bug: when going to custom page and not being authorized it blinks with own content
- get rid of `getClientIp` function, and replace it with `admin.auth.getClientIp` which respects new setting `auth.clientIpHeader`

### Improved

- afcl Select now supports `extra-item` slot to add extra item at the bottom of the list

### Added

- afcl Checkbox and afcl Dropzone


## [1.5.4]

### Fixed
- decimal null check in mongo
- socket now is reconnected on logout and reconnected (to reset user and permissions on current connection)
- also socket is reconnected on login to improve user auth and permissions on current connection

### Imporved
- fixed several typechecks for frontend and cusotm user frontend components
- reshaped types on backend to distinguish inputs from runtime

## [1.5.3]

### Fixed
- add websocket reconnect on disconnect
- fixed bundleNow.ts to exit process
- not collected loginPageInjections of user

### [1.5.2]

### Fixed

- wrong dev dependenciy which should be in dependencies
- added VerticalTabs component to AFCL
- cleanup unused deps

## [1.5.1]

### Fixed

- postgresql now can be accessed via `postgresql` scheme in addition to `postgres` scheme
- Postgres wrap table names in quotes in SQL queries to prevent any issues with reserved words
- move nonesense "IN" blank array check to not pass this case to any data connector for both data API and standard pages 
- reduce login /logout CLS
- allocate new port for dev server if old one is busy, allow parallel development on 2 apps
- fix HMR in vite, now Vue files during adminforth dev and app dev are reloaded smoothly
- add INotify watchers to files instead of dirs to minimaze CP operation volume and CPU usage
- add adminforth instance into hooks
- removed several warnings and unneded outputs in console
- security fix: remove full item after fetch in `get_resource_foreign_data` (foreign requests exposed backendOnly fields)
- count in postgress forced to return number
- fixed sources for allowedActions in hooks
- menu now auto-closes on mobile after selecting item
- backplate on mobile now is higher then table sticky header
- fix split js error when going to 404 page in logged out state

### Improved

- primary color adoption for login page
- menu badges now loaded in "lazy" mode to not block the menu rendering
- added `adminforth.menu.refreshMenuBadges()` to refresh all badges in menu from the frontend component
- created env HEAVY_DEBUG_QUERY to log SQL queries in the console
- simplified logic on detecting whether to init user Dropdown or not
- add autocomplete suggestion for password inputs


### Added

- Start creating AFCL - AdminForth Components Library
- AFCL Link
- AFCL Button
- AFCL Select (based on old Dropdown component, add slots to it)
- move old AfTooltip to @/afcl/Tooltip
- Ability to set read-only fields
- Websockets


## [1.4.2]

- fix type mismatch in dataSourceColumns

## [1.4.1]

### Fixed
- Indicate pagination wrong page

### Improved
- after bundling in tmp location, copy dist folder back to the dist of spa (in node_modules),
after this we can apply /tmp caching in docker using `RUN --mount=type=cache,target=/tmp` and keep spa served from container
- use brandName for tmp folder isolations so you can develop multiple apps on the same machine
- implement Frontend API for silent table refresh and silent row update
- add option `listRowsAutoRefreshSeconds` - to silently auto-refresh rows in list every N seconds
- add JSONB and JSON data types support for Postgres
- allow to set `column.extra.jsonCollapsedLevel` to collapse JSON fields in the show/list views.
- significant types refactor to split Common types (both front and back) and back types     
- fix bug when clear filter

## [1.3.56]

### Fixed

- make theme reactive in storage
- suggest NodeNext for getting started and hello world for right completions
- CompactUUID renderer fixes
- remove initFlowbite call from components which used tooltip, and moved tooltip to seaparate component. 
This fixed extra resources allocation on the page, improved scroll performance
- applied shrink table strategy on list table for better UX (scrolls are now inside of table so you can switch pages without scrolling to the end of the page)
- fix border radius between show/edit/create pages
- fix loginPageInjections is not getting listified and might crash plugin which uses it
- AuditLog plugin diff field on mobile screens now works with more convenient unified mode
- make table label column fixed width

### Improved

- Isolate cookies for case when you have multiple adminForth apps on one machine

### Added

- URL renderer `@/renderers/URL.vue`
- Fields grouping

## [1.3.55] - 2024-10-21

### Fixed

- When discovery is no started, getUserByPk will show error in console
- Clickhouse count for some clickhouse versions
- overflow on mobile
- comapct UUID value renederer shows no copy button when value is empty
- support for Bool and DateTime64 data types in Clickhouse
- add .d.ts files for type hints

### Added

- Now you can get plugin instance by Plugin class name (for single plugins): `admin.getPluginByClassName<AuditLogPlugin>('AuditLogPlugin')`
- Pre-made field renderer`@/renderers/CompactUUID.vue`
- Pre-made field renderer`@/renderers/CountryFlag.vue`
- "Add new" button to show

### Improved

- Filters, page and sort are now saved to query parameters
- Don't install users packages which are already in AdminForth
- Add `json` renderer for json fields
- Add validation for `defaultSort` in resource options
- set target=es2017 in tsconfig (min node version is >=8), to remove awaiters


## [1.3.53] - 2024-10-09

### Improved

- Paddings for table now are smaller on lower screen sizes
- added user pk to adminUser passed to page injection components

### Fixed

- Remove dump sidebar on every page
- Add config.customization.globalInjections

### Added

- Util function to get client IP address from request import { getClientIp } from 'adminforth';
- Util to Rate limit requests import { RateLimiter } from 'adminforth';

## [1.3.51] - 2024-10-03

### Fixed

- `timeFormat` fix for pure time stamps
- page input in list table now autogrows in large values
- plugin was not able to use more then one package in `custom` folder package.json
- express server proxy now has `blobStream()` method which returns stream for blob data e.g. for piping


## [1.3.48] - 2024-10-02

### Added

- `timeFormat` and `dateFormat` are now separated, datetime is concatinated from them. 
This allows to specify formats for all time stamps date stampts and datetime stamps separately


## [1.3.46] - 2024-10-02

### Fixed
- when page input is focused and changed focus to losts

### Improved

- listTableClickUrl supports target blank
- listTableClickUrl supports null



## [1.3.45]

### Fixed

- Page backspace requests first page


## [1.3.43]

### Fixed
- homepage detection for case when no childer items are present


## [1.3.42]

### Fixed
- more minor validation and typo suggestionss

## [1.3.41]

### Fixed
- allow use table instead of resource id for auth resource

### Added

- add email validator AdminForth.Utils.EMAIL_VALIDATOR


## [1.3.40] - 2024-10-01

### Fixed
- removed  -moz-user-select for unwanted side effects like selecting wierd rectangles in table cells when 
new page should be opened
- fix ctrl+click in for default table items
- fix title (try to get it from resource label first, then fallback to humanified router param)


## [1.3.34] - 2024-09-32

### Fixed

- run bulk action without allowed attribute


## [1.3.33] - 2024-09-32

### Improved

- make `listTableClickUrl` to be async


## [1.3.32] - 2024-09-31

### Fixed

- was unable to set foreign item to empty on edit page
- bulkActions without 'allowed' property did not show up. 

### Added

- add new injection for icons in table: `customActionIcons`
- listTableClickUrl - allows to define where to navigate when user clicks on the row in the list table

## [1.3.31] - 2024-09-30

### Fixed

- minLength + not required columns now work correctly
- add opacity to disabled save button
- don't discover virtual columns for mongo

## [1.3.28] - 2024-09-27

### Improved

- Password reset now respects same password constraints as on the user creation from virtual field
- Regexes in `column.validation` now support insensitive and other flags

### Fixed

- Updating fields did not respect native data types on the update data apu

## Changed

- Now create/update/delete methods which run hooks where ejected fromr est api, makes them available from plugin
- In data connector interface added update with original values


## [1.3.26] - 2024-09-26

### Added
- threeDotsDropdownItems page injection
- plugin for import/export
- add alert after edit created

### Fixed
- fix login issue when rememberMe is not set
- Cookie expiration time is synced with JWT token expiration time, had no expiration before (session cookie)

## [1.3.23] - 2024-09-25

### Added
- "Remember me" option on login page
- allow to specify expiration time during issuing JWT token

## [1.3.22] - 2024-09-25

### Improved

- close all toasts automatically if during route change they exist more then 5 seconds. 
- Also for alerts without timeout param set 30 seconds as default timeout, you still can use 'unlimited' intentially to never hide alert 
- Add alert when record is created
- Add delete bulk action confirmation as default behavior, allow to return successMessage from bulk action

### Security fixes

- When user was nto found during login, return same message as when password is wrong to prevent email/username enumeration


## [1.3.21] - 2024-09-25

### Added

- Added underInputs injection to login page
- now plugins can issue a JWT tokens without users (to not expose user id in the token), userless verification achieved by setting decodeUser param in auth.verify to false

## [1.3.18] - 2024-09-20

### Fixed

- Skeeleton loaders now work correctly on the list page
- Multilevel sort is working with Ctrl+click. Without Ctrl sort is single-level

## [1.3.17] - 2024-09-18

### Fixed

- If value in enum type field is not in the list, it is now shown as a string instead of empty value on list/show

### Changed

- Move light and dark switch from menu to the top right corner of the page


### Added

- `enforceLowerCase` option for text/string columns. Might be handy for emails to comply with RFC 5321 and RFC 5322, usernames etc.
We recommend setting it to email field for users table (updated in the tutorial)


## [1.3.16] - 2024-09-18

### Fixed

- upgrade express dep to fix security vulnerability


## [1.3.15] - 2024-09-17

## Fixed
- Empty pagination
- Edit/Create form: create rules (note, required etc) applied from edit mode instead of create mode when user entered first value on create
- Remove duplicated requests when moving from page to page
- Internal code improvements to simplify filters cleanup on pages navigation
- fix unique checks in both data API and UI

## [1.3.14] - 2024-09-16

### Improved

- Move unique check to the data API and make requests parallel to speed up the response time 
- Now create data API returns error and ok:true/false code. 

### Added

- loginBackgroundPosition - now you can set position and size of the login background image. By default it is `1/2` which means image will be in the left side of the login page with cover mode. You can also set it to `over` to make image over the whole login page with cover mode.

### Changed

- showBrandNameInSidebar - now to hide brand name in the sidebar you have to use this new option (on the same level with brandName).
Previously you had to set brandName to empty string. By default it is `true`.

## [1.3.13] - 2024-09-13

## Fixed

- Selecting one item in some cases selected all (if id attribute had name different from id)
- DataAPI create is now returning full created record (handy when e.g. id field auto-populated by fillOnCreate)

## [1.3.9] - 2024-09-12

### Improved

- Rename `primaryKey` to `recordId` in all hooks

### Added

- SQLite now supports native `DATETIME` type

## [1.3.5] - 2024-09-12

### Fixed

- Mongo filtering issues (e.g. user can't login because filters was not applied)

### Added

- `primaryKey` to all before/after save hooks so e.g. in update you can understand for what record it is called


## [1.3.1] - 2024-09-12

### Added

- Data API using admin.resource(xxx).get/list/create/update/delete

### Improved
- Use fuse search to suggest developers right names during config validations in case of typos in config e.g. when user specified non-existing resourceId

### Breaking changes

- Removed `rootUser` from everywhere. 
Now you need to create a first user via dataApi:

```js
  admin.discoverDatabases().then(async () => {
    if (!await admin.resource('users').get([Filters.EQ('email', 'adminforth')])) {
      await admin.resource('users').create({
        email: 'adminforth',
        password_hash: await AdminForth.Utils.generatePasswordHash('adminforth'),
        role: 'superadmin',
      });
    }
  });
```

## [1.2.99] - 2024-09-14

### Fixed

- Sorting in Mongo datasource connector

### Improved

- Items count request in table and datasource interface moved to separate method
This allows to run it in parallel with a list request to speed up the response time


## [1.2.86] - 2024-08-20

### Improved
- Better resource names generation


## [1.2.85] - 2024-08-20

### Fixed
- Improve look of foreign references in ResourceListTable

## [1.2.84] - 2024-08-20

### Fixed
- Improve CTA badge appearance when there is no title

### Improved

- base plugin now remembers pointer to resourceConfig, so in any plugin you can access it via `this.resourceConfig`
- plugins now support orderedActivation so you can control the order of plugin activation by setting `activationOrder` in plugin class


## [1.2.83] - 2024-08-19

### Fixed
- Dropdown on lowest form input (create and edit)

## [1.2.82] - 2024-08-19

### Added
- More bindings to the primary color variable

## [1.2.81] - 2024-08-19

### Added
- Support OL / UL lists in `richtext` fields

## [1.2.80] - 2024-08-16

### Fixed

- Make primary color variable and use it for colored links
- Create style variables for announcement badge
- Fix announcement badge appearance when it is not configured

## [1.2.77] - 2024-08-16

### Added

- customization.announcementBadge

## [1.2.76] - 2024-08-15

### Fixed
- Fixed filters selected on the previous page persists on the next page 
 https://github.com/devforth/adminforth/pull/2

## [1.2.75] - 2024-08-13

### Added

- support noRoundings for ResourceListTable, to improve look in inline plugin 

## [1.2.66] - 2024-08-13

### Changed

- Look on the show and edit pages improved

## [1.2.65] - 2024-08-13

### Added
- Plugin custom Vue components can now import types from `@/types` folder. Used "postinstall" ln -fs which is not supported on pure Windows (no wsl).

### Changed
- improved HEAVY_DEBUG logging
- moved "postinstall" hook in plugins to "prepare" to not execute "npm link" when plugin installed as dependency

## [1.2.52] - 2024-08-09

### Fixed

- login error when rootUser is not set

### Changed

- improved default styles to better match flowbite

## [1.2.51] - 2024-08-09

### Fixed
- add config.auth.loginPromptHTML and config.auth.demoCredentials
- error toast was not shown on Show page on delete call

### Changed

- Error tost now light red color for more attention