const service = (fooService) => {
    return {
        method: () => fooService.method()
    }
};

export default service;