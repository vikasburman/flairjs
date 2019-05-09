/**
 * @preserve
 * Preamble for assemblies at: <<path>>
 * Created: <<lupdate>>
 */
(() => {
    const flair = (typeof global !== 'undefined' ? require('flairjs') : (typeof WorkerGlobalScope !== 'undefined' ? WorkerGlobalScope.flair : window.flair));
    flair.AppDomain.registerAdo(...JSON.parse('<<ados>>'));
})();