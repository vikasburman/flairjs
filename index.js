const { Class, Interface, Mixin, Struct, Enum, $$, nip, event, ns } = flair;

let L0 = Class('L0', function() {
    this.p0 = 0;
    this.f0 = () => {
        console.log('f0');
    };

    $$('virtual')
    this.vf0 = () => {
        console.log('vf0');
    };
});

let L1 = Class('L1', L0, function() {
    this.p1 = 1;
    this.f1 = () => {
        console.log('f1');
    };

    $$('override')
    $$('sealed')
    this.vf0 = (base) => {
        base();
        console.log('vf0-1');
    };
});

let L2 = Class('L2', L1, function() {
    this.p2 = 2;
    this.f2 = () => {
        console.log('f2');
    };

    $$('override')
    this.vf0 = (base) => {
        base();
        console.log('vf0-2');
    };
});

let L3 = Class('L3', L2, function() {
    this.p3 = 3;
    this.f3 = () => {
        console.log('f3');
    };
});

let L4 = Class('L4', L3, function() {
    this.p4 = 4;
    this.f4 = () => {
        console.log('f4');
    };
});

let l0 = new L0();
let l1 = new L1();
let l2 = new L2();
let l3 = new L3();
let l4 = new L4();



