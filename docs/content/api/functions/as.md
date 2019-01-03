<!-- nav: api.json -->

as
===

The **as** function has dual use. It can either return the private or protected variant of the object or can check if given object implements/mixed/inherits specified type. 


Usage
---


```javascript

// Example 1: if car is an instance of Vehicle Class
let vehicle = as(car, Vehicle);

// Example 2: if car has SportsCar Mixin features
let sportsCar = as(car, SportsCar);

// Example 3: if car implements ITurbo Interface
let turboChargedCar = as(car, ITurbo);

// WARNING: Following two examples are for advanced framework usage, and can be deprecated 
// or replaced without notice. Avoid using them.

// Example 4: access private members of car object
let prvCar = as(car, 'private');

// Example 5: access protected and private members of car object
let proCar = as(car, 'protected');

```

Syntax
---

***as(object, interface)***

**Parameters:**

* object
    An object that needs to be casted. Only instance objects of [Class](#/api/types/class) types can be casted. 
    * Type: *[Class](#/api/types/class) instance*
interface
    * *string 
    * [Interface](#/api/types/interface) | 


Returns
---

Exceptions
---

Code | Message | Description
-----|---------|------------
FASX01 | Unknown scope type: _scope_ | Given scope type is unknown.
FASX02 | Unknown/unsupported interface type: _type_ | Type of provided interface reference is unknown or is not supported.

Properties
---

None.


Methods
---

None.

Inheritance
---

This is a native JavaScript function.

Access
---

If flair is initialized with ***supressGlobals: true***, this will be available only via [flair](#/api/objects/flair) object, otherwise it will be available in global namespace of JavaScript environment.





