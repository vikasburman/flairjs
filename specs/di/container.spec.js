
describe('---- container.js ----', () => {
    beforeAll(() => { // setup
        let Flair = require('../../dist/flair.js');
        Flair();
    });
    afterAll(() => { // cleanup
        Flair('END');
    });

    describe('When registering types with Container.register()', () => {
        afterEach(() => {
            Container._.reset();
        });

        it('should throw without parameters', () => {
            expect(() => { Container.register(); }).toThrow();
        });

        it('should throw for unknown types', () => {
            expect(() => { Container.register('something', 10); }).toThrow();
            expect(() => { Container.register('something', () => {}); }).toThrow();
        });

        it('should register string types', () => {
            expect(Container.register('something', 'myClass')).toBeTruthy();
            expect(Container.register('something', 'myNamespace.myClass')).toBeTruthy();
            expect(Container.register('something', 'https://xyz/abc.js')).toBeTruthy();
        });

        it('should register object types', () => {
            expect(Container.register('something', {})).toBeTruthy();
            expect(Container.register('something', new Date())).toBeTruthy();
            expect(Container.register('something', jasmine)).toBeTruthy();
        });

        it('should register flair types', () => {
            expect(Container.register('something', Class('myClass', function() {}))).toBeTruthy();
            expect(Container.register('something', Structure('myStructure', function() {}))).toBeTruthy();
            expect(Container.register('something', Interface('myInterface', function() {}))).toBeTruthy();
        });
    }); 

    describe('When finding alias with Container()', () => {
        afterEach(() => {
            Container._.reset();
        });

        it('should throw without parameters', () => {
            expect(() => { Container(); }).toThrow();
        });

        it('should return null for unregistered type', () => {
            expect(Container('something')).toBeNull();
        });

        it('should return first registered type as is', () => {
            Container.register('jQuery', 'https://xyz/jquery.js');
            expect(Container('jQuery')).toEqual('https://xyz/jquery.js');
        });

        it('should return all registered types for an alias', () => {
            Container.register('jQuery', 'https://xyz/jquery1.js');
            Container.register('jQuery', 'https://xyz/jquery2.js');
            expect(Container('jQuery', true).join(', ')).toEqual('https://xyz/jquery1.js, https://xyz/jquery2.js');
        });
    }); 

    describe('When checking for alias with Container.isRegistered()', () => {
        afterEach(() => {
            Container._.reset();
        });

        it('should throw without parameters', () => {
            expect(() => { Container.isRegistered(); }).toThrow();
        });

        it('should return false for unregistered alias', () => {
            expect(Container('something')).toBeFalsy();
        });

        it('should return true for registered alias', () => {
            Container.register('jQuery', 'https://xyz/jquery.js');
            expect(Container.isRegistered('jQuery')).toBeTruthy();
        });
    });     

    describe('When resolving with Container.resolve()', () => {
        afterEach(() => {
            Container._.reset();
        });

        it('should give qualified name as is for unloaded types', () => {
            Container.register('something', 'myNamespace.myClass');
            expect(Container.resolve('something', false)).toEqual('myNamespace.myClass');
        });

        it('should give instance for loaded types', () => {
            Class('a.b.myClass', function() {});
            Container.register('something', 'a.b.myClass');
            expect(Container.resolve('something', false)._.type).toEqual('instance');
        });        

        it('should give file url as is', () => {
            Container.register('something', 'https://xyz/jquery.js');
            expect(Container.resolve('something', false)).toEqual('https://xyz/jquery.js');
        });

        it('should give non-instantiatable flair type as is', () => {
            let Int = Interface('IBase', () => {});
            Container.register('something', Int);
            expect(Container.resolve('something', false)).toEqual(Int);
        });

        it('should give objects as is', () => {
            let xyz = {};
            Container.register('something', xyz);
            expect(Container.resolve('something', false)).toEqual(xyz);
        });

        it('should give a instance of instantiatable flair types', () => {
            Container.register('My', Class('MyClass', function() { }));
            expect(Container.resolve('My', false)._.type).toEqual('instance');
        });        

        it('should pass arguments to an instance of instantiatable flair types', () => {
            Container.register('My', Class('MyClass', function() { 
                this.construct((what) => {
                    this.what = what;
                });

                this.prop('what');
            }));
            expect(Container.resolve('My', false, 10).what).toEqual(10);
        });
        
        it('should create instances of multiple instantiatable flair types', () => {
            Container.register('My', Class('MyClass1', function() { }));
            Container.register('My', Class('MyClass2', function() { }));
            let all = Container.resolve('My', true);
            expect(all[0]._.type).toEqual('instance');
            expect(all[1]._.type).toEqual('instance');
        }); 

        it('should return mixed types when registered on same alias', () => {
            Class('x.y.myClass', function() {});
            Container.register('something', 'my.Class');
            Container.register('something', 'https://xyz/abc.js');
            Container.register('something', jasmine);
            Container.register('something', Class('MyClass', function() { }));
            Container.register('something', 'x.y.myClass');
            let all = Container.resolve('something', true);
            expect(all[0]).toEqual('my.Class');
            expect(all[1]).toEqual('https://xyz/abc.js');
            expect(all[2]).toEqual(jasmine);
            expect(all[3]._.type).toEqual('instance');
            expect(all[4]._.type).toEqual('instance');
        }); 

    }); 
});
