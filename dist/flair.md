<span name="header" id="asm_header">

<small><b>
[Flair.js](https://flairjs.com) - True Object Oriented JavaScript
</b><small></br>
Copyright &copy; 2017-2020 Vikas Burman. Distributed under MIT.
</small></small>

</span>
<span name="assembly" id="asm_info">

# Assembly: <u>flair</u>
<small>
Version 0.63.95 | Thu, 27 Feb 2020 02:32:59 GMT
<br/>

[flair.js](./flair.js) (364k, 97k [minified](./dist/flair.min.js), 27k [gzipped](./dist/flair.min.js.gz))
</small>
<br/>

[Namespaces](#namespaces) &nbsp;||&nbsp; [Types](#types) &nbsp;||&nbsp; [Resources](#resources) &nbsp;||&nbsp; [Assets](#assets) &nbsp;||&nbsp; [Routes](#routes)

</span> <span name="ns" id="asm_ns">
</br>

## Namespaces 
<small><div style="text-align: right"><a href="#asm_info">[&nwarr;]</a></div></small>

Namespace | Description
:---|:---
(root) | 
ns1.ns2 | This is the namespace description.


</span>
<span name="types" id="asm_types">
</br>

## Types
<small><div style="text-align: right"><a href="#asm_info">[&nwarr;]</a></div></small>

Name | Description
:---|:---
**Classes** | 
<a href="#Task">Task</a> &nbsp; ` static ` | Task base class
**Interfaces** | 
<a href="#IAspect">IAspect</a> | Aspect definition
<a href="#IAttribute">IAttribute</a> | Attribute definition
<a href="#IDisposable">IDisposable</a> | Disposable definition
<a href="#IPortHandler">IPortHandler</a> | Port handler definition
<a href="#IProgressReporter">IProgressReporter</a> | Progress reporter definition



</br>
<h3 id="Task"><a href="#types">Task</a></h3>

`Class` [public, static] &nbsp; 

***

Task base class



**Remarks**

This class represents a background thread executable task class

Tasks can be executed in blah blah manner and data can be transferred too


**Example**

This example defines how the task code can be executed

```javascript
let task = new Task();
let result = await task.run();
```


**Additional Information**

* _Since:_ 1.2.23

</br>
<h3 id="IAspect"><a href="#types">IAspect</a></h3>

`Interface` [public] &nbsp; 

***

Aspect definition



<span id="IAspect:members">**Members**</span>

Name | Description
:---|:---
**Functions** | 
<a href="#IAspect.after.object.">after(object)</a>| After advise
<a href="#IAspect.before.object.">before(object)</a> &nbsp; ` static `| Before advise


**Remarks**

TODO: define the before and after relationship for achieving around
TODO: explain structure and usage of ctx object


**Functions**



<span id="IAspect.after.object."><a href="#IAspect:members">**after(object)**</a></span> [public] &nbsp; 
> After advise
>
> **Parameters**
>
> * ctx &nbsp; ` object ` &nbsp; Context object that is shared across weaving
>
> **Returns**
>
> ` void ` &nbsp; 
>
> **Additional Information**
>
> * _Optional:_ This member is optional and interface's compliance will pass even if this member is not implemented by the class.
>


<span id="IAspect.before.object."><a href="#IAspect:members">**before(object)**</a></span> [public, static] &nbsp; 
> Before advise
>
> **Parameters**
>
> * ctx &nbsp; ` object ` &nbsp; Context object that is shared across weaving
>
> **Returns**
>
> ` void ` &nbsp; 
>


</br>
<h3 id="IAttribute"><a href="#types">IAttribute</a></h3>

`Interface` [public] &nbsp; 

***

Attribute definition



<span id="IAttribute:members">**Members**</span>

Name | Description
:---|:---
**Properties** | 
<a href="#IAttribute.constraints">constraints</a>| An expression that defined the constraints of applying this attribute
<a href="#IAttribute.name">name</a>| Name of the custom attribute
**Functions** | 
<a href="#IAttribute.decorateEvent.string.string.function.">decorateEvent(string, string, function)</a>| Event decorator
<a href="#IAttribute.decorateFunction.string.string.function.">decorateFunction(string, string, function)</a>| Function decorator
<a href="#IAttribute.decorateProperty.string.string.object.">decorateProperty(string, string, object)</a>| Property decorator


**Remarks**

TODO:


**Example**

TODO: example


**Properties**



<span id="IAttribute.constraints"><a href="#IAttribute:members">**constraints**</a></span> [public] &nbsp; 
> ` string ` &nbsp; An expression that defined the constraints of applying this attribute
>
> **Remarks**
>
> Using NAMES, SUFFIXES, PREFIXES, and logical Javascript operator
> 
> NAMES can be:
> type names: class, struct, enum, interface, mixin
> type member names: prop, func, construct, dispose, event
> inbuilt modifier names: static, abstract, sealed, virtual, override, private, protected, readonly, async, etc.
> inbuilt attribute names: promise, singleton, serialize, deprecate, session, state, conditional, noserialize, etc.
> custom attribute names: any registered custom attribute name
> type names itself: e.g., Aspect, Attribute, etc. (any registered type name is fine)
> 
> SUFFIX: A typename must have a suffix (^) e.g., Aspect^, Attribute^, etc. Otherwise this name will be treated as custom attribute name
> 
> PREFIXES can be:
> No Prefix: means it must match or be present at the level where it is being defined
> @: means it must be inherited from or present at up in hierarchy chain
> $: means it either must ne present at the level where it is being defined or must be present up in hierarchy chain
> <name> | @<name> | $<name>
> BOOLEAN Not (!) can also be used to negate:
> !<name> | !@<name> | !$<name>
> 
> NOTE: Constraints are processed as logical boolean expressions and can be grouped, ANDed or ORed as:
> AND: <name1> && <name2> && ...
> OR: <name1> || <name2>
> GROUPING: ((<name1> || <name2>) && (<name1> || <name2>))
> (((<name1> || <name2>) && (<name1> || <name2>)) || <name3>)
> >


<span id="IAttribute.name"><a href="#IAttribute:members">**name**</a></span> [public] &nbsp; 
> ` string ` &nbsp; Name of the custom attribute
>


**Functions**



<span id="IAttribute.decorateEvent.string.string.function."><a href="#IAttribute:members">**decorateEvent(string, string, function)**</a></span> [public] &nbsp; 
> Event decorator
>
> **Parameters**
>
> * typeName &nbsp; ` string ` &nbsp; Name of the type
> * memberName &nbsp; ` string ` &nbsp; Name of the member
> * member &nbsp; ` function ` &nbsp; Event argument processor function
>
> **Returns**
>
> ` function ` &nbsp; Returns decorated function
>
> **Remarks**
>
> TODO: decorated function must accept ...args and pass-it on (with/without processing) to member function
> >
> **Example**
>
> decorateEvent(typeName, memberName, member)
> >
> **Additional Information**
>
> * _Optional:_ This member is optional and interface's compliance will pass even if this member is not implemented by the class.
>


<span id="IAttribute.decorateFunction.string.string.function."><a href="#IAttribute:members">**decorateFunction(string, string, function)**</a></span> [public] &nbsp; 
> Function decorator
>
> **Parameters**
>
> * typeName &nbsp; ` string ` &nbsp; Name of the type
> * memberName &nbsp; ` string ` &nbsp; Name of the member
> * member &nbsp; ` function ` &nbsp; Member function to decorate
>
> **Returns**
>
> ` function ` &nbsp; Returns decorated function
>
> **Remarks**
>
> TODO: decorated function must accept ...args and pass-it on (with/without processing) to member function
> >
> **Example**
>
> decorateFunction(typeName, memberName, member)
> >
> **Additional Information**
>
> * _Deprecated:_ hshshs
> * _Optional:_ This member is optional and interface's compliance will pass even if this member is not implemented by the class.
>


<span id="IAttribute.decorateProperty.string.string.object."><a href="#IAttribute:members">**decorateProperty(string, string, object)**</a></span> [public] &nbsp; 
> Property decorator
>
> **Parameters**
>
> * typeName &nbsp; ` string ` &nbsp; Name of the type
> * memberName &nbsp; ` string ` &nbsp; Name of the member
> * member &nbsp; ` object ` &nbsp; Member descriptor's getter, setter functions
>
> **Returns**
>
> ` object ` &nbsp; Returns decorated getter, setter functions
>
> **Remarks**
>
> Decorated get must call member's get function and decorated set must accept `value` argument and pass it to member's set with or without processing
> >
> **Example**
>
> decorateProperty(typeName, memberName, member)
> >
> **Additional Information**
>
> * _Optional:_ This member is optional and interface's compliance will pass even if this member is not implemented by the class.
>


</br>
<h3 id="IDisposable"><a href="#types">IDisposable</a></h3>

`Interface` [public] &nbsp; 

***

Disposable definition



</br>
<h3 id="IPortHandler"><a href="#types">IPortHandler</a></h3>

`Interface` [public] &nbsp; 

***

Port handler definition



</br>
<h3 id="IProgressReporter"><a href="#types">IProgressReporter</a></h3>

`Interface` [public] &nbsp; 

***

Progress reporter definition





</span>
<span name="resources" id="asm_resources">
</br>

## Resources
<small><div style="text-align: right"><a href="#asm_info">[&nwarr;]</a></div></small>

Name | Description
:---|:---
master &nbsp; ` Layout ` | &nbsp;
vikas &nbsp; ` Document ` | Test resource document
ns1.ns2.master &nbsp; ` Layout ` | &nbsp;


</span>
<span name="assets" id="asm_assets">
</br>

## Assets
<small><div style="text-align: right"><a href="#asm_info">[&nwarr;]</a></div></small>
Assets are located under: [./flair/](./flair/)

Name | Description
:---|:---
[burman.md](./flair/burman.md)   | 
[ns1.ns2.hello.md](./flair/ns1.ns2.hello.md)   | 
[abc/abc.txt](./flair/abc/abc.txt)   | some information only
[views/l2.html](./flair/views/l2{.min}.html)   | 
[views/ns1.ns2.l1.html](./flair/views/ns1.ns2.l1{.min}.html)  &nbsp; ` View `  | 


</span>
<span name="routes" id="asm_routes">
</br>

## Routes
<small><div style="text-align: right"><a href="#asm_info">[&nwarr;]</a></div></small>

Name | Route | Description
:---|:---|:---|
now | {api_v1} /now/:type? &nbsp;  ` get `  | some desc


</span>
<span name="extra" id="asm_extra">
</br>



</span>
<span name="footer" id="asm_footer">

</br>
---
<small><small>
Built with flairBuild (v1) using fasm (v1) format.

<div style="text-align: right"><a href="#asm_info">[&nwarr;]</a></div>
</small></small>

</span>