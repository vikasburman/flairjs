
describe('---- struct.js ----', () => {
    beforeAll(() => { // setup
        let Flair = require('../../dist/flair.js');
        Flair();
    });
    afterAll(() => { // cleanup
        Flair('END');
    });

    describe('When defining', () => {
        it('it should define properly', () => {
            // let CL = Class('MyClass', function() {

            // });
            // console.log(CL);
            // let cl = new CL();
            // console.log(cl);

            let ST = Struct('MyStruct', function() {
                let run = () => {
                    console.log('Hello!!!!!!');
                    return 10;
                };

                this.construct = (a1) => {
                    this.cc = a1;
                    console.log('created! ' + this.cc);
                };

                //this.dispose = () => {};

        
                this.xyz = () => {
                    this.cc = 20000;
                    //this.abc = () => {};
                    console.log('ME TOO - ' + this.cc);
                    return run();
                };
                this.abc = () => {
                    this.xyz();
                };

      
                attr('event');
                this.started = (args1, args2) => {
                    return { values: [args1, args2] };
                };

                attr('private');
                this.cc = 200;

                let _cc2 = 10;
                this.cc2 = {
                    get: () => { return _cc2; },
                    set: (value) => {
                        _cc2 = value;
                    }
                }

                
            });

            attr('abstract');
            let MyStruct = Struct('MyStruct', function() {
                let run = () => {
                    console.log('Hello!!!!!!');
                    return 10;
                };

                attr('abstract');
                this.construct((a1) => {
                    this.cc = a1;
                    console.log('created! ' + this.cc);
                });

                //this.dispose(() => {});

                this.func('hello', function() {
                    console.log(this.cc);
                    console.log(this.hello2);
                });

                attr('static');
                this.prop('hello2', 10);

                this.func('xyz', () => {
                    this.cc = 20000;
                    //this.func('abc', (() => {}));
                    console.log('ME TOO - ' + this.cc);
                    return run();
                });


                this.func('abc', () => {
                    this.xyz();
                });
      
                this.event('started', (args1, args2) => {
                    return { values: [args1, args2] };
                });

                attr('private');
                this.prop('cc', 200);

                let _cc2 = 10;
                this.prop('cc2', {
                    get: () => { return _cc2; },
                    set: (value) => {
                        _cc2 = value;
                    }
                });
            });
            
            
            //console.log(ST);
            //let st = new ST(1000);
            let st2 = new MyStruct(1000);
            //st.cc2 = 20;
            //console.log(st.cc);
            //st2.hello2 = 20;
            //console.log(st2.hello2);
            //console.log(MyStruct.hello());
            console.log(st2._._.type.isAbstract());


        });

    }); 
});
