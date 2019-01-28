
describe('---- isInstanceOf.js ----', () => {
    beforeAll(() => { // setup
        let Flair = require('../../dist/flair.js');
        Flair();
    });
    afterAll(() => { // cleanup
        Flair('END');
    });

    describe('Without Params', () => {
        it('should throw', () => {
            expect(() => { return isInstanceOf(); }).toThrow();
        });
    });

    describe('With Unsupported Params', () => {
        it('should throw', () => {
            expect(() => { return isInstanceOf(10, 'number'); }).toThrow();
        });
    });    

    describe('With Structure Instance - Structure', () => {
        it('should be valid', () => {
            let ST = Structure('MyStructure', function() { }),
                st = new ST();
            expect(isInstanceOf(st, 'MyStructure')).toBeTruthy();
            expect(isInstanceOf(st, ST)).toBeTruthy();
        });
    });    

    describe('With Class Instance - Class', () => {
        it('should be valid', () => {
            let CL = Class('MyClass', function() { }),
                cl = new CL();
            expect(isInstanceOf(cl, 'MyClass')).toBeTruthy();
            expect(isInstanceOf(cl, CL)).toBeTruthy();
        });
    });

    describe('With Class Instance - Interface', () => {
        it('should be valid', () => {
            let Ix = Interface('IMyInterface', function() { }),
                CL = Class('MyClass', [Ix], function() { }),
                cl = new CL();
            expect(isInstanceOf(cl, 'IMyInterface')).toBeTruthy();
            expect(isInstanceOf(cl, Ix)).toBeTruthy();
        });
    });    

    describe('With Class Instance - Mixin', () => {
        it('should be valid', () => {
            let Mix = Mixin('MyMixin', function() { }),
                CL = Class('MyClass', [Mix], function() { }),
                cl = new CL();
            expect(isInstanceOf(cl, 'MyMixin')).toBeTruthy();
            expect(isInstanceOf(cl, Mix)).toBeTruthy();
        });
    });  
});
