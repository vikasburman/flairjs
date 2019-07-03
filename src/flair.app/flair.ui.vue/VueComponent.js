const { VueComponentMembers } = ns('flair.ui.vue');

/**
 * @name VueComponent
 * @description Vue Component
 */
$$('ns', '(auto)');
Class('(auto)', [VueComponentMembers], function() {
    this.factory = async () => {
        // shared between view and component both
        // coming from VueComponentMembers mixin
        let component = await this.define();

        // template
        // https://vuejs.org/v2/api/#template
        // built from html and css settings
        if (this.html) {
            component.template = this.html.trim();
        }

        // props
        // https://vuejs.org/v2/guide/components-props.html
        // https://vuejs.org/v2/api/#props
        // these names can then be defined as attribute on component's html node
        if (this.props && Array.isArray(this.props)) {
            component.props = this.props;
        }

        // data
        // https://vuejs.org/v2/api/#data
        if (this.data) { 
            let _this = this;
            if (typeof this.data === 'function') {
                component.data = function() { return _this.data(); }
            } else {
                component.data = function() { return _this.data; }
            }
        }

        // name
        // https://vuejs.org/v2/api/#name
        if (this.name) {
            component.name = this.name;
        }

        // model
        // https://vuejs.org/v2/api/#model
        if (this.model) {
            component.model = this.model;
        }

        // inheritAttrs
        // https://vuejs.org/v2/api/#inheritAttrs
        if (typeof this.inheritAttrs === 'boolean') { 
            component.inheritAttrs = this.inheritAttrs;
        }

        // done
        return component;
    };

    $$('protectedSet');
    this.name = '';

    $$('protected');
    this.props = null;

    $$('protected');
    this.data = null;

    $$('protected');
    this.model = null;    

    $$('protected');
    this.inheritAttrs = null;
});
