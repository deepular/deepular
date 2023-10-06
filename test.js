function __assignType(fn, args) {
    fn.__type = args;
    return fn;
}
import { ChangeDetectionStrategy, Component, ɵReflectionCapabilities as ReflectionCapabilities, Injectable, } from '@angular/core';
import * as i0 from "@angular/core";
export class TestService {
    static { this.ɵfac = __assignType(function TestService_Factory(t) { return new (t || TestService)(); }, ['t', 'TestService_Factory', 'P"2!"/"']); }
    static { this.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: TestService, factory: TestService.ɵfac }); }
    static { this.__type = ['5']; }
}
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(TestService, [{
        type: Injectable
    }], null, null); })();
/*@NgModule({
  providers: [TestService],
})
export class TestModule {}*/
export class TestComponent {
    constructor(svc) {
        this.svc = svc;
    }
    static { this.ɵfac = __assignType(function TestComponent_Factory(t) { return new (t || TestComponent)(i0.ɵɵdirectiveInject(TestService)); }, ['t', 'TestComponent_Factory', 'P"2!"/"']); }
    static { this.ɵcmp = /*@__PURE__*/ i0.ɵɵdefineComponent({ type: TestComponent, selectors: [["ng-component"]], standalone: true, features: [i0.ɵɵProvidersFeature([TestService]), i0.ɵɵStandaloneFeature], decls: 2, vars: 0, template: __assignType(function TestComponent_Template(rf, ctx) { if (rf & 1) {
            i0.ɵɵelementStart(0, "div");
            i0.ɵɵtext(1, "Hello there!");
            i0.ɵɵelementEnd();
        } }, ['rf', 'ctx', 'TestComponent_Template', 'P"2!"2""/#']), encapsulation: 2, changeDetection: 0 }); }
    static { this.__type = [() => TestService, 'svc', 'constructor', 'PP7!2"9"0#5']; }
}
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(TestComponent, [{
        type: Component,
        args: [{
                standalone: true,
                template: `<div>Hello there!</div>`,
                providers: [TestService],
                changeDetection: ChangeDetectionStrategy.OnPush,
            }]
    }], function () { return [{ type: TestService }]; }, null); })();
const reflectionCapabilities = new ReflectionCapabilities();
console.log({
    parameters: reflectionCapabilities.parameters(TestComponent)[0],
    annotations: reflectionCapabilities.annotations(TestComponent)[0],
    factory: reflectionCapabilities.factory(TestComponent),
    propMetadata: reflectionCapabilities.propMetadata(TestComponent),
});
//# sourceMappingURL=test.js.map