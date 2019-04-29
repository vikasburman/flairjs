const { Handler } = ns('flair.app');
const { ViewTransition } = ns('flair.ui');

/**
 * @name ViewHandler
 * @description GUI View Handler
 */
$$('ns', '(auto)');
Class('(auto)', Handler, function() {
    let mainEl = '';

    $$('override');
    this.construct = (base, el, title, transition) => {
        base();

        mainEl = el || 'main';
        this.viewTransition = transition;
        this.title = this.title + (title ? ' - ' + title : '');
    };

    $$('privateSet');
    this.viewTransition = '';

    $$('protectedSet');
    this.name = '';

    $$('protectedSet');
    this.title = '';

    // each meta in array can be defined as:
    // { "<nameOfAttribute>": "<contentOfAttribute>", "<nameOfAttribute>": "<contentOfAttribute>", ... }
    $$('protectedSet');
    this.meta = null;

    this.view = async (ctx) => {
        // give it a unique name, if not already given
        this.name = this.name || (this.$self.id + '_' + guid());

        // load view transition
        if (this.viewTransition) {
            let ViewTransitionType = as(await include(this.viewTransition), ViewTransition);
            if (ViewTransitionType) {
                this.viewTransition = new ViewTransitionType();
            } else {
                this.viewTransition = '';
            }
        }

        // add view el to parent
        let el = DOC.createElement('div'),
            parentEl = DOC.getElementById(mainEl);
        el.id = this.name;
        el.setAttribute('hidden', '');
        parentEl.appendChild(el);
        
        // load view
        this.load(ctx, el);

        // swap views (old one is replaced with this new one)
        await this.swap();
    };

    $$('protected');
    $$('virtual');
    $$('async');
    this.loadView = noop;

    $$('private');
    this.swap = async () => {
        let thisViewEl = DOC.getElementById(this.name);

        // outgoing view
        if (this.$static.currentView) {
            let currentViewEl = DOC.getElementById(this.$static.currentView);

            // remove outgoing view meta   
            for(let meta of this.meta) {
                DOC.head.removeChild(DOC.querySelector('meta[name="' + meta + '"]'));
            }
                
            // apply transitions
            if (this.viewTransition) {
                // leave outgoing, enter incoming
                await this.viewTransition.leave(currentViewEl, thisViewEl);
                await this.viewTransition.enter(thisViewEl, currentViewEl);
            } else {
                // default is no transition
                currentViewEl.hidden = true;
                thisViewEl.hidden = false;
            }

            // remove outgoing view
            let parentEl = DOC.getElementById(mainEl);            
            parentEl.removeChild(currentViewEl);
        }

        // add incoming view meta
        for(let meta of this.meta) {
            var metaEl = document.createElement('meta');
            for(let metaAttr in meta) {
                metaEl[metaAttr] = meta[metaAttr];
            }
            DOC.head.appendChild(metaEl);
        }

        // in case there was no previous view
        if (!this.$static.currentView) {
            thisViewEl.hidden = false;
        }

        // update title
        DOC.title = this.title;

        // set new current
        this.$static.currentView = this.name;
        this.$static.currentViewMeta = this.meta;
    };

    $$('static');
    this.currentView = '';

    $$('static');
    this.currentViewMeta = [];
});
