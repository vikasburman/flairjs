
describe('---- as.js ----', () => {
    beforeAll(() => { // setup
        let Flair = require('../../dist/flair.js');
        Flair();
    });
    afterAll(() => { // cleanup
        Flair('END');
    });

    describe('Without Params', () => {
        it('should throw', () => {
            expect(() => { return as(); }).toThrow();
        });
    });

    describe('With Params', () => {
        it('should not throw', () => {
            expect(as('test', 'string')).toEqual('test');
        });
    });

    describe('With Javascript Types', () => {
        it('should be valid', () => {
            let x = 10,
                y = [],
                z = new Date();
            expect(as(x, 'number')).toEqual(x);
            expect(as(y, 'array')).toEqual(y)
            expect(as(z, 'date')).toEqual(z);
        });        
    });    

    describe('With Flair Types', () => {
        it('should be valid', () => {
            let CL = Class('MyClass', function() { });
            expect(as(CL, 'flair')).toEqual(CL);
            expect(as(CL, 'class')).toEqual(CL);
        });        
    });    

    describe('With Flair instance Types', () => {
        it('should be valid', () => {
            let CL = Class('MyClass', function() { }),
                cl = new CL();
            expect(as(cl, 'MyClass')).toEqual(cl);
        });        
    });
});
