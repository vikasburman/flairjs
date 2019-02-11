
describe('---- exception.js ----', () => {
    beforeAll(() => { // setup
        let Flair = require('../../dist/flair.js');
        Flair();
    });
    afterAll(() => { // cleanup
        Flair('END');
    });

    describe('Without Params', () => {
        let ex = null;
        beforeAll(() => {
            ex = new Exception();
        });

        it('should have UndefinedException name', () => {
            expect(ex.name).toEqual('UndefinedException');
        });
        it('should not have any wrapped Error', () => {
            expect(ex.error).toEqual(null);
        });
        it('should not have any message', () => {
            expect(ex.message).toEqual('');
        });
    });

    describe('With Various Combination of Params', () => {
        it('should have Exception suffixed in name', () => {
            let ex = new Exception('InvalidArgument');
            expect(ex.name).toEqual('InvalidArgumentException');
        });
        it('should have given message', () => {
            let ex = new Exception('InvalidArgument', 'test');
            expect(ex.message).toEqual('test');
        });
        it('should have given error, name and message', () => {
            let err = new Error('test'),
                ex = new Exception(err);
            expect(ex.error).toEqual(err);
            expect(ex.name).toEqual(err.name + 'Exception'); // since Exception class adds Exception automatically in name
            expect(ex.message).toEqual(err.message);
        });
    });    
});
