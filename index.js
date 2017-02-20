const path = require('path');
module.exports = {
	create: require('./container')(path.dirname(module.parent.filename))
};
