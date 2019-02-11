
describe('---- args.js ----', () => {
    beforeAll(() => { // setup
        let Flair = require('../../dist/flair.js');
        Flair();
    });
    afterAll(() => { // cleanup
        Flair('END');
    });

    describe('Without Params', () => {
        it('should throw', () => {
            expect(() => { return Args(); }).toThrow();
        });
    });

    describe('With Params', () => {
        it('should not throw', () => {
            expect(typeof Args('string')).toEqual('function')
        });
    });

    describe('With Unnamed Arguments', () => {
        let args = null;
        beforeAll(() => {
            args = Args('string, string', 'string, number')('test1', 'test2');
        });
        it('should be a valid match', () => {
            expect(args.isInvalid()).toBeFalsy();
        });        
        it('should match with 1st pattern', () => {
            expect(args.index).toEqual(0);
        });
        it('should have index based arg names', () => {
            expect(args._0_0).toEqual('test1');
            expect(args._0_1).toEqual('test2');
        });
    });    

    describe('With Reserved Named Arguments', () => {
        it('should throw', () => {
            expect(() => { return Args('name: string, index: number')('test1', 10); }).toThrow();
        });        
    });   

    describe('With Named Arguments - All Arguments', () => {
        let args = null;
        beforeAll(() => {
            args = Args('name: string, type: string', 'name: string, place: number')('test1', 10);
        });
        it('should be a valid match', () => {
            expect(args.isInvalid()).toBeFalsy();
        });        
        it('should match with 2nd pattern', () => {
            expect(args.index).toEqual(1);
        });
        it('should have matched named args present', () => {
            expect(args.name).toEqual('test1');
            expect(args.place).toEqual(10);
        });
        it('should have unmatched named args absent', () => {
            expect(args.type).toBeUndefined();
        });        
    });     

    describe('With Named Arguments - Some Arguments', () => {
        let args = null;
        beforeAll(() => {
            args = Args('name: string, type: string', 'name: string, place: number', 'name: string')('test1');
        });
        it('should be a valid match', () => {
            expect(args.isInvalid()).toBeFalsy();
        });        
        it('should match with 3rd pattern', () => {
            expect(args.index).toEqual(2);
        });
        it('should have matched named args present', () => {
            expect(args.name).toEqual('test1');
        });
        it('should have unmatched named args absent', () => {
            expect(args.place).toBeUndefined();
            expect(args.type).toBeUndefined();
        });        
    });
    
    describe('With Named Arguments - Overload Arguments', () => {
        let args = null,
            result1 = result2 = result3 = result4 = null;
        beforeAll(() => {
            args = Args('type: string', 'type: array', 'type: object', 'type: object, name: string');
            result1 = args('test1');
            result2 = args([]);
            result3 = args({});
            result4 = args({}, 'test1');
        });
        it('all should be a valid match', () => {
            expect(result1.isInvalid()).toBeFalsy();
            expect(result2.isInvalid()).toBeFalsy();
            expect(result3.isInvalid()).toBeFalsy();
            expect(result4.isInvalid()).toBeFalsy();
        });        
        it('should match with their specific pattern', () => {
            expect(result1.index).toEqual(0);
            expect(result2.index).toEqual(1);
            expect(result3.index).toEqual(2);
            expect(result4.index).toEqual(3);
        });
        it('should have matched named args present', () => {
            expect(result1.type).toBeDefined();
            expect(result2.type).toBeDefined();
            expect(result3.type).toBeDefined();
            expect(result4.type).toBeDefined();
            expect(result4.name).toBeDefined();
        });
    });

    describe('With Named Arguments - Conflicting Patterns', () => {
        let args = null;
        beforeAll(() => {
            args = Args('type: string, name: string', 'type2: string, name2: string')('test1', 'test2');
        });
        it('should be a valid match', () => {
            expect(args.isInvalid()).toBeFalsy();
        });        
        it('should match with 1st pattern', () => { // as it stops after 1st match
            expect(args.index).toEqual(0);
        });
        it('should have matched named args present', () => {
            expect(args.type).toBeDefined();
            expect(args.name).toBeDefined();
        });        
        it('should not have unmatched named args', () => {
            expect(args.type2).toBeUndefined();
            expect(args.name2).toBeUndefined();
        });        
    });   
});
