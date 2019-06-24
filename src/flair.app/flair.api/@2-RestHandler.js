const { Handler } = ns('flair.app');

/**
 * @name RestHandler
 * @description Restful API Handler
 */
$$('ns', '(auto)');
Class('(auto)', Handler, function() {
    $$('private');
    this.run = async (fn, req, res) => {
        let result = null;
        if (fn !== noop) {
            try {
                result = await fn(req, res);
            } catch (err) {
                res.status(err.status || 500).json({status: err.status, message: err.message})
            }
        } else {
            res.status(501).json({status: '501', message: 'Not Implemented'});
        }
        return result;
    };

    this.get = async (req, res) => { return await this.run(this.onGet, req, res); };
    this.post = async (req, res) => { return await this.run(this.onPost, req, res); };
    this.put = async (req, res) => { return await this.run(this.onPut, req, res); };
    this.patch = async (req, res) => { return await this.run(this.onPatch, req, res); };
    this.delete = async (req, res) => { return await this.run(this.onDelete, req, res); };

    $$('protected');
    $$('virtual');
    $$('async');
    this.onGet = noop;

    $$('protected');
    $$('virtual');
    $$('async');
    this.onPost = noop;


    $$('protected');
    $$('virtual');
    $$('async');
    this.onPut = noop;

    $$('protected');
    $$('virtual');
    $$('async');
    this.onPatch = noop;

    $$('protected');
    $$('virtual');
    $$('async');
    this.onDelete = noop;
});
