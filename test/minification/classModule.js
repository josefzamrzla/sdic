export class ClassService1 {
    constructor(a, b) {
        this.fooService = a;
        this.barService = b;
    }

    method() {
        return this.fooService.method() + this.barService.method();
    }
}
ClassService1.dependencies = ['fooService', 'barService'];

export class ClassService2 {
    constructor(a, b) {
        this.fooService = a;
        this.barService = b;
    }

    method() {
        return this.fooService.method() + this.barService.method();
    }
}
ClassService2.dependencies = ['fooService', 'barService'];
