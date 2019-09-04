[Flair.js](https://flairjs.com)
---

_True object orientated features for plain vanilla JavaScript_

[![Build Status](https://travis-ci.com/vikasburman/flairjs.svg?branch=master)](https://travis-ci.com/vikasburman/flairjs) 
[![Dependencies](https://david-dm.org/vikasburman/flairjs.svg)](https://david-dm.org/vikasburman/flairjs)
[![Dev Dependencies](https://david-dm.org/vikasburman/flairjs/dev-status.svg)](https://david-dm.org/vikasburman/flairjs?type=dev)
[![Known Vulnerabilities](https://snyk.io/test/github/vikasburman/flairjs/badge.svg?targetFile=package.json)](https://snyk.io/test/github/vikasburman/flairjs?targetFile=package.json) 
[![Issues](http://img.shields.io/github/issues/vikasburman/flairjs.svg)](https://github.com/vikasburman/flairjs/issues)
<br/>
[![MIT license](http://img.shields.io/badge/license-MIT-brightgreen.svg)](http://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/flairjs.svg)](https://badge.fury.io/js/flairjs)
![GitHub top language](https://img.shields.io/github/languages/top/vikasburman/flairjs.svg?color=brightgreen)
![GitHub file size in bytes](https://img.shields.io/github/size/vikasburman/flairjs/dist/flair.min.js.gz.svg?color=brightgreen)
![GitHub last commit](https://img.shields.io/github/last-commit/vikasburman/flairjs.svg)
![GitHub (Pre-)Release Date](https://img.shields.io/github/release-date-pre/vikasburman/flairjs.svg)
[![StackOverflow](http://img.shields.io/badge/stackoverflow-flairjs-brightgreen.svg)](http://stackoverflow.com/questions/tagged/flairjs)


Introduction 
---

JavaScript is everywhere, and its popularity has grown tremendously. There has been several enhancements done in the language to make it more powerful. ES6/ES7 has added several object-oriented features to the language, but the bottleneck has always been the varied support of these features by web browsers, thus restricting their large-scale usage.

Due to rich and long history of JavaScript, several compatibility issues do exists. Expecting to have all awesome object-oriented concepts as they exists in any new languages like C#, Java, etc., is tough. Of course there is TypeScript, but that is another language. Even though it 'compiles' or 'transpiles' to native JavaScript, it is not 'the' JavaScript. 

_Flair.js_ takes the problem head-on and brings majority of the awesomeness of C#/Java features in JavaScript, natively! 

Basic object oriented concepts like, inheritance, encapsulation, polymorphism, events, together with advance features like aspect oriented and attribute based programming, custom attributes, serialization, dependency injection and reflection, etc. are all nicely baked in this JavaScript library. 

Furthermore, all of these are available via pure JavaScript syntax, without any build-time transpilation or compilation of your codebase. What you write, is what gets executed. No change!
                  
The forward-looking and future-proof design of _Flair.js_, plays well with ongoing ECMAScript advancements. While executing your code, it uses available new JavaScript constructs behind the scenes, wherever possible and supported by the environment where the code is running.

_Flair.js_ works in web browsers and in other JavaScript environments like [Node](https://nodejs.org) and [NW.js](https://nwjs.io/).

Features
---
* Pure JavaScript, No external dependencies, ~25k min+gz.
* **Inheritance:** Single inheritance chain, Multiple inheritance via Mixins, Restrictions via 'sealed', etc. 
* **Encapsulation:** True Public, Private and Protected members etc.
* **Polymorphism:** Abstract classes, Interfaces, Method overloading and overriding, Restrictions via 'sealed', Dynamic casting via 'as', etc.
* **Mature Base Types:** Class, Struct, Interface, Mixin, Enum, Exception, Resource, Assembly, AppDomain, etc.
* **Aspect orientation:** Aspect definitions with Before, After and Around advise weaving on methods.
* **Attributes based programming:** Inbuilt system attributes like 'readonly', 'sealed' and many more with full-blown support of defining custom attributes and its usage over class and class members.
* **Dependency injection:** Object life-cycle management via DI container and constructor, method and property injection of other types.
* **Serialization:** Seamless serialization and deserialization of class objects for persistance and transfer.
* **Reflection:** Meta programming made easy with advance reflection support on all live objects and types.
* **Type organization:** Organization of types under individual namespaces and assemblies which are loaded in specific assembly ;load context under primary or secondary app domains.
* **Others:** Singleton, Static classes and members, State storage, Event handling, Async method calls, Auto-disposable objects, deprecate member notifications, Telemetry, Extension ports, etc.

Getting Started
---
**1. Install**

Install using `npm install flairjs` or download [latest release](https://github.com/vikasburman/flairjs/releases/latest). All you need is to have `flair.min.js` available, whatever approach you want to take.


**2. Include**

Include Flair.js in your html page or load it as a module, and initialize.

> There are no external dependencies of this library, therefore feel free to include in whatever order required. However this must be loaded before any `*.js` file which uses Flair.js features, for those to be available.

When using on client side:
```html
<script type="text/javascript" src="path-to-flair/flair.min.js"></script>
```

> Flair.js also support module loaders and can be loaded via `require` or other module loading techniques.

When using on server side:
```javascript
const flair = require('flairjs');
```

**3. Play with Objects**

With flair objects available, JavaScript now has the awesomeness of C#/Java. Define and play with objects.

Here is a very basic example:

```javascript

// note: when code is wrapped in a flair Assembly, such imports are not required
const { Class, $$, event, using } = flair; 

// define Vehicle class
let Vehicle = Class('Vehicle', function() {
    
    // constructor
    this.construct = (capacity) => {
        this.cc = capacity;
        console.log('Vehicle constructed!');    
    };
    
    // property
    this.cc = 0;

    // method
    this.start = () => {
        // raise event with current time of start
        this.started(Date.now());
    };

    // event
    this.started = event((time) => {
        return { when: time }; // event args
    });
});

```

```javascript

// define Car, derived from Vehicle
let Car = Class('Car', Vehicle, function() {
    
    $$('override'); // constructor overriding
    this.construct = (base, model, capacity) => {
        // call base class's constructor
        base(capacity);

        // note: model is readonly, but can still be defined in constructor
        this.model = model;

        // subscribe to started event of base class
        this.started.add(this.onStarted);
        
        console.log('Car constructed!');    
    });

    $$('readonly'); // readonly property
    this.model = '';

    // private event handler
    $$('private');
    this.onStarted = (e) => {
        // read event args, this and parent class properties
        console.log(`${this.model} (${this.cc}cc) ${e.name} at: ${e.args.when}`);
    };

    // dispose car via destructor
    this.dispose = () => {
        console.log('Car disposed!');
    };     
});

```

```javascript

// auto disposable block
using(new Car('SUV', 3000), (suv) => {
    suv.start();
});

```

Executing above code will show following on console: 
```
Vehicle constructed!

Car constructed!

SUV (3000cc) started at: (time)

Car disposed!
```

Explore The Power
---
What you have seen above is the tip of the iceberg. Flair.js adds a lot of firepower to JavaScript that makes building complex JavaScript projects as easy as with C# or Java.

To tap the real power of Flair.js, explore the [Guides](https://flairjs.com/#/guides) to understand concepts and behaviors, [API](https://flairjs.com/#/api) to know details of exposed programming interface for various constructs, and finally [Examples](https://flairjs.com/#/examples) to see working code, showcasing all key concepts in action. 

However, before you delve deep into any of these areas, begin with getting an [Overview](https://flairjs.com/#/overview) first.

Release History
---
See the changelog [here](https://flairjs.com/#/changelog).

License
---
Copyright &copy; 2017-2019 Vikas Burman.<br/>
Released under the terms of the [MIT license](https://github.com/vikasburman/flairjs/blob/master/LICENSE). Authored and maintained by [Vikas Burman](https://www.linkedin.com/in/vikasburman/). 
