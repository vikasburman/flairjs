(() => { let ados = JSON.parse('[{"name":"flair.app","file":"./flair.app{.min}.js","mainAssembly":"flair","desc":"True Object Oriented JavaScript","title":"Flair.js","version":"0.31.12","lupdate":"Mon, 29 Apr 2019 19:11:05 GMT","builder":{"name":"<<name>>","version":"<<version>>","format":"fasm","formatVersion":"1","contains":["initializer","functions","types","enclosureVars","enclosedTypes","resources","assets","routes","selfreg"]},"copyright":"(c) 2017-2019 Vikas Burman","license":"MIT","types":["flair.app.Bootware","flair.app.App","flair.app.Host","flair.app.Handler","flair.api.RestHandler","flair.api.RestInterceptor","flair.app.BootEngine","flair.app.ClientHost","flair.app.ServerHost","flair.boot.DIContainer","flair.boot.Middlewares","flair.boot.NodeEnv","flair.boot.ResHeaders","flair.boot.Router","flair.ui.ViewHandler","flair.ui.ViewInterceptor","flair.ui.ViewState","flair.ui.ViewTransition"],"resources":[],"assets":[],"routes":[]},{"name":"flair.ui","file":"./flair.ui{.min}.js","mainAssembly":"flair","desc":"True Object Oriented JavaScript","title":"Flair.js","version":"0.31.12","lupdate":"Mon, 29 Apr 2019 19:11:06 GMT","builder":{"name":"<<name>>","version":"<<version>>","format":"fasm","formatVersion":"1","contains":["initializer","functions","types","enclosureVars","enclosedTypes","resources","assets","routes","selfreg"]},"copyright":"(c) 2017-2019 Vikas Burman","license":"MIT","types":["flair.ui.vue.VueComponentMembers","flair.ui.vue.VueComponent","flair.ui.vue.VueDirective","flair.ui.vue.VueFilter","flair.ui.vue.VueLayout","flair.ui.vue.VueMixin","flair.ui.vue.VuePlugin","flair.ui.vue.VueSetup","flair.ui.vue.VueView"],"resources":[],"assets":[],"routes":[{"name":"flair.ui.vue.test2","mount":"main","index":101,"verbs":[],"path":"test/:id","handler":"abc.xyz.Test"},{"name":"flair.ui.vue.exit2","mount":"main","index":103,"verbs":[],"path":"exit","handler":"abc.xyz.Exit"}]}]');
const flair = (typeof global !== 'undefined' ? require('flairjs') : (typeof WorkerGlobalScope !== 'undefined' ? WorkerGlobalScope.flair : window.flair));
flair.AppDomain.registerAdo(...ados);}
)();
