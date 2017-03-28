const service = (fooService) => ({
    method: () => fooService.method()
});

export default service;