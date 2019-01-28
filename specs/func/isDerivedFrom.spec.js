
describe('---- isDerivedFrom.js ----', () => {
    beforeAll(() => { // setup
        let Flair = require('../../dist/flair.js');
        Flair();
    });
    afterAll(() => { // cleanup
        Flair('END');
    });

    describe('Without Params', () => {
        it('should throw', () => {
            expect(() => { return isDerivedFrom(); }).toThrow();
        });
    });

    describe('With Unsupported Params', () => {
        it('should throw', () => {
            expect(() => { return isDerivedFrom(10, 'number'); }).toThrow();
        });
    });    

    describe('Direct Inheritance', () => {
        it('should be valid', () => {
            let CL = Class('MyClass', function() { }),
                CL2 = Class('MyClass2', CL, function() { });
            expect(isDerivedFrom(CL2, 'MyClass')).toBeTruthy();
            expect(isDerivedFrom(CL2, CL)).toBeTruthy();
        });
    });    

    describe('Indirect Inheritance', () => {
        it('should be valid', () => {
            let CL = Class('MyClass', function() { }),
                CL2 = Class('MyClass2', CL, function() { }),
                CL3 = Class('MyClass3', CL2, function() { });
            expect(isDerivedFrom(CL3, 'MyClass')).toBeTruthy();
            expect(isDerivedFrom(CL3, CL)).toBeTruthy();
        });
    });
});
