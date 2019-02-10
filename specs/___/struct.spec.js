
describe('---- struct.js ----', () => {
    let flair = null;
    beforeAll(() => { // setup

        //Flair();
    });
    afterAll(() => { // cleanup
        //Flair('END');
    });

    describe('When defining', () => {
        it('it should define properly', () => {
            // let CL = Class('MyClass', function() {

            try {
                let flair = require('../../dist/flair.js');
                console.log(flair);            
            } catch (e) {
                console.log(e);            
            }

            // });
            // console.log(CL);
            // let cl = new CL();
            // console.log(cl);

            // let ST = Struct('MyStruct', function() {
            //     let run = () => {
            //         console.log('Hello!!!!!!');
                    
            //         return 10;
            //     };

            //     this.construct = (a1) => {
            //         this.cc = a1;
            //         this.started.subscribe(this.onStart);
            //         //console.log('created! ' + this.cc);
            //         this.started('inside', 20);
            //         console.log(this.started);
            //     };

            //     //this.dispose = () => {};
        
            //     this.xyz = () => {
            //         this.cc = 20000;
            //         //this.abc = () => {};
            //         console.log('ME TOO - ' + this.cc);
            //         return run();
            //     };
            //     this.abc = () => {
            //         this.xyz();
            //     };
      
            //     attr('event');
            //     this.started = (args1, args2) => {
            //         return { values: [args1, args2, this.cc] };
            //     };

            //     this.onStart = (e) => {
            //         console.log(e.name + ' - ' + e.args.values);
            //     };

            //     attr('private');
            //     this.cc = 200;

            //     let _cc2 = 10;
            //     this.cc2 = {
            //         get: () => { return _cc2; },
            //         set: (value) => {
            //             _cc2 = value;
            //         }
            //     }

                
            // });

      
            // let MyStruct = Struct('MyStruct', function() {
            //     let run = () => {
            //         console.log('Hello!!!!!!');
            //         return 10;
            //     };

        
            //     this.construct((stt) => {
            //         //stt.started('outside - but inside other', 50);
            //         //console.log('created! ' + this.cc);
            //     });

            //     //this.dispose(() => {});

            //     this.func('hello', function() {
            //         console.log(this.cc);
            //         console.log(this.hello2);
            //     });

            //     attr('static');
            //     this.prop('hello2', 10);

            //     this.func('xyz', () => {
            //         this.cc = 20000;
            //         //this.func('abc', (() => {}));
            //         console.log('ME TOO - ' + this.cc);
            //         return run();
            //     });

            //     this.func('abc', () => {
            //         this.xyz();
            //     });
      
            //     this.event('started', (args1, args2) => {
            //         return { values: [args1, args2] };
            //     });

            //     attr('private');
            //     this.prop('cc', 200);

            //     let _cc2 = 10;
            //     this.prop('cc2', {
            //         get: () => { return _cc2; },
            //         set: (value) => {
            //             _cc2 = value;
            //         }
            //     });
            // });
            
            
            // console.log(ST);
            // let st = new ST(1000);
            //console.log(st.started);
            //st.started('outside', 40);
            //let st2 = new MyStruct(st);
            //st.cc2 = 20;
            //console.log(st.cc);
            //st2.hello2 = 20;
            //console.log(st2.hello2);
            //console.log(MyStruct.hello());
            //console.log(st2._._.type.isAbstract());
            //Channel.activate(5);

            //Channel.activate(5);
            // Channel('raw', '1');
            // Channel('raw', '2');
            // Channel('raw', '3');
            // Channel('raw', '4');
            // Channel('raw', '5');
            // Channel.publish();
        });

    }); 
});
