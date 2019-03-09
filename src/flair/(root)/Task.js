const { IProgressReporter, IDisposable } = ns('(root)');

/**
 * @name Task
 * @description Task base class.
 */
$$('ns', '(auto)');
Class('(auto)', [IProgressReporter, IDisposable], function() {
    let isSetupDone = false,
        isRunning = false;

   /** 
    * @name construct
    * @description Task constructor
    */        
    this.construct = (...args) => {
        this.args = args;

        // set context and domain
        this.context = AppDomain.contexts(__currentContextName);
        this.domain = this.context.domain;
    };

   /** 
    * @name dispose
    * @description Task disposer
    */  
    $$('abstract');
    this.dispose = nim;

   /** 
    *  @name args: array - for task setup
    */
    $$('protected');
    this.args = [];

   /** 
    *  @name context: object - current assembly load context where this task is loaded
    */
   $$('protected');
   this.context = null;

   /** 
    *  @name domain: object - current assembly domain where this task is executing
    */
   $$('protected');
   this.domain = null;

   /** 
    * @name run
    * @description Task executor
    * @example
    *  run()
    * @arguments
    *  args: array - array as passed to task constructor* 
    * @returns
    *  any - anything
    */  
    this.run = (...args) => {
        return new Promise((resolve, reject) => {
            if (!isRunning) {
                // mark
                isRunning = true;

                const afterSetup = () => {
                    isSetupDone = true;
                    let result = this.onRun(...args);
                    if (result && typeof result.then === 'function') {
                        result.then(resolve).catch(reject).finally(() => {
                            isRunning = false;
                        });
                    } else {
                        isRunning = false;
                        resolve(result);
                    }
                };
                if (!isSetupDone) {
                    this.setup().then(afterSetup).catch((err) => {
                        isRunning = false;
                        reject(err);
                    });
                } else {
                    afterSetup();
                }
            } else {
                reject('Already running'); // TODO: fix w real error
            }
        });
    };
   
   /** 
    * @name progress
    * @description Progress event
    * @example
    *  progress()
    */  
    this.progress = event((data) => {
        return { data: data };
    });

    /** 
     * @name setup
     * @description Task related setup, executed only once, before onRun is called
     * @example
     *  setup()
     * @returns
     *  promise
     */  
    $$('virtual');
    $$('protected');
    this.setup = noop;

    /** 
     * @name onRun
     * @description Task run handler, can be sync or async (returns promise)
     * @example
     *  onRun(...args)
     * @arguments
     *  args: array - array as passed to task run
     * @returns
     *  any - anything
     */  
    $$('abstract');
    $$('protected');
    this.onRun = nim;
});

