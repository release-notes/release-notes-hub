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

    return this.calculateNewReleases(newReleaseNotes, latestRelease);
  }

  applyUpdate(releaseNotesModel, newReleaseNotes) {
    const latestRelease = this.calculateLastRelease(newReleaseNotes);
    const releaseNotesUpdate = {
      title: newReleaseNotes.title,
      description: newReleaseNotes.description,
      releases: newReleaseNotes.releases,
      latestVersion: latestRelease.version || '',
      latestReleaseDate: latestRelease.date || ''
    };

    return this.serviceManager.get('releaseNotesRepository').findByIdAndUpdate(
      releaseNotesModel._id,
      { $set: releaseNotesUpdate}
    );
  }

  static isUnreleased(release) {
    return ['next', 'upcoming', 'unreleased'].indexOf((release.version || '').toLowerCase()) !== -1;
  }

  calculateNewReleases(releaseNotes, lastRelease) {
    const releases = [];

    for (const release of (releaseNotes.releases || [])) {
      if (lastRelease && release.version === lastRelease.version) {
        break;
      }

      if (UpdateService.isUnreleased(release)) {
        continue;
      }

      releases.push(release);
    }

    return releases;
  }

  calculateLastRelease(releaseNotes) {
    for (const release of (releaseNotes.releases || [])) {
      if (UpdateService.isUnreleased(release)) {
        continue;
      }

      return release;
    }
  }

  findReleaseByVersion(releaseNotes, version) {
    return (releaseNotes.releases || []).find(release => release.version === version);
  }
}

module.exports = UpdateService;
