[![Build Status](https://travis-ci.com/vikasburman/flairjs.svg?branch=master)](https://travis-ci.com/vikasburman/flairjs) 
[![Known Vulnerabilities](https://snyk.io/test/github/vikasburman/flairjs/badge.svg?targetFile=package.json)](https://snyk.io/test/github/vikasburman/flairjs?targetFile=package.json) 
[![npm version](https://badge.fury.io/js/flairjs.svg)](https://badge.fury.io/js/flairjs)

[FlairJS](https://flairjs.com)
===
> **Powerful .Net/Java style object oriented concepts in plain vanilla JavaScript**

Introduction
---

JavaScript is everywhere, and its popularity has grown tremendously. There has been several enhancements done in the language to make it more powerful. ES6/ES7 has added several object-oriented features to the language, but the bottleneck has always been the varied support of these features by web browsers, thus restricting their large-scale usage.


Besides, due to rich and long history of JavaScript, several compatibility issues do exists. Expecting to have all awesome object-oriented concepts as they exists in any new languages like C#, Java, etc., is tough.

_FlairJS_ takes the problem head-on and brings majority of the awesomeness of C#/Java features in JavaScript, natively! Basic object oriented concepts like, inheritance, encapsulation, polymorphism, events, together with advance features like aspect oriented and attribute based programming, custom attributes, serialization, 
dependency injection and reflection, etc. are all nicely baked in this tiny JavaScript library.

All of these are available via pure JavaScript syntax, without any build-time transpilation or compilation 
of your codebase.
                  
The forward-looking and future-proof design of the library, plays well with ongoing Ecmascript advancements, and uses available new JavaScript constructs behind the scenes, wherever possible and supported.

This works in web browsers and in other JavaScript environments like [Node](https://nodejs.org) and [NW.js](https://nwjs.io/).

Features
---
* Pure JavaScript, No external dependencies, ~40k minified.
* **Inheritance:** Single inheritance chain, Multiple inheritance via Mixins, Restrictions via 'sealed', etc.
* **Encapsulation:** True Public, Private and Protected members etc.
* **Polymorphism:** Abstract classes, Interfaces, Method overriding, Restrictions via 'sealed', Dynamic casting via 'as', etc.
* **Mature Base Types:** Class, Structure, Interface, Mixin, Enum, Assembly, etc.
* **Aspect orientation:** Aspect definitions with Before, After and Around advise weaving on methods and properties.
* **Attributes based programming:** Inbuilt system attributes like 'readonly', 'sealed' and many more with full-blown support of defining custom attributes and its usage over class and class members.
* **Dependency injection:** Object life-cycle management via DI container and constructor, method and property injection of registered types.
* **Serialization:** Seamless serialization and deserialization of class objects for persistance and transfer.
* **Reflection:** Meta programming made easy with advance reflection support on all live objects and base types.
* **Type organization:** Organization of types under individual assemblies and namespaces.
* **Others:** Event handling, Async method calls, Auto-disposable objects, deprecate member notifications, etc.

Getting Started
---
**1. Install**

Install using `npm install flairjs` or download [latest release](https://github.com/vikasburman/flairjs/releases/latest). All you need is to have `flairjs.min.js` available, whatever approach you want to take.

**2. Include**

Include FlairJS in your html page.

> There are no external dependencies of this library, therefore feel free to include in whatever order required. However this must be loaded before any `*.js` file which uses FlairJS features, for them to be available.

```html
<script type="text/javascript" src="path/flairjs.min.js"></script>

> FlairJS also support module loaders and can also be loaded via `require` or other module loading techniques.

**3. Load `*.js3` files**

A `*.js3` file can be seen as a javascript counterpart of a `*.css` file. With JS3, instead of writing `.css` you would be writing `.js3` files, which are pure javascript files. These can be loaded like any other javascript file (including using any loader such as yepnope).

```html
<script type="text/javascript" src="path/styles1.js3"></script>
<script type="text/javascript" src="path/styles2.js3"></script>
```

> Although creating a `.js3` file is recommended for clean code separation, it is possible that you write your stylesheet code directly in any javascript file of yours. 

> No matter how they are defined or loaded, all js3 objects will be able to see each other and can share style information at runtime.

That's all is needed to start using the power of JS3.

Create your first `.js3` file
---
Creating a `.js3` file is simply writing bunch of javascript code lines. Each `js3` file gets loaded on global `JS3` object by its name. Here is a quick example:

```javascript

JS3.define('demo1', function() {
	// define prefixes
	prefixes('-moz-', '-webkit-');
	
	// define variables
	vars('lightColor', color('yellow')).tint(.9);
	vars('borderColor', color('lightgray')); 
	vars({ 		
        size: 11,
```