
describe('Load:', () => {
    let Flair = null;
    beforeAll(() => {
        Flair = require('../dist/flair.js');
    });

    it('should load Flair factory as module', () => {
        expect(Flair).toBeDefined();
    });
    it('should not load Flair factory globally', () => { // which happens only on client side
        expect(global.Flair).toBeUndefined();
    });        
    it('should attach build engine', () => { // since tests run in server environment
        expect(typeof(Flair.build)).toEqual('function');
    });

    describe('Init:', () => {
        beforeAll(() => {
            Flair();
        });

        it('should load global flair object', () => {
            expect(flair).toBeDefined();
        });
        it('should initialize flair options', () => {
            expect(flair.options).toBeDefined();
        });
        it('should identify server environment', () => {
            expect(flair.options.env.isServer).toBeTruthy();
            expect(flair.options.env.isClient).toBeFalsy();
        });        
        it('should not be identified as TEST environment', () => {
            expect(flair.options.env.isTesting).toBeFalsy();
        });        
        it('should not be identified as DEBUG mode', () => {
            expect(flair.options.env.isDebug).toBeFalsy();
        });        
        it('should load flair members', () => {
            expect(flair.members.length).toBeGreaterThan(0);
        });
        it('should define global members', () => {
            expect(Exception).toBeDefined();
            expect(Enum).toBeDefined();
            expect(Class).toBeDefined();
            expect(Reflector).toBeDefined();
        });

        describe('Re-Init (Without Globals):', () => {
            beforeAll(() => {
                Flair({
                    symbols: ['TEST', 'DEBUG'], 
                    supressGlobals: true 
                });
            });
        
            it('should load global flair object', () => {
                expect(flair).toBeDefined();
            });                
            it('should identify TEST environment', () => {
                expect(flair.options.env.isTesting).toBeTruthy();
            });        
            it('should identify DEBUG mode', () => {
                expect(flair.options.env.isDebug).toBeTruthy();
            });        
            it('should identify server environment', () => {
                expect(flair.options.env.isServer).toBeTruthy();
                expect(flair.options.env.isClient).toBeFalsy();
            });                     
            it('should not define global members', () => {
                expect(global.Exception).toBeUndefined();
                expect(global.Enum).toBeUndefined();
                expect(global.Class).toBeUndefined();
                expect(global.Reflector).toBeUndefined();
            });
            
            describe('Re-Init (With Conflicting Options):', () => {
                it('should throw', () => {
                    expect(() => { Flair('DEBUG, PROD'); }).toThrowError();
                });                

                describe('Re-Init (With Globals):', () => {
                    beforeAll(() => {
                        Flair('TEST, DEBUG, SPECIAL, CLIENT');
                    });
                
                    it('should load global flair object', () => {
                        expect(flair).toBeDefined();
                    });            
                    it('should identify TEST environment', () => {
                        expect(flair.options.env.isTesting).toBeTruthy();
                    });        
                    it('should identify mocked client environment', () => {
                        expect(flair.options.env.isServer).toBeFalsy();
                        expect(flair.options.env.isClient).toBeTruthy();
                    });        
                    it('should identify DEBUG mode', () => {
                        expect(flair.options.env.isDebug).toBeTruthy();
                    });        
                    it('should have SPECIAL symbol', () => {
                        expect(flair.options.symbols.indexOf('SPECIAL')).toBeGreaterThan(-1);
                    });     
                    it('should define global members', () => {
                        expect(Exception).toBeDefined();
                        expect(Enum).toBeDefined();
                        expect(Class).toBeDefined();
                        expect(Reflector).toBeDefined();
                    });                           

                    describe('Configure custom loaders:', () => {
                        let mockFunc1 = () => { return '1'; },
                            mockFunc2 = () => { return '2'; };
                        beforeAll(() => {
                            flair.options.loaders.define('cm', mockFunc1);
                            flair.options.loaders.define('sm', mockFunc2);
                            flair.options.loaders.define('sf', mockFunc1);
                            flair.options.loaders.define('cf', mockFunc2);
                            flair.options.loaders.define('cm', mockFunc2);
                        });
                    
                        it('should have custom loaders defined', () => {
                            expect(flair.options.loaderOverrides.moduleLoaderClient).toBe(mockFunc1);
                            expect(flair.options.loaderOverrides.moduleLoaderServer).toBe(mockFunc2);
                            expect(flair.options.loaderOverrides.fileLoaderServer).toBe(mockFunc1);
                            expect(flair.options.loaderOverrides.fileLoaderClient).toBe(mockFunc2);
                        });
        
                        describe('Unload:', () => {
                            beforeAll(() => {
                                Flair('END');
                            });

                            it('should not have flair object available anymore', () => {
                                expect(global.flair).toBeUndefined();
                            }); 
                            it('should not have global members available anymore', () => {
                                expect(global.Exception).toBeUndefined();
                                expect(global.Enum).toBeUndefined();
                                expect(global.Class).toBeUndefined();
                                expect(global.Reflector).toBeUndefined();
                            });                    
                            it('should still have Flair factory available', () => {
                                expect(Flair).toBeDefined();
                            });
                        
                        });
                    });
                });
            });
        });    
    });
});
