as
===

The <code>as</code> function checks if given object has implemented, mixed, or inherited specified type.

Usage
---

&#9746; as function |
&#9744; as constructor |
&#9744; as object |
&#9744; as prototype |
&#9744; as [type](#/api/misc/types) |
&#9744; as [aspect](#/api/aop/aspect) |
&#9744; as [attribute](#/api/attributes/attribute) |
&#9746; as _global_ namespace member |
&#9746; as [flair](#/api/objects/flair) namespace member

### instance of a Class
Checks if given object is a direct or indirect (via inheritance) instance of the specified [Class](#/api/types/class) type.
<pre><code class="javascript">
let vehicle = as(car, Vehicle);
if (vehicle) {
    // .. do something that is generic to Vehicle Class
}
</code></pre>
This can also be checked via [isInstanceOf](#/api/functions/isInstanceOf) function. _as_ gives a unified implementation for variety of such checks.
### mixed from a Mixin
Checks if specified [Mixin](#/api/types/mixin) type was mixed on this object directly or indirectly (via inheritance).
<pre><code class="javascript">
let sportsCar = as(car, SportsCar);
if (sportsCar) {
    //.. do something that is available on SportsCar Mixin
}
</code></pre>
This can also be checked via [isMixed](#/api/functions/isMixed) function. _as_ gives a unified implementation for variety of such checks.
### implements an Interface
Checks if specified [Interface](#/api/types/interface) type was implemented on this object directly or indirectly (via inheritance).
<pre><code class="javascript">
let turboChargedCar = as(car, ITurbo);
if (turboChargedCar) {
    //.. do something that is available on ITurbo Interface
}
</code></pre>
This can also be checked via [isImplements](#/api/functions/isImplements) function. _as_ gives a unified implementation for variety of such checks.

Syntax
---

###<code>as(object, type)</code>

### Parameters

* **_object_**: An object that needs to be validated for casting. Only instance objects of [Class](#/api/types/class) types can be checked. 
* **_type_**: A [Class](#/api/types/class), [Mixin](#/api/types/mixin) or [Interface](#/api/types/interface) type for which given object needs to be validated.

### Returns

* **object**: Returns the same object if casting was successfully validated.
* **null**: Returns _null_, if casting could not be validated.

### Exceptions

* **FASX01**: _Unknown/unsupported object type: {type}_ - Given object type is unknown or is not supported.
* **FASX02**: _Unknown/unsupported interface type: {type}_ - Type of provided interface reference is unknown or is not supported.

Examples
---
* Cast as Interfece
* Cast as Mixin
* Cast as Class
