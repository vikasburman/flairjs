// setup
let oojs = require('../src/oojs.js')(global);

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