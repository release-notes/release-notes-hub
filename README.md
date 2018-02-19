# Release Notes Hub

[![Subscribe to Release Notes](https://release-notes.com/badges/v1.svg)](https://release-notes.com/@release-notes/release-notes-hub)

## Installation

The recommended way of hacking the release notes hub is by using the
docker compose based [dev env][ReleaseNotesHubDevEnv].
Run the dev env installation and setup steps.

This will launch the hub on localhost:8080.

## Environment Variables

The app is aware of the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | The http port the express server will listen to. | 8080 |
| MONGODB_HOST | Hostname of the mongodb backend | 'release-notes-mongo' |
| MONGODB_PORT | Port of the mongodb backend | 27017 |
| MONGODB_USER | Mongodb user | _empty_ |
| MONGODB_PASSWORD | Passoword of the mongodb user | _empty_ |
| MONGODB_DATABASE | The db to use | 'release-notes' |
| SPARK_POST_API_KEY | Api key for sending transactional email | _empty_ |
| EMAIL_DEFAULT_REPLY_TO | Default reply-to email address | 'Release Notes <hello@release-notes.com>' |
| GITHUB_CLIENT_ID | The github client id | _empty_ |
| GITHUB_CLIENT_SECRET | The github client secret | _empty_ |
| GOOGLE_CLIENT_ID | The google client id | _empty_ |
| GOOGLE_CLIENT_SECRET | The google client secret | _empty_ |
| PIWIK_ENABLED | Whether piwik tracking is enabled | true |
| PIWIK_SITE_ID | The related piwik site id | 1 |

[ReleaseNotesHubDevEnv]: https://github.com/release-notes/release-notes-hub-dev-env

---

### LICENSE

The files in this archive are released under MIT license.
You can find a copy of this license in [LICENSE](LICENSE).
