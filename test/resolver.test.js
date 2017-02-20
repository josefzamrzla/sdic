const expect = require('chai').expect;
describe('Resolver', () => {
	let container;
	beforeEach(() => {
		container = require('./init-container')();
	});

	it('should be able to resolve module dependencies', () => {
		container.load('./resolve/repository');
		container.load('./resolve/service', {alias: null, postfix: 'service', reverseName: true});
		container.load('./resolve/config');

		let userService = container.get('userService');
		expect(userService.getAll()).to.deep.equal({
			version: 1,
			userIds: ['user-1', 'user-2', 'user-3'],
			roles: ['role 1', 'role 2']
		});
	});

	it('should throw on non-existent dependency', () => {
		container.load('./resolve/service', {alias: null, postfix: 'service', reverseName: true});
		expect(() => container.get('loggingService')).to.throw(Error, /Dependency does not exist: nonexistentDependency \(loggingService > validationService > nonexistentDependency\)/);
	});

	it('should be able to return resolved modules groupped by tag', () => {
		container.load('./resolve/repository', {tags: ['repo', 'repository']});
		container.load('./resolve/service', {alias: null, postfix: 'service', reverseName: true, tags: ['services'], ignore: ['logging', 'validation']});
		container.load('./resolve/config', {tags: ['config']});
		container.register('additionalConfig', {foo: 'bar'}, {tags: ['config']});

		expect(container.getByTag('repo')).to.contain.all.keys(['usersRepository']);
		expect(Object.keys(container.getByTag('repo')).length).to.equal(1);

		expect(container.getByTag('services')).to.contain.all.keys(['userRoleService', 'userService']);
		expect(Object.keys(container.getByTag('services')).length).to.equal(2);

		expect(container.getByTag('config')).to.contain.all.keys(['config', 'additionalConfig']);
		expect(Object.keys(container.getByTag('config')).length).to.equal(2);
	});

	it('should be able to "in-line" override a dependency', () => {
		container.load('./resolve/repository');
		container.load('./resolve/service', {alias: null, postfix: 'service', reverseName: true});
		container.load('./resolve/config');
		
		let overridenConfig = {app: {version: 2}, users: {idPrefix: 'foo-'}};
		let overridenService = {
			getAllRoles: () => {
				return ['role 3', 'role 4'];
			}
		};

		let userService = container.get('userService', {config: overridenConfig, userRoleService: overridenService});
		expect(userService.getAll()).to.deep.equal({
			version: 2,
			userIds: ['foo-1', 'foo-2', 'foo-3'],
			roles: ['role 3', 'role 4']
		});

		// check that original config is still there
		userService = container.get('userService');
		expect(userService.getAll()).to.deep.equal({
			version: 1,
			userIds: ['user-1', 'user-2', 'user-3'],
			roles: ['role 1', 'role 2']
		});
	});

	it('should throw when creating instance failed', () => {
		container.load('./failing/failing-service');
		container.load('./resolve/config');
		
		expect(() => container.get('failingService')).to.throw(Error, /Cannot create an instance of: failingService\./);
		
	});

	it('should be able to resolve primitives', () => {
        container.register('aTrue', true);
        container.register('aFalse', false);
        container.register('aNull', null);
        container.register('aNumber', 123);
        container.register('aString', 'foobar');

		container.register('module', (aTrue, aFalse, aNull, aNumber, aString) => {
			return {aTrue, aFalse, aNull, aNumber, aString}
		});

		expect(container.get('module')).to.deep.equal({
			aTrue: true, aFalse: false, aNull: null, aNumber: 123, aString: 'foobar'
		});
	});
});