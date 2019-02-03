
describe('---- assembly.js ----', () => {
    beforeAll(() => { // setup
        let Flair = require('../../dist/flair.js');
        Flair();
    });
    afterAll(() => { // cleanup
        Flair('END');
    });

    describe('When constructing assembly from ado with Assembly()', () => {
        afterEach(() => {
            Assembly._.reset();
        });

        it('should throw without parameters', () => {
            expect(() => { Assembly(); }).toThrow();
        });

        it('should throw for non ado object types', () => {
            expect(() => { Assembly({ }); }).toThrow();
        });

        it('should construct assembly object from ado object', () => {
            expect(Assembly({ 
                name: 'something',
                file: 'some file',
                types: [],
                assets: []
            })._.type).toEqual('assembly');
        });
    });

    describe('When registering assembly from ado with Assembly.register()', () => {
        afterEach(() => {
            Assembly._.reset();
        });

        it('should throw without parameters', () => {
            expect(() => { Assembly.register({}); }).toThrow();
        });

        it('should throw with wrong parameters', () => {
            expect(() => { Assembly.register({}); }).toThrow();
        });        

        it('should register assembly with valid ado', () => {
            let ado = {
                name: 'something',
                file: 'some file',
                types: [],
                assets: []                
            };
            expect(Assembly.register(ado)).toBeTruthy();
            expect(() => { Assembly.isRegistered(); }).toThrow();
            expect(Assembly.isRegistered(ado.file)).toBeTruthy();
            expect(() => { Assembly.isLoaded(); }).toThrow();
            expect(Assembly.isLoaded(ado.file)).toBeFalsy();
        });

        it('should register assembly with multiple valid ados', () => {
            let ado1 = {
                name: 'something1',
                file: 'some file 1',
                types: [],
                assets: []                
            };
            let ado2 = {
                name: 'something2',
                file: 'some file 2',
                types: [],
                assets: []                
            };
            expect(Assembly.register(ado1, ado2)).toBeTruthy();
        });        

        it('should not register duplicate assemblies', () => {
            let ado1 = {
                name: 'something',
                file: 'some file',
                types: [],
                assets: []                
            };
            let ado2 = {
                name: 'something',
                file: 'some file',
                types: [],
                assets: []                
            };            
            expect(() => { Assembly.register(ado1, ado2); }).toThrow();
        });    
        
        it('should register types for assemblies', () => {
            let ado = {
                name: 'something',
                file: 'some file',
                types: ['a.x', 'b.y', 'c.z'],
                assets: []                
            };
            Assembly.register(ado);
            let asm = Assembly.get('b.y');
            expect(asm.types.length).toEqual(3);
            expect(() => { Assembly.get(); }).toThrow();
            expect(asm.name).toEqual(ado.name);
            expect(Assembly.all().length).toEqual(1);
            expect(Assembly.allTypes().length).toEqual(3);
        });

        it('should not register duplicate types from different assemblies', () => {
            let ado1 = {
                name: 'something1',
                file: 'some file 1',
                types: ['a', 'b'],
                assets: []                
            };
            let ado2 = {
                name: 'something2',
                file: 'some file 2',
                types: ['x', 'y', 'b'],
                assets: []                
            };            
            expect(() => { Assembly.register(ado1, ado2); }).toThrow();
        });         
    });

    describe('When loading assembly from ado with Assembly.load()', () => {
        afterEach(() => {
            Assembly._.reset();
        });

        // TODO: Write this test case when other required things are done
    });

});
