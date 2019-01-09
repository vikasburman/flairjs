// setup
require('../dist/flair.js')();

describe('Globals definition', () => {
    describe('when loaded', () => {
        it('should have Class available', () => {
            expect(Class).toBeDefined();
        });
        it('should have using available', () => {
            expect(using).toBeDefined();
        });        
    });
})