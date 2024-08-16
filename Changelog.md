# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [1.2.77] - 2024-08-16

## Added

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