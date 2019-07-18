import chai from 'chai'; // eslint-disable-line

chai.config.includeStack = true;
chai.config.showDiff = true;

global.assert = chai.assert;
global.expect = chai.expect;
