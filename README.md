# SDIC: Simple Dependency Injection Container

Dependency injection container with auto injection of module dependencies (by parameter names).

[![Build Status](https://travis-ci.org/josefzamrzla/sdic.svg?branch=master)](https://travis-ci.org/josefzamrzla/sdic)

## Prerequisites
Node.js version >= 6.0


## Install
```bash
npm install sdic
```

## Container initialization
```javascript
const container = require('sdic').create();
```

or

```javascript
import sdic from 'sdic';
const container = sdic.create();
```

## Container API

```javascript
load(path, opts = {})
```
Loads single module file or all module files in given path.

 * path - path to module file or folder with modules
 * opts - options
   * alias - module alias (for a single file module) or a basedir alias (for a folder of modules)
   * cache - keep instances of modules is cache? (default: true)
   * tags[] - list of tags for loaded module(s)
   * recursive - recursive loading of folder (default: true)
   * filter - loads only modules by regexp filter
   * ignore[] - list of regexp to ignore unwanted modules
   * reverseName - create a module name "up to down" (default: false)
   * prefix - prefix module name
   * postfix - postfix module name
   * deduplicate - remove multiple same string occurences (default: false)
   * uppercaseFirst - create a module name with uppercased first letter (default: false - module name starts with lowercased letter)
   * isConstructor - loaded module is a constructor, load and return it as a constructor, do return an instances (default: false - modules as singletons by default)

```javascript
register(name, fn, opts = {})
```
Registers a single module.

 * name - module name
 * fn - module body (function, JSON, primitive, ...)
 * options - see above

```javascript
has(name)
```
Checks whether container contains given module by name.

```javascript
get(name, overrides)
```
Returns registered module from container.

 * name - registered module name
 * overrides - collection of overridden module dependencies

```javascript
getAll()
```
Returns all registered modules

```javascript
getByTag(tag)
```
Returns all registered modules with given tag.

 * tag - tag name

```javascript
override(name, fn, opts)
```
Overrides registered module with new instance.
Parameters: see register method

```javascript
unregister(name)
```
Unregisters module from container.

 * name - module name to unregister

```javascript
clear()
```
Removes all modules from container.

## Tutorial

### Module definition - a module with no dependencies
```javascript
module.exports = (/* no dependencies */) => {
    // module instance
    return {
        someMethod: () => {}
    }
}
```

or using ES6 **export default** syntax:

```javascript
export default (/* no dependencies */) => {
    // module instance
    return {
        someMethod: () => {}
    }
}
```


### Module definition - a module with some dependencies
```javascript
// module depends on myDb and myNextService
module.exports = (myDb, myNextService) => {
    // module instance
    return {
        someMethod: () => {
            return myNextService.doSomething(myDb.getWhatever());
        }
    }
}
```

or using ES6 **export default** syntax:

```javascript
// module depends on myDb and myNextService
export default (myDb, myNextService) => {
    // module instance
    return {
        someMethod: () => {
            return myNextService.doSomething(myDb.getWhatever());
        }
    }
}
```

### Multiple modules definition using ES6 named exports
```javascript
// module without dependencies
export const firstFunctionalService = () => {
    return {
        method: () => ({passed: true})
    }
};

// module dependds on fooService
export function secondFunctionalService (fooService) {
    return {
        method: () => fooService.method()
    }
};

// module dependds on fooService
export class ClassService {
    constructor(fooService) {
        this.fooService = fooService;
    }

    method() {
        return this.fooService.method();
    }
}
```

**ES6 note:** container returns instances of modules by default (aka singletons). If you want to register a class (constructor function), you have to use option: `isConstructor: true`

```javascript
class FooBar {}
container.register('FooBar', FooBar);
container.get('FooBar'); // --> returns an instance of FooBar (default behaviour)
```

```javascript
class FooBar {}
container.register('FooBar', FooBar, {isConstructor: true});
container.get('FooBar'); // --> returns class FooBar
```

```javascript
// all modules will be loaded as constructors
container.load('/path/to/constructors_folder', {isConstructor: true});
```

### Manual module registration

```javascript
container.register('myJson', {foo: 'bar'});
container.get('myJson'); // returns {foo: 'bar'}

container.register('myPrimitive', 123);
container.get('myPrimitive'); // returns 123

container.register('myDep', (/* no dependencies */) => {
    return {
        doWhatever: () => {return 'whatever'}
    }
});

container.register('myModule', (myJson, myPrimitive, myDep) => {
    return {
        getAll: () => ({myJson, myPrimitive, myDepValue: myDep.doWhatever()})
    }
});
container.get('myModule'); // returns an instance of module with injected dependencies
```

### Flat structure loading

Consider this project structure:

```
    + config.json
    |
    + services/
    + - users.js
    + - user-roles.js
    |
    + repositories/
    + - roles.js
    + - users.js
    |
    + lib/
    + - validator.js
```

Let's load all files into SDIC.

```javascript
container.load('./config');  // loads single file: config.json
container.load('./services');  // loads all files in "services" folder (basedir == "services")
container.load('./repositories');  // loads all files in "repositories" folder (basedir == "repositories")
container.load('./lib');  // loads all files in "lib" folder (basedir == "lib")
```

By default, all loaded modules will be named "down to up": camelCased filename + camelCased basedir. So the module names will be:

 * config
 * userRolesServices
 * usersServices
 * rolesRepositories
 * usersRepositories
 * validatorLib

The "plurals" sounds strange. We can rename the basedirs to "singular" or tweak the loader a little bit:

```javascript
container.load('./config');  // this is OK, keep it
container.load('./services', {alias: 'service'});  // alias basedir as "service"
container.load('./repositories', {alias: 'repository'});  // alias basedir as "repository"
container.load('./lib', {alias: null});  // ignore basedir name, there's no need to have explicit "Lib" postfix
```

Now the module names will be:

 * config
 * usersService
 * userRolesService
 * rolesRepository
 * usersRepository
 * validator

Nice :-)


### Nested structure loading

Now consider more nested project structure:

```
    + services/
    + - users/
    + -- roles.js
    + -- users.js
    |
    + repositories/
    + - users/
    + -- roles.js
    + -- index.js
```

We'll skip "config" file and "lib" folder (see above). Let's load all files into SDIC.

```javascript
container.load('./services');  // loads all files in "services" folder (basedir == "services")
container.load('./repositories');  // loads all files in "repositories" folder (basedir == "repositories")
```

By default, all loaded modules will be named "camelCased, down to up": filename + subfolders + basedir. So the module names will be:

 * usersUsersServices
 * rolesUsersServices
 * indexUsersRepositories
 * rolesUsersRepositories

Sounds really strange. Let's set up the loading better. The "services" folder first. It'd be cool to start the name with
the subfolder (if any), then the filename and the basedir at the end.

```javascript
container.load('./services', {
    alias: null,        // disable basedir name at the beginning
    reverseName: true,  // name will be generated "up to down"
    postfix: 'service', // instead of basedir as prefix, append it at the end
    deduplicate: true   // removes multiple "users" string ("users" folder + "users" file)
});
```
Now the modules will be:

 * usersService
 * usersRolesService

Better, but still sounds strange because of "plurals". To fix this we need to split the loading into two steps:

```javascript
container.load('./services/users', {  // the basedir is now "users"
    alias: 'user',      // alias basedir as "user"
    postfix: 'service', // append "service" at the end
    ignore: [/users\.js/] // ignore users.js file for now
});
container.load('./services/users/users', {alias: 'userService'}); // append the ignored file
```

Finally the modules will be:

 * userService
 * userRolesService

We can load the "repositories" folder the same way.

**ES6 note:** when loading named exports into the container, then:
 * exported name will be taken instead of a filename (with lowercased first letter)
 * filename will be taken for default (not-named) export

## Minification
SDIC supports code minification. Because module dependencies are defined using parameter names, the code minification process would damage them (to `a`, `b`, `c`, ... etc.) and SDIC would not be able to load them properly. To prevent this situation all you need to do, is to define the list of a module dependencies in a property `dependencies`:

### ES6 modules dependencies
```
const service = (a, b) => { // minified param names
    return {
        method: () => a.method() + b.method()
    };
};
service.dependencies = ['fooService', 'barService']; // <--- definition of dependencies

export default service;
```

### CommonJs modules dependencies
```
const service = (a, b) => { // minifies param names
    return {
        method: () => a.method() + b.method()
    };
};
service.dependencies = ['fooService', 'barService']; // <--- definition of dependencies

module.exports = service;
```

### Class dependencies
```
export class ClassService {
    constructor(a, b) { // minified param names
        this.fooService = a;
        this.barService = b;
    }

    method() {
        return this.fooService.method() + this.barService.method();
    }
}
ClassService.dependencies = ['fooService', 'barService']; // <--- definition of dependencies
```

## TODO
 * load both file and folder with the same name, eg:
    ```text
     +- users/ <- load this
     +- -- foo.js
     +- users.js <- as well as this
    ```
 * docs, docs, docs

Based on the idea of: https://www.npmjs.com/package/adctd
