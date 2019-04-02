const { Bootware } = ns('flair.app');

/**
 * @name DIContainer
 * @description Initialize DI Container
 */
$$('sealed');
$$('ns', '(auto)');
Class('(auto)', Bootware, function() {
    $$('override');
    this.construct = (base) => {
        base('DI Container');
    };

    $$('override');
    this.boot = async () => {
        let containerItems = settings.container;
        for(let alias in containerItems) {
            if (containerItems.hasOwnProperty(alias)) {
                Container.register(alias, containerItems[alias]);
            }
        }
    };
});
