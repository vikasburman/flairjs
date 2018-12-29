[![Build Status](https://travis-ci.com/vikasburman/flairjs.svg?branch=master)](https://travis-ci.com/vikasburman/flairjs) 
[![Known Vulnerabilities](https://snyk.io/test/github/vikasburman/flairjs/badge.svg?targetFile=package.json)](https://snyk.io/test/github/vikasburman/flairjs?targetFile=package.json) 
[![npm version](https://badge.fury.io/js/flairjs.svg)](https://badge.fury.io/js/flairjs)

[FlairJS](https://flairjs.com)
===
> **Powerful .Net/Java style object oriented concepts in plain vanilla JavaScript**

Introduction
---
All basic object oriented concepts like, inheritance, encapsulation, polymorphism, events, together with advance features like aspect oriented and attribute based programming, custom attributes, serialization, 
dependency injection and reflection, etc. are all nicely baked in this tiny javascript library.
All of these are available via pure JavaScript syntax, without any build-time transpilation or compilation 
of your codebase.
                  
The forward-looking and future-proof design of the library, plays well with ongoing Ecmascript advancements, and uses available new JavaScript constructs behind the scenes, wherever possible and supported.

This works in web browsers and in other JavaScript environments like [Node](https://nodejs.org) and [NW.js](https://nwjs.io/).

Features
---
* Pure JavaScript
* No external dependencies in core engine
* Supports *all* CSS features *as-is* (including experimental ones)

Getting Started
---
**1. Install**

Install using `bower install JS3` or download [latest release](https://github.com/vikasburman/js3/releases). All you need is to have `JS3.min.js` available, whatever approach you want to take.

**2. Include**

Include JS3 engine in your html page.

> There are no external dependencies of the core engine of this library, therefore feel free to include in whatever order required. However this must be included before any `*.js3` file or any JS3 extension is being included.  

```html
<script type="text/javascript" src="path/JS3.min.js"></script>

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