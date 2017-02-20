module.exports = (config, usersRepository, userRoleService) => {
	return {
		getAll: () => {
			return {
				version: config.app.version,
				userIds: usersRepository.getIds(),
				roles: userRoleService.getAllRoles()
			};
		}
	};
};