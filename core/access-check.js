module.exports = {
  /**
   * Check if the given user is allowed to publish release notes to a team.
   *
   * @param team
   * @param user
   * @return {boolean}
   */
  userHasPublishRights({ team, user }) {
    if (!team || !user) return false;

    const membership = team.members.find((member) => member.accountId === user._id.toString());

    return membership && membership.role === 'owner';
  }
};
