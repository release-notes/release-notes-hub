'use strict';

const Service = require('kermit/Service');

class UpdateService extends Service {
  calculateUpdates(releaseNotesModel, newReleaseNotes) {
    let latestRelease = null;

    if (releaseNotesModel.latestVersion) {
      latestRelease = this.findReleaseByVersion(releaseNotesModel, releaseNotesModel.latestVersion);
    }

    if (!latestRelease) {
      latestRelease = this.calculateLastRelease(releaseNotesModel);
    }

    return this.calculateNewReleases(latestRelease, newReleaseNotes);
  }

  applyUpdate(releaseNotesModel, newReleaseNotes, callback) {
    const latestRelease = this.calculateLastRelease(newReleaseNotes);
    const releaseNotesUpdate = {
      title: newReleaseNotes.title,
      description: newReleaseNotes.description,
      releases: newReleaseNotes.releases,
      latestVersion: latestRelease.version || '',
      latestReleaseDate: latestRelease.date || ''
    };

    this.serviceManager.get('releaseNotesRepository').findByIdAndUpdate(
      releaseNotesModel._id,
      { $set: releaseNotesUpdate},
      callback
    );
  }

  static isUnreleased(release) {
    return ['next', 'upcoming', 'unreleased'].indexOf((release.version || '').toLowerCase()) !== -1;
  }

  calculateNewReleases(lastRelease, releaseNotes) {
    return (releaseNotes.releases || [])
      .filter(release => (
        !UpdateService.isUnreleased(release)
        && (!lastRelease || lastRelease.date < new Date(release.date))
      )
    );
  }

  calculateLastRelease(releaseNotes) {
    let latestVersion = null;
    let latestReleaseDate = null;
    let latestRelease = null;

    (releaseNotes.releases || []).forEach((release) => {
      const version = release.version;
      const releaseDate = release.date;
      const isUnreleased = UpdateService.isUnreleased(release);

      if (!isUnreleased && (!latestVersion || latestReleaseDate < releaseDate)) {
        latestVersion = version;
        latestReleaseDate = releaseDate;
        latestRelease = release;
      }
    });

    return latestRelease;
  }

  findReleaseByVersion(releaseNotes, version) {
    return (releaseNotes.releases || []).find(release => release.version === version);
  }
}

module.exports = UpdateService;
