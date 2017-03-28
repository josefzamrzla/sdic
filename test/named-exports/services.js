export const FirstFunctionalService = () => {
    return {
        method: () => ({passed: true})
    }
};

export function SecondFunctionalService (fooService) {
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