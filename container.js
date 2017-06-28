const fs = require('fs');
const _path = require('path');
const _extend = require('lodash.assignin');
const _isEmpty = require('lodash.isempty');
const _isFunction = require('lodash.isfunction');
const _isPlainObject = require('lodash.isplainobject');
const _isString = require('lodash.isstring');
const getParamNames = require('get-parameter-names');
const readDirR = require('fs-readdir-recursive');

const throwError = (err) => {
    if (err instanceof Error) {
        throw err;
    } else {
        throw new Error(err);
    }
};

const ucfirst = (s) => s.charAt(0).toUpperCase() + s.substr(1);

module.exports = (basepath) => {
    let basePathRegexp = new RegExp('^' + basepath);
    let extensions = Object.keys(require('module')._extensions);

    return (allowedExtensions = 'js|json|coffee') => {

        let factories = {};

        let loadDir = (basename, dir, opts = {}) => {
            delete opts.alias; // if alias is used for a folder, do not pass it to loadFile fn, it'd damage module name
            // load files from given path
            let files = (opts.recursive === false) ? fs.readdirSync(dir) : readDirR(dir);

            if (opts.filter) {
                files = files.filter(file => (new RegExp(opts.filter)).test(file));
            }

            for (let i = 0; i < files.length; i++) {
                loadFile(_path.join(dir, files[i]), _path.join(basename, '/', files[i]), opts);
            }
        };

        let createModuleName = (initialName, relPath, opts = {}) => {
            let moduleName = initialName;
            if ('alias' in opts && !(_isString(opts.alias) && /^[a-zA-Z_$]{1}[a-zA-Z0-9_$]+$/.test(opts.alias))) {
                return throwError(`Invalid alias: ${opts.alias}`);
            }

            if (opts.alias) {
                moduleName = opts.alias;
                delete opts.alias;
            } else {
                moduleName = moduleName.replace(/[^a-zA-Z0-9]+(\w)/g, (match, letter) => letter.toUpperCase());
                let dirname = _path.dirname(relPath).replace(/^([\/]+)(.*)/gi, ((_str, _g1, g2) => g2));
                if (dirname.length > 1) { // ignores '.', '/', ...
                    if (opts.reverseName === true) {
                        moduleName = dirname.split('/').join('/').replace(/[^a-zA-Z0-9]+(\w)/g, (match, letter) => letter.toUpperCase()) + ucfirst(moduleName);
                    } else {
                        moduleName = moduleName + ucfirst(dirname.split('/').reverse().join('/').replace(/[^a-zA-Z0-9]+(\w)/g, (match, letter) => letter.toUpperCase()));
                    }
                }

                if (opts.prefix) {
                    moduleName = opts.prefix + ucfirst(moduleName);
                    //delete opts.prefix;
                }

                if (opts.postfix) {
                    moduleName = moduleName + ucfirst(opts.postfix);
                    //delete opts.postfix;
                }
            }

            if (opts.deduplicate === true) {
                moduleName = moduleName.replace(/([A-Z])/g, (match, letter) => "_" + match).split('_').map(part => ucfirst(part))
                    .filter((part, index, arr) => arr.indexOf(part) === index).join('');
            }

            if (opts.uppercaseFirst === true) {
                return moduleName.charAt(0).toUpperCase() + moduleName.substr(1);
            }

            if (opts.es6 === true) {
            	return moduleName;
			}

            return moduleName.charAt(0).toLowerCase() + moduleName.substr(1);
        };

        let loadFile = (file, relPath = '', opts = {}) => {
            if (allowedExtensions && !(allowedExtensions.includes(file.match(/\w+$/)[0]))) return;
            if (Array.isArray(opts.ignore) && opts.ignore.length) {
                if (opts.ignore.find(pattern => (new RegExp(pattern)).test(file.replace(basePathRegexp, ''))) !== undefined) {
                    return;
                }
            }

            let moduleFile = file.replace(/\.\w+$/, '');
            let moduleName = createModuleName(_path.basename(moduleFile), relPath, opts);

            // Register module
            let module = require(moduleFile);
            if (_isPlainObject(module)) {
                let content = fs.readFileSync(file);
                if (!content) {
                    return throwError(`Cannot load file contents: ${moduleFile}`);
                }

                content = content.toString();
                let es6mode = /export (let|const|function|class|default)/m.test(content);
                if (es6mode) {
                    // named ES6 exports
                    Object.keys(module).forEach(key => {
                        container.register(
                            key === 'default' ? moduleName : createModuleName(key, relPath, _extend(opts, {es6: true})),
                            module[key],
                            _extend(opts, {dependencies: resolveArguments(module[key])})
                        );
                    });
                } else {
                    container.register(moduleName, module, opts);
                }

                content = null;
            } else {
                container.register(moduleName, module, opts);
            }
        };

        let resolveArguments = (fn) => {
            // match argument list
            return getParamNames(fn).filter(String).map((v) => v.trim())
        };

        let resolveCacheFlag = (name, visited = []) => {

            // check for circular dependencies
            if (visited.includes(name)) {
                visited.push(name);
                return throwError(`Circular dependency: ${visited.join(' > ')}`);
            }

            visited.push(name);

            // if any of factory's dependencies has cache flag set to false - inherit it
            let factory = factories[name];
            if (!factory) {
                return throwError(`Dependency does not exist: ${name} (${visited.join(' > ')})`);
            }

            if (factory.opts.cache === false) return false;

            if (factory.dependencies.length > 0) {
                for (let i = 0; i < factory.dependencies.length; i++) {
                    try {
                        if (!resolveCacheFlag(factory.dependencies[i], JSON.parse(JSON.stringify(visited)))) return false;
                    } catch (e) {
                        return throwError(e);
                    }
                }
            }

            return true;
        };

        let makeClassInstance = (constructor, args) => {
            function F() {
                return constructor.apply(this, args);
            }
            F.prototype = constructor.prototype;
            return new F();
        };

        let getModuleInstance = (name, overrides = {}, visited = []) => {

            // check for circular dependencies
            if (visited.includes(name)) {
                visited.push(name);
                return throwError(`Circular dependency: ${visited.join(' > ')}`);
            }

            visited.push(name);

            // try to retrieve factory
            let factory = factories[name];
            if (!factory) {
                return throwError(`Module does not exist: ${name}`);
            }

            // resolve if an instance should be cached
            if (!('cache' in factory.opts) || factory.opts.cache === null) {
                factory.opts.cache = resolveCacheFlag(name);
            }

            let storeInstance = _isEmpty(overrides) && factory.opts.cache;

            // instance already created - return
            if (factory.instance && storeInstance) {
                return factory.instance;
            }

            // resolve factory arguments
            let args = factory.dependencies.map((dependency) => {
                if (dependency in overrides) {
                    return overrides[dependency];
                }

                return getModuleInstance(dependency, overrides, JSON.parse(JSON.stringify(visited)));
            });

            // create instance
            let instance;

            if (factory.opts.isConstructor) {
            	instance = factory.fn;
			} else {
                try {
                    try {
                        // try to create instance of functional module
                        instance = factory.fn.apply(factory, args);
                    } catch (err) {
                        if (!/Cannot call a class as a function/.test(err.message)) {
                            throw err;
                        }

                        // try to create instance of class module
                        instance = makeClassInstance(factory.fn, args);
                    }
                } catch (err) {
                    err.message = `Cannot create an instance of: ${name}. Error: ${err.message}`;
                    return throwError(err);
                }
			}

            // store instance in  cache
            if (storeInstance) {
                factory.instance = instance;
            }

            return instance;
        };

        // PUBLIC INTERFACE
        let container = {
            getAll: () => factories,

            get: (name, overrides = {}) => getModuleInstance(name, overrides),

            getByTag: (tag) => {
                let instances = {};
                for (let key in factories) {
                    if (factories[key].opts.tags.includes(tag)) {
                        instances[key] = container.get(key);
                    }
                }

                return instances;
            },

            register: (name, fn, opts = {}) => {
                if (fn === undefined) {
                    return throwError('Unable to register empty (undefined) module');
                }

                // throw exception if service already exists
                if (name in factories) {
                    return throwError(`Module is already registered: ${name}`);
                }

                opts = _extend({cache: null, tags: []}, opts);
                // remove folder opts
                ['recursive', 'reverseName', 'ignore', 'filter'].map(opt => delete opts[opt]);

                // store service for later
                if (_isFunction(fn)) {
                    factories[name] = {
                        fn: fn,
                        dependencies: opts.dependencies ? opts.dependencies : resolveArguments(fn),
                        opts: opts
                    };
                } else {
                    factories[name] = {
                        fn: () => JSON.parse(JSON.stringify(fn)),
                        dependencies: [],
                        opts: opts
                    };
                }
            },

            load: (path, opts = {}) => {

                if ('prefix' in opts && !(_isString(opts.prefix) && /^[a-zA-Z_$]{1}[a-zA-Z0-9_$]+$/.test(opts.prefix))) {
                    throwError(`Invalid prefix: ${opts.prefix}`);
                }

                if ('postfix' in opts && !(_isString(opts.postfix) && /^[a-zA-Z0-9_$]+$/.test(opts.postfix))) {
                    throwError(`Invalid postfix: ${opts.postfix}`)
                }

                // resolve absolute file path
                let possibleFiles = [
                    path,
                    _path.join(basepath, path)
                ];

                extensions.forEach((ext) => {
                    possibleFiles.push(path + ext);
                    possibleFiles.push(_path.join(basepath, path + ext));
                });

                let realpath;
                for (let i = 0; i < possibleFiles.length; i++) {
                    if (fs.existsSync(possibleFiles[i])) {
                        realpath = fs.realpathSync(possibleFiles[i]);
                        break;
                    }
                }

                if (typeof realpath === 'undefined') {
                    return throwError(`Unable to load file: ${path}`);
                }

                // load particular file or directory
                if (fs.statSync(realpath).isDirectory()) {
                    if ('alias' in opts) {
                        if (!([null, false, undefined, ''].includes(opts.alias) || (_isString(opts.alias) && /^[a-zA-Z_$]{1}[a-zA-Z0-9_$\-]+$/.test(opts.alias)))) {
                            return throwError(`Invalid alias: ${opts.alias}`);
                        }
                    }
                    loadDir('alias' in opts ? (opts.alias || '') : _path.basename(realpath), realpath, opts);
                } else {
                    loadFile(realpath, '', opts);
                }
            },

            override: (name, fn, opts = {}) => {
                if (name in factories) {
                    delete factories[name];
                }

                container.register(name, fn, opts);
            },

            unregister: (name) => {
                delete factories[name];
            },

            clear: () => {
                factories = {};
                container.register('container', container);
            }
        };

        // register itself as a service
        container.register('container', container);

        return container;
    }
};