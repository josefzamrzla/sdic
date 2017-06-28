export const firstFunctionalService = () => {
    return {
        method: () => ({passed: true})
    }
};

export function secondFunctionalService (fooService) {
    return {
        method: () => fooService.method()
    }
};

export class ClassService {
    constructor(fooService) {
        this.fooService = fooService;
    }

    method() {
        return this.fooService.method();
    }
}

export default (fooService) => ({
    method: () => fooService.method()
})