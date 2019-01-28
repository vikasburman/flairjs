
describe('---- isMixed.js ----', () => {
    beforeAll(() => { // setup
        let Flair = require('../../dist/flair.js');
        Flair();
    });
    afterAll(() => { // cleanup
        Flair('END');
    });

    describe('Without Params', () => {
        it('should throw', () => {
            expect(() => { return isMixed(); }).toThrow();
        });
    });

    describe('With Params', () => {
        it('should not throw', () => {
            let CL = Class('MyClass', function() { });
            expect(isMixed(CL, 'MyMixin')).toBeFalsy();
        });
    });

    describe('With Class - Direct', () => {
        it('should be valid', () => {
            let MX = Mixin('MyMixin', function() { }), 
                CL = Class('MyClass', [MX], function() { });
            expect(isMixed(CL, 'MyMixin')).toBeTruthy();
            expect(isMixed(CL, MX)).toBeTruthy();
        });
    });

    describe('With Class - Indirect', () => {
        it('should be valid', () => {
            let MX = Mixin('MyMixin', function() { }), 
                CL = Class('MyClass', [MX], function() { }),
                CL2 = Class('MyClass2', CL, function() { });
            expect(isMixed(CL2, 'MyMixin')).toBeTruthy();
            expect(isMixed(CL2, MX)).toBeTruthy();
        });
    });

    describe('With Instance - Direct', () => {
        it('should be valid', () => {
            let MX = Mixin('MyMixin', function() { }), 
                CL = Class('MyClass', [MX], function() { }),
                cl = new CL();
            expect(isMixed(cl, 'MyMixin')).toBeTruthy();
            expect(isMixed(cl, MX)).toBeTruthy();
        });
    });

    describe('With Instance - Indirect', () => {
        it('should be valid', () => {
            let MX = Mixin('MyMixin', function() { }), 
                CL = Class('MyClass', [MX], function() { }),
                CL2 = Class('MyClass2', CL, function() { });
                cl = new CL2();
            expect(isMixed(cl, 'MyMixin')).toBeTruthy();
            expect(isMixed(cl, MX)).toBeTruthy();
        });
    });    
});
