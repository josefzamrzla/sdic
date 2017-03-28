const expect = require('chai').expect;
describe('Registrator', () => {
	let container;
	beforeEach(() => {
		container = require('./init-container')();
	});

	it('should be able to unregister module', () => {
		container.register('app', () => {});
		expect(container.getAll()).to.contain.all.keys(['app']);
		expect(Object.keys(container.getAll()).length).to.eql(2); // 1 + container itself

		container.unregister('app');
		expect(Object.keys(container.getAll()).length).to.eql(1); // only container itself

		expect(() => container.get('app')).to.throw(Error, /Module does not exist: app/)
	});

	it('should be able to flush all registered modules', () => {
		container.register('app', () => {});
		container.register('aService', () => {});

		expect(container.getAll()).to.contain.all.keys(['app', 'aService']);
		expect(Object.keys(container.getAll()).length).to.eql(3); // 2 + container itself

		container.clear();

		expect(Object.keys(container.getAll()).length).to.eql(1); // only container itself
		expect(() => container.get('app')).to.throw(Error, /Module does not exist: app/)
		expect(() => container.get('aService')).to.throw(Error, /Module does not exist: aService/)
	});

	it('should refuse registering empty (undefined) module', () => {
		expect(() => container.register('app')).to.throw(Error, /Unable to register empty \(undefined\) module/)
	});
	
	it('should refuse to register module multiple times', () => {
		container.register('app', () => {});
		expect(() => container.register('app', () => {})).to.throw(Error, /Module is already registered: app/)
	});

	it('should be able to override registered function module', () => {
		let original = () => {return 'original'}, overriden = () => {return 'overriden'};
		container.register('fnModule', original);
		expect(container.get('fnModule')).to.equal('original');
		container.override('fnModule', overriden);
		expect(container.get('fnModule')).to.not.equal('original');
		expect(container.get('fnModule')).to.equal('overriden');
	});

	it('should be able to override registered JSON module', () => {
		let original = {original: true}, overriden = {overriden: true};
		container.register('jsonModule', original);
		expect(container.get('jsonModule')).to.deep.equal({original: true});
		container.override('jsonModule', overriden);
		expect(container.get('jsonModule')).to.not.deep.equal({original: true});
		expect(container.get('jsonModule')).to.deep.equal({overriden: true});
	});

	describe('should be able to handle circular dependencies', () => {
		it('when resolving cache flag', () => {
			container.load('./circular', {alias: null});
			expect(() => container.get('moduleA')).to.throw(Error, /Circular dependency: moduleA > moduleB > moduleC > moduleA/);
			expect(() => container.get('moduleB')).to.throw(Error, /Circular dependency: moduleB > moduleC > moduleA > moduleB/);
		});

		it('when creating module instance', () => {
			container.load('./circular', {alias: null, cache: false});
			expect(() => container.get('moduleA')).to.throw(Error, /Circular dependency: moduleA > moduleB > moduleC > moduleA/);
			expect(() => container.get('moduleB')).to.throw(Error, /Circular dependency: moduleB > moduleC > moduleA > moduleB/);
		})
	});

	describe('should respect cache option', () => {
		it('cache is enabled by default (cache: null or undefined)', () => {
			
			container.register('cacheA', () => {return {}}, {cache: null});
			container.register('cacheB', {foo: 'bar'});

			let cacheA = container.get('cacheA');
			cacheA.param = 'foo';
			container.get('cacheA');
			expect(container.get('cacheA').param).to.equal('foo');

			let cacheB = container.get('cacheB');
			cacheB.modyfied = true;
			container.get('cacheB');
			expect(container.get('cacheB')).to.deep.equal({foo: 'bar', modyfied: true});
		});

		it('cache is manually enabled by cache option', () => {
			container.register('cacheA', () => {return {}}, {cache: true});
			container.register('cacheB', {foo: 'bar'}, {cache: true});
			
			let cacheA = container.get('cacheA');
			cacheA.param = 'foo';
			container.get('cacheA');
			expect(container.get('cacheA').param).to.equal('foo');

			let cacheB = container.get('cacheB');
			cacheB.modyfied = true;
			container.get('cacheB');
			expect(container.get('cacheB')).to.deep.equal({foo: 'bar', modyfied: true});
		});

		it('cache is manually disabled by cache option', () => {
			container.register('cacheA', () => {return {}}, {cache: false});
			container.register('cacheB', {foo: 'bar'}, {cache: false});
			
			let cacheA = container.get('cacheA');
			cacheA.param = 'foo';
			container.get('cacheA');
			expect(container.get('cacheA').param).to.equal(undefined);

			let cacheB = container.get('cacheB');
			cacheB.modyfied = true;
			expect(container.get('cacheB')).to.deep.equal({foo: 'bar'});
		});
	});

	it('should be able to register a function module', () => {
		container.register('module', () => {return {method: () => 'return value'}});
		expect(container.get('module').method()).to.equal('return value');
	});

	it('should be able to register a JSON module', () => {
		container.register('module', {my: {nested: 'json'}});
		expect(container.get('module')).to.deep.equal({my: {nested: 'json'}});
	});

	it('should be able to register a primitive', () => {
		container.register('aTrue', true);
		container.register('aFalse', false);
		container.register('aNull', null);
		container.register('aNumber', 123);
		container.register('aString', 'foobar');

		expect(container.get('aTrue')).to.equal(true);
		expect(container.get('aTrue')).to.not.equal('true');
		expect(container.get('aFalse')).to.equal(false);
		expect(container.get('aFalse')).to.not.equal('false');
        expect(container.get('aNull')).to.equal(null);
        expect(container.get('aNull')).to.not.equal('null');
		expect(container.get('aNumber')).to.equal(123);
		expect(container.get('aNumber')).to.not.equal('123');
		expect(container.get('aString')).to.equal('foobar');
	});

	describe('should be able to register es6 modules', () => {
        it('export default without dependencies', () => {
            container.load('./export-default/dummy-service');
            expect(container.getAll()).to.contain.all.keys(['dummyService']);
            expect(Object.keys(container.getAll()).length).to.eql(2); // 1 + container itself
            expect(container.get('dummyService').method()).to.equal(true);
        });

        it('export default with dependencies', () => {
        	container.register('fooService', () => ({method: () => ({passed: true})}));
            container.load('./export-default/service-with-params');
            expect(container.getAll()).to.contain.all.keys(['serviceWithParams', 'fooService']);
            expect(Object.keys(container.getAll()).length).to.eql(3); // 2 + container itself
			expect(container.get('serviceWithParams').method()).to.deep.equal({passed: true});
        });

        it('named exports', () => {
            container.register('fooService', () => ({method: () => ({passed: true})}));
            container.load('./named-exports', {alias: null});

            expect(container.getAll()).to.contain.all.keys(['firstFunctionalService', 'secondFunctionalService', 'classService', 'services']);
            expect(Object.keys(container.getAll()).length).to.eql(6); // 5 + container itself
            expect(container.get('firstFunctionalService').method()).to.deep.equal({passed: true});
            expect(container.get('secondFunctionalService').method()).to.deep.equal({passed: true});
            expect(container.get('classService').method()).to.deep.equal({passed: true});
            expect(container.get('services').method()).to.deep.equal({passed: true}); // default export
		});

        it('named exports respects opts rules (prefix, postfix, alias)', () => {
            container.register('fooService', () => ({method: () => ({passed: true})}));
            container.load('./named-exports', {prefix: 'pre', postfix: 'post'}); // alias == basedir

            expect(container.getAll()).to.contain.all.keys([
            	'preFirstFunctionalServiceNamedExportsPost',
            	'preSecondFunctionalServiceNamedExportsPost',
            	'preClassServiceNamedExportsPost',
            	'preServicesNamedExportsPost']);
            expect(Object.keys(container.getAll()).length).to.eql(6); // 5 + container itself
            expect(container.get('preFirstFunctionalServiceNamedExportsPost').method()).to.deep.equal({passed: true});
            expect(container.get('preSecondFunctionalServiceNamedExportsPost').method()).to.deep.equal({passed: true});
            expect(container.get('preClassServiceNamedExportsPost').method()).to.deep.equal({passed: true});
            expect(container.get('preServicesNamedExportsPost').method()).to.deep.equal({passed: true}); // default export
        });
	});
});