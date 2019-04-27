const { ViewHandler } = ns('flair.ui');

/**
 * @name VueComponent
 * @description Vue Component
 */
$$('ns', '(auto)');
Class('(auto)', ViewHandler, function() {
    this.factory = (el) => {
       let component = {};

        // el OR template
        if (el) { // this is a view
            component.el = '#' + el; // its always id
        } else { // this is a component
            if (this.style) {
                component.template = '<div><style scoped>' + this.style.trim() +'</style></div><div>' + this.html.trim() + '</div>';
            } else {
                component.template = this.html.trim();
            }
        }

        // TODO: rest all properties



        // done
        return component;
    };

    $$('protected');
    this.inheritAttrs = true;

    $$('protected');
    this.functional = false;

    $$('protected');
    this.model = null;

    $$('protected');
    this.data = null;

    $$('protected');
    this.template = null;

    $$('protected');
    this.props = null;

    $$('protected');
    this.computed = null;

    $$('protected');
    this.methods = null;

    $$('protected');
    this.watch = null;

    // each component in array is defined as:
    // { "name": "name", "type": "ns.typeName" }
    $$('protected');
    this.components = null;

    $$('protected');
    this.mixins = null;

    $$('protected');
    this.transitions = null;

    $$('protected');
    this.handlers = null;   

    $$('protected');
    this.filters = null;
});
