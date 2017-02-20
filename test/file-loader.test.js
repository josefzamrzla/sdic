const expect = require('chai').expect;
describe('Module loader', () => {
	let container;
	beforeEach(() => {
		container = require('./init-container')();
	});

	describe('Common loader', () => {
		it('should throw on non-existent file or folder', () => {
			expect(() => container.load('./non-existent')).to.throw(Error, /Unable to load file/)
		});
	});

	describe('Folders loader', () => {
		it('should respect disable recursive loading', () => {
			container.load('./services', {recursive: false});
			container.load('./lib', {recursive: false});

			expect(container.getAll()).to.contain.all.keys(['commonServices', 'requestValidatorLib']);
			expect(Object.keys(container.getAll()).length).to.eql(3); // 2 + container itself
		});

		it('should respect files filter', () => {
			container.load('./services', {filter: 'roles'});
			container.load('./lib', {filter: 'roles'});
			
			expect(container.getAll()).to.contain.all.keys(['rolesUserServices']);
			expect(Object.keys(container.getAll()).length).to.eql(2); // 1 + container itself
		});

		it('should respect ignore patterns', () => {
			container.load('./services', {ignore: [/oles\.js$/, 'mmon']}); // skips user/roles.js and common.js
			container.load('./lib', {ignore: ['rol', /^foobar/]}); // skips nothing
			
			expect(container.getAll()).to.contain.all.keys(['requestValidatorLib']);
			expect(Object.keys(container.getAll()).length).to.eql(2); // 1 + container itself
		});
	});
});