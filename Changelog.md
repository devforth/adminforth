# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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


## [1.3.1] - 2024-09-14

### Added

- Data API using admin.resource(xxx).get/list/create/update/delete

### Improved
- Use fuse search to suggest developers right names in case of typos e.g. when user specified non-existing resourceId

### Breaking changes

- Removed `rootUser` from everywhere, now dataApi is used to create the first user. 
Now you need to create a first user via dataApi,:

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