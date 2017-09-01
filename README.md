# Release Notes Hub

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

[ReleaseNotesHubDevEnv]: https://github.com/release-notes/release-notes-hub-dev-env
