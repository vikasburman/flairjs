
describe('---- is.js ----', () => {
    beforeAll(() => { // setup
        let Flair = require('../../dist/flair.js');
        Flair();
    });
    afterAll(() => { // cleanup
        Flair('END');
    });

    describe('Without Params', () => {
        it('should throw', () => {
            expect(() => { return is(); }).toThrow();
        });
    });

    describe('With Params', () => {
        it('should not throw', () => {
            expect(is('test', 'string')).toBeTruthy();
        });
    });

    describe('With Javascript Types', () => {
        it('should be valid', () => {
            expect(is(true, 'boolean')).toBeTruthy();
            expect(is([], 'array')).toBeTruthy();
            expect(is(new Date(), 'date')).toBeTruthy();
        });        
    });    

    describe('With Flair Types', () => {
        it('should be valid', () => {
            let CL = Class('MyClass', function() { });
            expect(is(CL, 'flair')).toBeTruthy();
            expect(is(CL, 'class')).toBeTruthy();
        });        
    });    

    describe('With Flair instance Types', () => {
        it('should be valid', () => {
            let CL = Class('MyClass', function() { }),
                cl = new CL();
            expect(is(cl, 'MyClass')).toBeTruthy();
        });        
    });
});
