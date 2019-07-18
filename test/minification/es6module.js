const service = (a, b) => {
    return {
        method: () => a.method() + b.method()
    };
};
service.dependencies = ['fooService', 'barService'];

export default service;
