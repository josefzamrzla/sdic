const expect = require('chai').expect;
describe('Module name generator', () => {
	let container;
	beforeEach(() => {
		container = require('./init-container')();
	});

	describe('Prefix/postfix validations', () => {
		it('should throw on invalid prefix', () => {
			let bads = [
				() => container.load('./config', {prefix: true}),
				() => container.load('./config', {prefix: false}),
				() => container.load('./config', {prefix: null}),
				() => container.load('./config', {prefix: undefined}),
				() => container.load('./config', {prefix: 123}),
				() => container.load('./config', {prefix: {foo: 'bar'}}),
				() => container.load('./config', {prefix: ['foo']}),
				() => container.load('./config', {prefix: ''}),
				() => container.load('./config', {prefix: '  '}),
				() => container.load('./config', {prefix: ' foo '}),
				() => container.load('./config', {prefix: 'f o o'}),
				() => container.load('./config', {prefix: '123'}),
				() => container.load('./config', {prefix: '/foo'}),
				() => container.load('./config', {prefix: 'f-o-o'}),
			];

			bads.map(fn => expect(fn, fn).to.throw(Error, /Invalid prefix/));
			
			expect(container.getAll()).to.contain.all.keys(['container']);
			expect(Object.keys(container.getAll()).length).to.eql(1);
		});	

		it('should throw on invalid postfix', () => {
			let bads = [
				() => container.load('./config', {postfix: true}),
				() => container.load('./config', {postfix: false}),
				() => container.load('./config', {postfix: null}),
				() => container.load('./config', {postfix: undefined}),
				() => container.load('./config', {postfix: {foo: 'bar'}}),
				() => container.load('./config', {postfix: ['foo']}),
				() => container.load('./config', {postfix: ''}),
				() => container.load('./config', {postfix: '  '}),
				() => container.load('./config', {postfix: ' foo '}),
				() => container.load('./config', {postfix: 'f o o'}),
				() => container.load('./config', {postfix: '/foo'}),
				() => container.load('./config', {postfix: 'f-o-o'}),
			];

			bads.map(fn => expect(fn, fn).to.throw(Error, /Invalid postfix/));
			
			expect(container.getAll()).to.contain.all.keys(['container']);
			expect(Object.keys(container.getAll()).length).to.eql(1);
		});	
	});

	describe('Single files generator', () => {
		it('should generate correct default names', () => {
			container.load('./config');
			container.load('./lib/request-validator');
			container.load('./services/user/roles');
			container.load('./services/common');

			expect(container.getAll()).to.contain.all.keys(['config', 'requestValidator', 'roles', 'common']);
		});

		// only an 'alias' option makes sense for single files
		it('should respect valid alias', () => {
			container.load('./config', {alias: 'myConfig'});
			container.load('./lib/request-validator', {alias: '$validator'});
			container.load('./services/user/roles', {alias: 'user_roles_Service'});
			container.load('./services/common', {alias: '_123Service'});

			expect(container.getAll()).to.contain.all.keys(['myConfig', '$validator', 'user_roles_Service', '_123Service']);
			expect(Object.keys(container.getAll()).length).to.eql(5); // 4 + container itself
		});

		it('should throw on invalid alias', () => {
			let bads = [
				() => container.load('./config', {alias: true}),
				() => container.load('./config', {alias: false}),
				() => container.load('./config', {alias: null}),
				() => container.load('./config', {alias: undefined}),
				() => container.load('./config', {alias: 123}),
				() => container.load('./config', {alias: {foo: 'bar'}}),
				() => container.load('./config', {alias: ['foo']}),
				() => container.load('./config', {alias: ''}),
				() => container.load('./config', {alias: '  '}),
				() => container.load('./config', {alias: ' foo '}),
				() => container.load('./config', {alias: 'f o o'}),
				() => container.load('./config', {alias: '123'}),
				() => container.load('./config', {alias: '/foo'}),
				() => container.load('./config', {alias: 'f-o-o'}),
			];

			bads.map(fn => expect(fn, fn).to.throw(Error, /Invalid alias/));
			
			expect(container.getAll()).to.contain.all.keys(['container']);
			expect(Object.keys(container.getAll()).length).to.eql(1);
		});

		it('should be able to deduplicate name', () => {
			container.load('./deduplicate/services', {deduplicate: true});
			expect(container.getAll()).to.contain.all.keys(['userServices']);
			expect(Object.keys(container.getAll()).length).to.eql(2); // 1 + container itself
		});
	});

	describe('Folders generator', () => {
		it('should generate correct default names', () => {
			container.load('./lib');
			container.load('./services/');

			expect(container.getAll()).to.contain.all.keys(['rolesUserServices', 'commonServices', 'requestValidatorLib']);
			expect(Object.keys(container.getAll()).length).to.eql(4); // 3 + container itself
		});

		it('should throw on invalid alias', () => {
			let bads = [
				() => container.load('./services', {alias: true}),
				() => container.load('./services', {alias: 123}),
				() => container.load('./services', {alias: {foo: 'bar'}}),
				() => container.load('./services', {alias: ['foo']}),
				() => container.load('./services', {alias: '  '}),
				() => container.load('./services', {alias: ' foo '}),
				() => container.load('./services', {alias: 'f o o'}),
				() => container.load('./services', {alias: '123'}),
				() => container.load('./services', {alias: '/foo'}),
			];

			bads.map(fn => expect(fn, fn).to.throw(Error, /Invalid alias/));
			
			expect(container.getAll()).to.contain.all.keys(['container']);
			expect(Object.keys(container.getAll()).length).to.eql(1);
		});	

		it('should generate correct names with basedir aliases', () => {
			container.load('./lib', {alias: 'my-lib'});
			container.load('./services/', {alias: 'MyServices'});
			container.load('./services/user', {alias: 'userService'});

			expect(container.getAll()).to.contain.all.keys(['rolesUserMyServices', 'commonMyServices', 'requestValidatorMyLib', 'rolesUserService']);
			expect(Object.keys(container.getAll()).length).to.eql(5); // 4 + container itself
		});

		it('should generate correct names with basedir aliases and uppercased first letter', () => {
			container.load('./lib', {alias: 'my-lib', uppercaseFirst: true});
			container.load('./services/', {alias: 'MyServices', uppercaseFirst: true});
			container.load('./services/user', {alias: 'userService', uppercaseFirst: true});

			expect(container.getAll()).to.contain.all.keys(['RolesUserMyServices', 'CommonMyServices', 'RequestValidatorMyLib', 'RolesUserService']);
			expect(Object.keys(container.getAll()).length).to.eql(5); // 4 + container itself
		});

		it('should generate correct default names with reverseName option', () => {
			container.load('./lib', {reverseName: true});
			container.load('./services/', {reverseName: true});

			expect(container.getAll()).to.contain.all.keys(['servicesUserRoles', 'servicesCommon', 'libRequestValidator']);
			expect(Object.keys(container.getAll()).length).to.eql(4); // 3 + container itself
		});

		it('should generate correct default names with reverseName option and uppercased first letter for services', () => {
			container.load('./lib', {reverseName: true});
			container.load('./services/', {reverseName: true, uppercaseFirst: true});

			expect(container.getAll()).to.contain.all.keys(['ServicesUserRoles', 'ServicesCommon', 'libRequestValidator']);
			expect(Object.keys(container.getAll()).length).to.eql(4); // 3 + container itself
		});

		it('should generate correct names with basedir alias and reverseName option', () => {
			container.load('./services/', {alias: 'service', reverseName: true});
			
			expect(container.getAll()).to.contain.all.keys(['serviceUserRoles', 'serviceCommon']);
			expect(Object.keys(container.getAll()).length).to.eql(3); // 2 + container itself
		});

		// use: alias: null
		it('should generate correct names with postfix and disabled basedir alias', () => {
			container.load('./services', {alias: null, postfix: 'service'});
			
			expect(container.getAll()).to.contain.all.keys(['rolesUserService', 'commonService']);
			expect(Object.keys(container.getAll()).length).to.eql(3); // 2 + container itself
		});

		// use alias: false
		it('should generate correct names with postfix, reverseName option and disabled basedir alias', () => {
			container.load('./services', {alias: false, postfix: 'service', reverseName: true});
			
			expect(container.getAll()).to.contain.all.keys(['userRolesService', 'commonService']);
			expect(Object.keys(container.getAll()).length).to.eql(3); // 2 + container itself
		});

		// use alias: ''
		it('should generate correct names with prefix, postfix, reverseName option and disabled basedir alias', () => {
			container.load('./services', {alias: '', prefix: 'v1', postfix: 'service', reverseName: true});
			
			expect(container.getAll()).to.contain.all.keys(['v1UserRolesService', 'v1CommonService']);
			expect(Object.keys(container.getAll()).length).to.eql(3); // 2 + container itself
		});
	});
})
