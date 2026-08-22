# Changelog

## [0.2.0](https://github.com/dmitri91/ai-for-developers-project-386/compare/ai-for-developers-project-386-v0.1.0...ai-for-developers-project-386-v0.2.0) (2026-08-22)


### Features

* **backend:** in-memory API per contract ([3f818a9](https://github.com/dmitri91/ai-for-developers-project-386/commit/3f818a91b7837ad9dca9e40db3daec9d67daeec1))
* **contract:** TypeSpec API contract for calendar booking ([96ec998](https://github.com/dmitri91/ai-for-developers-project-386/commit/96ec998333188281faf56ad8c5f27905bf3762a2))
* **deploy:** Docker-образ в продакшен ([593d76f](https://github.com/dmitri91/ai-for-developers-project-386/commit/593d76fb433a5bd384052add88dcf547ec9f02e3))
* **front:** calendar booking SPA ([84d1566](https://github.com/dmitri91/ai-for-developers-project-386/commit/84d1566d7c8d2984b6dd3ef7cd27ebc5c70c464d))


### Bug Fixes

* **backend:** health-check endpoint /ping для Render ([03479ab](https://github.com/dmitri91/ai-for-developers-project-386/commit/03479ab0872981889038bd7a7cd187fcc1bf7e94))
* **backend:** validate 14-day booking window, handle invalid JSON, isolate API routes ([910636b](https://github.com/dmitri91/ai-for-developers-project-386/commit/910636be42113cf05086c049b3bd5b2e1257778c))
* **ci:** replace internal registry urls with public npmjs in lockfiles ([2ea21fd](https://github.com/dmitri91/ai-for-developers-project-386/commit/2ea21fdd08563da938f0d77664b6a0b0fb7e3d9f))
* **front:** pin compatible typescript 5.8 for npm ci ([762efe5](https://github.com/dmitri91/ai-for-developers-project-386/commit/762efe560215e98bbdcb7a15983071566ab28faa))
* **front:** показывать время слотов в UTC ([95e62fc](https://github.com/dmitri91/ai-for-developers-project-386/commit/95e62fc775f71f13707f8772549d01428541dd8e))


### Documentation

* project agent instructions and tooling config ([78e560b](https://github.com/dmitri91/ai-for-developers-project-386/commit/78e560b16190cf85d14c4bc253f7ea35ab43b119))
* ссылка на прод-приложение в Render ([c7648f1](https://github.com/dmitri91/ai-for-developers-project-386/commit/c7648f1d51a093c7b06c85743db0bcc556739375))


### Tests

* **backend:** isolate static fallback test with temporary fixture ([44b2574](https://github.com/dmitri91/ai-for-developers-project-386/commit/44b257439f1838a8ee5283f069b46ef69e637cff))
* **e2e:** add api boundary tests and run backend tests in ci ([f27ba42](https://github.com/dmitri91/ai-for-developers-project-386/commit/f27ba4237deeb344f62ee1664117d9880437bc6e))
* **e2e:** Playwright integration scenarios ([0ac4e82](https://github.com/dmitri91/ai-for-developers-project-386/commit/0ac4e8283dc45188b38c79369f1d78ded7008ded))


### CI

* run e2e tests and automate releases via release-please ([17a6f3a](https://github.com/dmitri91/ai-for-developers-project-386/commit/17a6f3a2526665ad850514ad518a40d196de8b29))
