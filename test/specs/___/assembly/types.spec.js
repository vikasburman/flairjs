
describe('---- types.js ----', () => {
    beforeAll(() => { // setup
        let Flair = require('../../dist/flair.js');
        Flair();
    });
    afterAll(() => { // cleanup
        Flair('END');
    });

    describe('Without Params', () => {
        it('should throw', () => {
            expect(() => { return Types(); }).toThrow();
        });
    });

    describe('With Params', () => {
        it('should not throw', () => {
            expect(Types('test')).toBeNull();
        });
    });

    describe('With Registered Types', () => {
        it('should be not null', () => {
            let CL = Class('a.b.MyClass', function() { });
            expect(Types('a.b.MyClass')).toEqual(CL);
        });        
    });    

    describe('With Unregistered Types', () => {
        it('should be null', () => {
            expect(Types('SomeClass')).toBeNull();
        });        
    });
});
