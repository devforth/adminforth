# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.20] - next

## [1.0.14]

### Fixed

- Add `ignoreInitial` for watch to prevent initial messages loading
- Add locking mechanism to prevent initial messages loading call in parallel (just in case)

## [1.0.13]

- Deduplicate frontend strings before creating translations 


## [1.0.12]

### Fixed

- live mode frontend translations loading when tmp dir is nopt preserver  (e.g. docker cached /tmp pipeline)

## [1.0.11]

### Fixed

- cache invalidations on delete

## [v1.0.10]

### Fixed

- fix automatic translations for duplicate strings
- improve slavik pluralization generations by splitting the requests