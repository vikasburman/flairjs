const { IProgressReporter, IDisposable } = ns();

/**
 * @name Task
 * @description Task base class.
 */
$$('ns', '(auto)');
Class('(auto)', [IProgressReporter, IDisposable], function() {
    let isSetupDone = false,
        isRunning = false,
        loadingContextName = AppDomain.context.current().name; // this will be processed at the time class is loaded

   /** 
    * @name construct
    * @description Task constructor
    */        
    this.construct = (...args) => {
        this.args = args;

        // set context and domain
        this.context = AppDomain.contexts(loadingContextName);
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
    this.run = async (...args) => {
        if (!isRunning) {
            // mark
            isRunning = true;

            // setup
            if (!isSetupDone) {
                try {
                    await this.setup();
                    isSetupDone = true;
                } catch(err) {
                    isRunning = false;
                    throw err;
                }
            }

            // run
            try {
                let result = await this.onRun(...args);
                return result;
            } catch(err) {
                throw err;
            } finally {
                isRunning = false;
            }
        } else {
             throw Exception.InvalidOperation('Task is already running', this.run);
        }
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
     * @description Task related setup, executed only once, before onRun is called, - async
     * @example
     *  setup()
     * @returns
     *  promise
     */  
    $$('virtual');
    $$('protected');
    $$('async');
    this.setup = noop;

    /** 
     * @name onRun
     * @description Task run handler - async
     * @example
     *  onRun(...args)
     * @arguments
     *  args: array - array as passed to task run
     * @returns
     *  any - anything
     */  
    $$('abstract');
    $$('protected');
    $$('async');
    this.onRun = nim;
});
