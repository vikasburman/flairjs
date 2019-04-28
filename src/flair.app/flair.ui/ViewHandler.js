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
        mainEl = '';

    $$('override');
    this.construct = (base, el, title, transition) => {
        base();

        mainEl = el || 'main';
        this.viewTransition = transition;
        this.title = this.title + (title ? ' - ' + title : '');
    };

    this.init = async () => {
        if (!isInit) {
            isInit = true;

            // give it a unique name
            this.name = this.$self.id + '_' + guid();

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

    $$('privateSet');
    this.viewTransition = '';

    $$('privateSet');
    this.name = '';

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

    this.view = async (ctx) => {
        if (ctx) { // so it do not get executed on component
            // initialize
            await this.init();

            // add view html
            let el = this.append();

            // load view
            this.loadView(ctx);

            // swap views (old one is replaced with this new one)
            await this.swap();
        }
    };

    $$('protected');
    $$('virtual');
    $$('async');
    this.loadView = noop;

    $$('static');
    this.currentView = '';

    $$('static');
    this.currentViewMeta = [];

    $$('private');
    this.append = () => {
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
            let parentEl = DOC.getElementById(mainEl);
            parentEl.appendChild(el);
            
            // return
            return el;
        } 
        return null;
    };

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
});
