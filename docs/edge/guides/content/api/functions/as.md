as
===

The <code>as</code> function checks if given object has implemented, mixed, or inherited specified type.

Usage
---

&#9746; function |
&#9744; constructor |
&#9744; object |
&#9744; prototype |
&#9744; [type](#/api/misc/types) |
&#9744; [aspect](#/api/aop/aspect) |
&#9744; [attribute](#/api/attributes/attribute) |
&#9746; _global_ namespace member |
&#9746; [flair](#/api/objects/flair) namespace member

### instance of a Class
Checks if given object is a direct or indirect (via inheritance) instance of the specified [Class](#/api/types/class) type.
<pre><code class="javascript">
let Base = Class('Base', function() {
    this.prop('name', 'Base');
});
let Derived = Class('Derived', Base, function() { 
    //
});

let d = new Derived();
let b = as(d, Base);
if (b) {
    console.log(b.name);
}

/* Output:
0: Base
*/
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
