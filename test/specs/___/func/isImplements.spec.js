
describe('---- isImplements.js ----', () => {
    beforeAll(() => { // setup
        let Flair = require('../../dist/flair.js');
        Flair();
    });
    afterAll(() => { // cleanup
        Flair('END');
    });

    describe('Without Params', () => {
        it('should throw', () => {
            expect(() => { return isImplements(); }).toThrow();
        });
    });

    describe('With Params', () => {
        it('should not throw', () => {
            let CL = Class('MyClass', function() { });
            expect(isImplements(CL, 'IMyInterface')).toBeFalsy();
        });
    });

    describe('With Class - Direct', () => {
        it('should be valid', () => {
            let Intf = Interface('IMyInterface', function() { }), 
                CL = Class('MyClass', [Intf], function() { });
            expect(isImplements(CL, 'IMyInterface')).toBeTruthy();
            expect(isImplements(CL, Intf)).toBeTruthy();
        });
    });

    describe('With Class - Indirect', () => {
        it('should be valid', () => {
            let Intf = Interface('IMyInterface', function() { }), 
                CL = Class('MyClass', [Intf], function() { }),
                CL2 = Class('MyClass2', CL, function() { });
            expect(isImplements(CL2, 'IMyInterface')).toBeTruthy();
            expect(isImplements(CL2, Intf)).toBeTruthy();
        });
    });

    describe('With Instance - Direct', () => {
        it('should be valid', () => {
            let Intf = Interface('IMyInterface', function() { }), 
                CL = Class('MyClass', [Intf], function() { }),
                cl = new CL();
            expect(isImplements(cl, 'IMyInterface')).toBeTruthy();
            expect(isImplements(cl, Intf)).toBeTruthy();
        });
    });

    describe('With Instance - Indirect', () => {
        it('should be valid', () => {
            let Intf = Interface('IMyInterface', function() { }), 
                CL = Class('MyClass', [Intf], function() { }),
                CL2 = Class('MyClass2', CL, function() { });
                cl = new CL2();
            expect(isImplements(cl, 'IMyInterface')).toBeTruthy();
            expect(isImplements(cl, Intf)).toBeTruthy();
        });
    });    
});
