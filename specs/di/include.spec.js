
describe('---- include.js ----', () => {
    beforeAll(() => { // setup
        let Flair = require('../../dist/flair.js');
        Flair();
    });
    afterAll(() => { // cleanup
        Flair('END');
    });

    describe('Without Params', () => {
        it('should do nothing', (done) => {
            try {
                include(); // if this failed to do nothing, some spec execution error will occur, because this is an async call
            } catch(e) {
                console.log(e);
            } finally {
                done();
            }
        });
    });

    describe('With empty parameter', () => {
        it('should throw', (done) => {
            try {
                include('', () => {});
                done();
            } catch(e) {
                expect(e.name).toEqual('InvalidArgumentException');
                done();
            }
        });
    });

    describe('Without name defined', () => {
        it('should throw', (done) => {
            try {
                include('fs', () => {});
                done();
            } catch(e) {
                expect(e.name).toEqual('InvalidArgumentException');
                done();
            }
        });
    });    

    describe('When resolving', () => {
        it('should throw when name is incorrect', (done) => {
            include('myFs: fs', (deps, e) => {
                let fs = null,
                    actualFs = require('fs');
                try {
                    fs = deps('myFs1');
                    expect(fs === actualFs).toBeTruthy();
                } 
                catch(e) {
                    expect(e.name).toEqual('InvalidNameException');
                } 
                finally {
                    done();
                }
            });
        });
        it('should fail correctly with error and null value', (done) => {
            include('myFs: fs1', (deps, e) => {
                let fs = null;
                try {
                    fs = deps('myFs');
                    expect(fs === null).toBeTruthy();

                    expect(deps('myFs', true)).toThrow();
                } 
                catch(e) {
                    expect(e.name).toEqual('DependencyResolutionException');
                } 
                finally {
                    done();
                }
            });
        });        
    });

    describe('When resolving server module', () => {
        it('should resolve correctly', (done) => {
            include('myFs: fs', (deps, e) => {
                let fs = null,
                    actualFs = require('fs');
                try {
                    fs = deps('myFs');
                    expect(fs === actualFs).toBeTruthy();
                } 
                catch(e) {
                    expect(e.name).toEqual('');
                } 
                finally {
                    done();
                }
            });
        });
    }); 

    describe('When resolving server file (js)', () => {
        it('should resolve correctly', (done) => {
            require('jasmine-ajax');    
            jasmine.Ajax.install();

            include('myFile: ./abc.js', (deps, e) => {
                try {
                    let myFile = deps('myFile');
                    expect(myFile !== null).toBeTruthy();
                } 
                catch(e) {
                    expect(e.name).toEqual('');
                }
                finally {
                    done();
                }
            });
            request = jasmine.Ajax.requests.mostRecent();
            request.respondWith({ status: 200, responseText: "OK" });
            expect(request.url).toBe('./abc.js');
            expect(request.method).toBe('GET');
        });
    }); 
    
    // TODO: Complete this test, when everything else that is required to test various type of loading is done

});
