module.exports = function(serviceManager, ReleaseNotesLoader) {
  const releaseNotesLoader = new ReleaseNotesLoader();
  const releaseNotesRepository = serviceManager.get('releaseNotesRepository');
  const accountRepository = serviceManager.get('accountRepository');
  const notificationService = serviceManager.get('releaseNotesNotificationService');
  const updateService = serviceManager.get('releaseNotesUpdateService');

  async function POST(req, res, next) {
    const accountId = req.auth.accountId;
    const { name, file } = req.body;
    const scope = req.body.scope.replace('@', '');

    const [account, persistedReleaseNotes] = await Promise.all([
      accountRepository.findById(accountId),
      releaseNotesRepository.findOneByScopeAndName(scope, name),
    ]);

    if (!account.username) {
      return res.status(409).json({
        code: 'MISSING_USER_NAME',
        message: 'You need to claim a username for your account in order to publish release notes.',
      });
    }

    if (scope.toLowerCase() !== account.username.toLowerCase()) {
      return res.status(403).json({
        code: 'ACCESS_DENIED',
        message: 'You do not have access rights to publish to this scope.',
        details: {
          scopeToPublish: scope,
          accessibleScopes: [account.username],
        }
      });
    }

    releaseNotesLoader.loadReleaseNotes(file.buffer, async (err, releaseNotesUpdate) => {
      if (err) {
        return res.status(400).json({
          code: 'INVALID_RELEASE_NOTES',
          message: 'The uploaded release notes file could not be parsed.',
          details: err.validationErrors,
        });
      }

      const releaseNotesData = releaseNotesUpdate.toJSON();
      releaseNotesData.ownerAccountId = accountId;
      releaseNotesData.scope = scope;
      releaseNotesData.name = name;

      let updatedReleaseNotes;

      try {
        if (persistedReleaseNotes) {
          notificationService.sendReleaseNotesUpdateNotification(persistedReleaseNotes, releaseNotesUpdate);

          updatedReleaseNotes = await updateService.applyUpdate(
            persistedReleaseNotes,
            releaseNotesUpdate
          );
        } else {
          const latestRelease = updateService.calculateLastRelease(releaseNotesData);
          releaseNotesData.latestVersion = latestRelease.version || '';
          releaseNotesData.latestReleaseDate = latestRelease.date || '';
          updatedReleaseNotes = await releaseNotesRepository.create(releaseNotesData);
          res.status(201);
        }

        res.json({
          name: updatedReleaseNotes.name,
          scope: updatedReleaseNotes.scope,
          latestVersion: updatedReleaseNotes.latestVersion,
          latestReleaseDate: updatedReleaseNotes.latestReleaseDate,
          createdAt: updatedReleaseNotes.createdAt,
          updatedAt: updatedReleaseNotes.updatedAt,
        });
      } catch (err) {
        next(err);
      }
    });
  }

  POST.apiDoc = {
    summary: 'Publish a new release notes revision.',
    description: `Publish the uploaded release notes file to \`@scope/name\``,
    tags: ['General'],
    security: [
      { Bearer: ['scope:write', 'release-notes:write'] },
    ],
    consumes: ['multipart/form-data'],
    parameters: [{
      in: 'formData',
      name: 'file',
      type: 'file',
      required: true,
      description: 'The release notes file to publish. Supported extensions are .yml and .yaml',
    }, {
      $ref: '#/parameters/formDataScope'
    }, {
      $ref: '#/parameters/formDataReleaseNotesName'
    }],
    responses: {
      200: {
        description: 'The release notes have been published successfully.',
        schema: {
          $ref: '#/definitions/ReleaseNotesPublishResponse'
        }
      },
      400: {
        description: 'The release notes couldn\'t be published due to invalid parameters.',
        schema: {
          allOf: [{
            $ref: '#/definitions/Error'
          }, {
            example: {
              code: 'INVALID_RELEASE_NOTES',
              message: 'The uploaded release notes file could not be parsed.',
              details: [
                {
                  keyword: 'format',
                  dataPath: '.releases[1].date',
                  schemaPath: '#/properties/date/oneOf/0/format',
                  params: {
                    format:'date'
                  },
                  message: 'should match format "date"',
                },
                {
                  keyword: 'format',
                  dataPath: '.releases[1].date',
                  schemaPath: '#/properties/date/oneOf/1/format',
                  params: {
                    format: 'date-time'
                  },
                  message: 'should match format "date-time"'
                },
                {
                  keyword: 'oneOf',
                  dataPath: '.releases[1].date',
                  schemaPath: '#/properties/date/oneOf',
                  params: {},
                  message: 'should match exactly one schema in oneOf'
                }
              ]
            }
          }]
        },
      },
      403: {
        description: 'The release notes couldn\'t be published due to missing access rights.',
        schema: {
          allOf: [{
            $ref: '#/definitions/Error'
          }, {
            example: {
              code: 'ACCESS_DENIED',
              message: 'You do not have access rights to publish to this scope.',
              details: {
                scopeToPublish: 'release-notes',
                accessibleScopes: ['other-org'],
              }
            }
          }]
        },
      },
      409: {
        description: 'The release notes couldn\'t be published due to a resource conflict.',
        schema: {
          allOf: [{
            $ref: '#/definitions/Error'
          }, {
            example: {
              code: 'MISSING_USER_NAME',
              message: 'You need to claim a username for your account in order to publish release notes.',
            }
          }]
        },
      }
    }
  };

  return {
    POST,
  };
};
