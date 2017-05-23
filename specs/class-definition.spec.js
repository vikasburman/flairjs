// setup
let oojs = require('../oojs.js')(global);

describe('Simple class definiton', () => {
    // class definition
    let Vehicle = Class('Vehicle', function() {
        this.prop('isStarted', false);
        this.func('start', () => {
            this.isStarted = true;
        });
    });
    let obj = new Vehicle();

    describe('when Vehicle class is defined', () => {
        it('should have its Name as Vehicle', () => {
            expect(Vehicle.Name).toEqual('Vehicle');
        });
        it('should Inherits from nothing', () => {
            expect(Vehicle.Inherits).toBeNull();
        });
    });
    describe('when Vehicle instance is created', () => {
        it('should Inherits from Vehicle', () => {
            expect(obj._.Inherits.Name).toEqual('Vehicle');
        });
        it('should have a public property named isStarted with false value', () => {
            expect(obj.isStarted).toBeDefined();
            expect(obj.isStarted).toEqual(false);
        });          
        it('should have a public function start', () => {
            expect(obj.start).toBeDefined();
            expect(typeof obj.start).toEqual('function');
        });         
    });
})