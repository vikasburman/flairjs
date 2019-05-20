const { ViewHandler } = ns('flair.ui');

/**
 * @name View
 * @description GUI View Controller
 */
$$('static');
$$('ns', '(auto)');
Class('(auto)', function() {
    this.current = {
        get: function() { return ViewHandler.currentView; },
        set: function() {}
    };

    $$('readonly');
    this.i18n = settings.client.i18n.enabled;

    $$('overload', 'string');
    this.navigate = function(routeName) {
        return this.navigate(routeName, {});
    };
    $$('overload', 'string, object');
    this.navigate = function(routeName, params) {
        // get url from route
        let url = AppDomain.host().route(routeName, params);

        // pick 404, if not found
        if (!url && routeName !== settings.client.url.routes['404']) { 
            url = AppDomain.host().route(settings.client.url.routes['404'], { notfound: routeName });
        }

        // navigate
        let isFailed = true;
        if (url) {
            if (!(params && params.notfound === url)) {
                isFailed = false;
                if (url.substr(0, 1) === '#') { url = url.substr(1); } // remove #, because it will automatically be added
                setTimeout(() => {
                    window.location.hash = url;
                }, 0);
            }
        } 
        if (isFailed) {
            throw Exception.NotFound(routeName, this.navigate);
        }
    };
});
