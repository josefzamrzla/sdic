module.exports = (config) => {
	return {
		getIds: () => {
			return [1, 2, 3].map(item => config.users.idPrefix + item);
		}
	};
};