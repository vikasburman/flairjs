<!-- nav: api.json -->

as
===

Description
---

The **as** function tries to cast given object in specified interface. It returns _null_ if casting was not successful.


Syntax
---

> castedObject = as(object, interface)

***Parameters:***

* object
    An object that needs to be casted. Only instance objects of [Class](#/api/types/class) types can be casted. 
    * Type: *[Class](#/api/types/class) instance*
interface
    * *string 
    * [Interface](#/api/types/interface) | 


Errors
---
1. Unknown scope: _scope_
    * Given scope string is unknown.
2. Unknown/unsupported interface type: _type_
    * Type of provided interface reference is unknown or is not supported.


Returns
---


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





