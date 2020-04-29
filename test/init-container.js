const expect = require('chai').expect;
module.exports = () => {
	let container = require('../').create();
	expect(container).to.contain.all.keys(['has', 'get', 'getAll', 'getByTag', 'load', 'register', 'override', 'unregister', 'clear']);
	expect(Object.keys(container).length).to.eql(9);
	expect(container.getAll()).to.have.property('container');
	expect(Object.keys(container.getAll()).length).to.eql(1);

	return container;
}
