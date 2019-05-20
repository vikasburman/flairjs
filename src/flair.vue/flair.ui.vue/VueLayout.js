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
    // "area" is the placeholder-text where the component needs to be placed
    // "area" placeholder can be defined as: [[area_name]]
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

        // merge html and style
        if (this.html && this.style) { // merge style as scoped style
            this.html = '<div><style scoped>' + this.style.trim() +'</style>' + this.html.trim() + '</div>';
        } else if (this.style) {
            this.html = '<div><style scoped>' + this.style.trim() +'</style></div>';
        }        
        
        // inject components
        let layoutHtml = this.html;
        if (this.areas && Array.isArray(this.areas)) {
            for(let area of this.areas) {
                layoutHtml = replaceAll(layoutHtml, `[[${area.area}]]`, `<component is="${area.component}"></component>`);
            }
        }       

        // inject view 
        layoutHtml = layoutHtml.replace(`[[${this.viewArea}]]`, viewHtml);

        // done
        return layoutHtml;
    };
});
