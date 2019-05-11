/**
 * @name VueLayout
 * @description Vue Layout
 */
$$('ns', '(auto)');
Class('(auto)', function() {
    $$('protected');
    this.html = '';

    $$('protected');
    this.style = '';

    // this is the "div-id" (in defined html) where actual view's html will come
    $$('protected');
    this.viewArea = 'view';

    // each area here can be as:
    // { "area: "", component": "", "type": "" } 
    // "area" is the div-id (in defined html) where the component needs to be placed
    // "component" is the name of the component
    // "type" is the qualified component type name
    $$('protectedSet');
    this.areas = [];

    this.merge = async (viewHtml) => {
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

        // root
        let rootEl = DOC.createElement('div');
        if (this.style) {
            let styleEl = DOC.createElement('style');
            styleEl.innerHTML = this.style.trim();
            styleEl.setAttribute('scoped', '');
            rootEl.append(styleEl);
        } 
        if (this.html) {
            let htmlEl = DOC.createElement('div');
            htmlEl.innerHTML = this.html.trim();
            rootEl.append(htmlEl);
        }
        
        // merge view area
        this.viewArea = this.viewArea || 'view'; // inbuilt default value
        let viewAreaEl = rootEl.content.getElementById(this.viewArea);
        if (viewAreaEl) { viewAreaEl.innerHTML = viewHtml; }

        // merge all other areas with component name placeholders
        // each area here can be as:
        // { "area: "", component": "", "type": "" } 
        // "area" is the div-id (in defined html) where the component needs to be placed
        // "component" is the name of the component
        // "type" is the qualified component type name         
        let areaEl = null;
        if (this.layout && this.layout.areas && Array.isArray(this.layout.areas)) {
            for(let area of this.layout.areas) {
                areaEl = rootEl.content.getElementById(area.area);
                if (areaEl) { 
                    let componentEl = DOC.createElement('component');
                    componentEl.setAttribute('is', area.component);
                    areaEl.append(componentEl);
                }
            }
        }       
        
        // done
        return rootEl.innerHTML;
    };
});
