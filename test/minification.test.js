const expect = require('chai').expect;
describe('Minification', () => {
	let container;
	beforeEach(() => {
		container = require('./init-container')();
	});

	it('should be able load dependencies for minified ES6 module', () => {
		container.load('./minification/barService');
		container.load('./minification/fooService');
		container.load('./minification/es6module');

		let es6module = container.get('es6module');
		expect(es6module.method()).to.equal('foobar');
	});

  it('should be able load dependencies for minified commonJs module', () => {
		container.load('./minification/barService');
		container.load('./minification/fooService');
		container.load('./minification/commonJs');

		let commonJs = container.get('commonJs');
		expect(commonJs.method()).to.equal('foobar');
	});

  it('should be able load dependencies for namely exported classes', () => {
		container.load('./minification/barService');
		container.load('./minification/fooService');
		container.load('./minification/classModule');

		let classService1 = container.get('ClassService1');
		expect(classService1.method()).to.equal('foobar');
    let classService2 = container.get('ClassService2');
		expect(classService2.method()).to.equal('foobar');
	});


});
