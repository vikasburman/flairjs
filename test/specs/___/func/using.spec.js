
describe('---- using.js ----', () => {
    beforeAll(() => { // setup
        let Flair = require('../../dist/flair.js');
        Flair();
    });
    afterAll(() => { // cleanup
        Flair('END');
    });

    describe('Without Params', () => {
        it('should throw', () => {
            expect(() => { return using(); }).toThrow();
        });
    });

    describe('With Wrong Params', () => {
        it('should throw', () => {
            let CL = Class('MyClass', function() { });
            expect(() => { return using('test', 10); }).toThrow();
            expect(() => { return using(new CL(), 10); }).toThrow();
        });
    });

    describe('When dispose is not defined - sync call', () => {
        it('should return value', () => {
            let CL = Class('MyClass', function() { });
            expect(using(new CL(), (cl) => { return 10; })).toEqual(10);
        });        
    });    

    describe('When dispose is not defined - async call', () => {
        it('should return value', (done) => {
            let CL = Class('MyClass', function() { });
            let x = using(new CL(), (cl) => {
                return new Promise((resolve, reject) => {
                    resolve(10);
                });
            });
            x.then((result) => {
                expect(result).toEqual(10);
                done();
            });
        });        
    }); 

    describe('When dispose is defined - sync call - no error', () => {
        it('should be disposed', () => {
            let CL = Class('MyClass', function() { 
                this.destruct(() => {
                    console.log('disposed!');
                });
            });
            let oldLog = console.log;
            console.log = jasmine.createSpy('log');
            using(new CL(), (cl) => { });
            expect(console.log).toHaveBeenCalledWith('disposed!');
            console.log = oldLog;
        });        
    });     

    describe('When dispose is defined - async call - no error', () => {
        it('should be disposed', (done) => {
            let CL = Class('MyClass', function() { 
                this.destruct(() => {
                    console.log('disposed!');
                });
            });
            let oldLog = console.log;
            console.log = jasmine.createSpy('log');
            let x = using(new CL(), (cl) => {
                return new Promise((resolve, reject) => {
                    resolve();
                });
            });
            x.then((result) => {
                expect(console.log).toHaveBeenCalledWith('disposed!');
                console.log = oldLog;
                done();
            });            
        });       
    });     

    describe('When dispose is defined - sync call - with error', () => {
        it('should throw and still be disposed', () => {
            let CL = Class('MyClass', function() { 
                this.destruct(() => {
                    console.log('disposed!');
                });
                this.func('blast', () => {
                    throw 'Error!';
                });
            });
            let oldLog = console.log;
            console.log = jasmine.createSpy('log');
            expect(() => {
                using(new CL(), (cl) => { cl.blast(); });
            }).toThrow();
            expect(console.log).toHaveBeenCalledWith('disposed!');
            console.log = oldLog;
        });
    });     

    describe('When dispose is defined - async call - with error', () => {
        it('should throw and still be disposed', (done) => {
            let CL = Class('MyClass', function() { 
                this.destruct(() => {
                    console.log('disposed!');
                });
            });
            let oldLog = console.log;
            console.log = jasmine.createSpy('log');
            let x = using(new CL(), (cl) => {
                return new Promise((resolve, reject) => {
                    reject();
                });
            });
            x.catch((result) => {
                expect(console.log).toHaveBeenCalledWith('disposed!');
                console.log = oldLog;
                done();
            });            
        });       
    });     
});
