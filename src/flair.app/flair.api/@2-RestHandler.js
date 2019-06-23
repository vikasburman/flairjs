const { Handler } = ns('flair.app');

/**
 * @name RestHandler
 * @description Restful API Handler
 */
$$('ns', '(auto)');
Class('(auto)', Handler, function() {
    $$('private');
    this.run = async (fn, req, res) => {
        if (typeof fn === 'function') {
            try {
                await fn(req, res);
            } catch (err) {
                res.status(err.status || 500).json({status: err.status, message: err.message})
            }
        } else {
            res.status(501).json({status: '501', message: 'Not Implemented'})
        }
    };

    this.get = async (req, res) => { await this.run(this.onGet, req, res); };
    this.post = async (req, res) => { await this.run(this.onPost, req, res); };
    this.put = async (req, res) => { await this.run(this.onPut, req, res); };
    this.patch = async (req, res) => { await this.run(this.onPatch, req, res); };
    this.delete = async (req, res) => { await this.run(this.onDelete, req, res); };
    
    $$('protected');
    $$('virtual');
    this.onGet = async (req, res) => { // eslint-disable-line no-unused-vars
        res.send(501); // Not Implemented
    };

    $$('protected');
    $$('virtual');
    this.onPost = async (req, res) => { // eslint-disable-line no-unused-vars
        res.send(501); // Not Implemented
    };


    $$('protected');
    $$('virtual');
    this.onPut = async (req, res) => { // eslint-disable-line no-unused-vars
        res.send(501); // Not Implemented
    };


    $$('protected');
    $$('virtual');
    this.onPatch = async (req, res) => { // eslint-disable-line no-unused-vars
        res.send(501); // Not Implemented
    };

    $$('protected');
    $$('virtual');
    this.onDelete = async (req, res) => { // eslint-disable-line no-unused-vars
        res.send(501); // Not Implemented
    };    
});
