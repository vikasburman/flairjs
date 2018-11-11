// setup
let oojs = require('../dist/oojs.js')(global);

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