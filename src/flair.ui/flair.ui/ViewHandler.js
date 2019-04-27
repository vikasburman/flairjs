const { Handler } = ns('flair.app');
const { ViewTransition } = ns('flair.ui');

/**
 * @name ViewHandler
 * @description GUI View Handler
 */
$$('ns', '(auto)');
Class('(auto)', Handler, function() {
    let isInit = false,
        isMounted = false,
        parentEl = null;

    this.init = async () => {
        if (!isInit) {
            isInit = true;

            // give it a unique name
            this.name = this.$self.id + '_' + guid();

            // define main el
            parentEl = DOC.getElementById(settings.el || 'main');

            // get port
            let clientFileLoader = Port('clientFile');  

            // load style content in property
            if (this.style && this.style.endsWith('.css')) { // if style file is defined via $$('asset', '<fileName>');
                this.style = await clientFileLoader(this.style);
            }

            // load html content in property
            if (this.html && this.html.endsWith('.html')) { // if html file is defined via $$('asset', '<fileName>');
                this.html = await clientFileLoader(this.html);
            }

            // load view transition
            if (this.viewTransition) {
                let ViewTransitionType = as(await include(this.viewTransition), ViewTransition);
                if (ViewTransitionType) {
                    this.viewTransition = new ViewTransitionType();
                } else {
                    this.viewTransition = '';
                }
            }
        }
    };

    $$('protectedSet');
    this.viewTransition = settings.viewTransition;

    $$('privateSet');
    this.name = "";

    $$('protectedSet');
    this.title = '';

    $$('protected');
    this.style = '';

    $$('protected');
    this.html = '';

    // each meta in array can be defined as:
    // { "<nameOfAttribute>": "<contentOfAttribute>", "<nameOfAttribute>": "<contentOfAttribute>", ... }
    $$('protectedSet');
    this.meta = null;

    $$('virtual');
    $$('async');
    this.view = noop;

    $$('static');
    this.currentView = '';

    $$('static');
    this.currentViewMeta = [];

    $$('protected');
    this.mount = () => {
        if (!isMounted) {
            isMounted = true;

            // main node
            let el = DOC.createElement('div');
            el.id = this.name;
            el.setAttribute('hidden', '');

            // add style node
            if (this.style) {
                let styleEl = DOC.createElement('style');
                styleEl.setAttribute('scoped', '');
                styleEl.innerText = this.style.trim();
                el.appendChild(styleEl);
            } 

            // add html node
            let htmlEl = DOC.createElement('div'); 
            htmlEl.innerHTML = this.html.trim();
            el.appendChild(htmlEl);

            // add to parent
            parentEl.appendChild(el);
        }
    };

    $$('protected');
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

            // unmount outgoing view
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
        if (settings.title) {
            DOC.title += ' - ' + settings.title;
        }

        // set new current
        this.$static.currentView = this.name;
        this.$static.currentViewMeta = this.meta;
    };
});
