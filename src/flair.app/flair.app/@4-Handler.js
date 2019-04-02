
const { IDisposable } = ns();

/**
 * @name Handler
 * @description Handler base class
 */
$$('ns', '(auto)');
Class('(auto)', [IDisposable], function() {
    $$('privateSet');
    this.flags = [];

    $$('virtual');
    this.construct = (flags) => {
        this.flags = flags;
    };

    $$('virtual');
    this.dispose = () => {
        this.flags = null;
    };
});
