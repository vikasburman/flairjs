// activate material design
$(document).ready(function() { $('body').bootstrapMaterialDesign(); });

// apply hyperlinks
$(document).ready(function() { 
    let currentVersion = 'edge',
        host = location.origin;
    $(".medium").attr("href", "https://medium.com/have-a-flair");
    $(".github").attr("href", "https://github.com/vikasburman/flairjs");
    $(".twitter").attr("href", "https://twitter.com/flairjslib");
    $(".linkedin").attr("href", "https://www.linkedin.com/in/vikasburman/");
    $(".license").attr("href", "https://github.com/vikasburman/flairjs/blob/master/LICENSE");
    $(".changelog").attr("href", "https://github.com/vikasburman/flairjs/blob/master/CHANGELOG.md");
    $(".npm").attr("href", "https://www.npmjs.com/package/flairjs");
    $(".cdn").attr("href", "https://cdn.jsdelivr.net/npm/flairjs");
    $(".releases").attr("href", "https://github.com/vikasburman/flairjs/releases");
    $(".roadmap").attr("href", "https://github.com/vikasburman/flairjs/projects/2");
    $(".home").attr("href", `${host}/`)
    $(".guides").attr("href", `${host}/${currentVersion}/guides/`);
    $(".setup").attr("href", `${host}/${currentVersion}/guides/#/essentials/setup`);
    $(".api").attr("href", `${host}/${currentVersion}/api/`);
    $(".demo").attr("href", `${host}/${currentVersion}/examples/`);
    $(".start").attr("href", `${host}/${currentVersion}/guides/#/essentials/introduction`);
  });

