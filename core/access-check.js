module.exports = {
  /**
   * Check if the given user is allowed to publish release notes to an organization.
   *
   * @param organization
   * @param user
   * @return {boolean}
   */
  userHasPublishRights({ organization, user }) {
    if (!organization || !user) return false;

    const membership = organization.members.find((member) => member.accountId === user._id.toString());

    return membership && membership.role === 'owner';
  }
};
