## Classes

<dl>
<dt><a href="#Exception">Exception</a></dt>
<dd></dd>
</dl>

## Members

<dl>
<dt><a href="#noop">noop</a></dt>
<dd><p>No Operation function</p>
</dd>
<dt><a href="#nip">nip</a></dt>
<dd><p>Not Implemented Property</p>
</dd>
<dt><a href="#nim">nim</a></dt>
<dd><p>Not Implemented Method</p>
</dd>
<dt><a href="#typeOf">typeOf</a> ⇒ <code>string</code></dt>
<dd><p>Finds the type of given object in flair type system</p>
</dd>
<dt><a href="#is">is</a> ⇒ <code>boolean</code></dt>
<dd><p>Checks if given object is of a given type</p>
</dd>
<dt><a href="#is">is</a> ⇒ <code>boolean</code></dt>
<dd><p>Checks if given object has specified member defined</p>
</dd>
<dt><a href="#Args">Args</a> ⇒ <code>function</code></dt>
<dd><p>Lightweight args pattern processing that returns a validator function to validate arguments against given arg patterns</p>
</dd>
<dt><a href="#event">event</a> ⇒ <code>function</code></dt>
<dd><p>Event marker</p>
</dd>
<dt><a href="#nie">nie</a></dt>
<dd><p>Not Implemented Event</p>
</dd>
<dt><a href="#Dispatcher">Dispatcher</a></dt>
<dd><p>Event dispatching.</p>
</dd>
<dt><a href="#InjectedArg">InjectedArg</a></dt>
<dd><p>An argument that is injected by a custom attribute OR an advise</p>
</dd>
<dt><a href="#Port">Port</a></dt>
<dd><p>Customize configurable functionality of the core. This gives a way to configure a different component to
             handle some specific functionalities of the core, e.g., fetching a file on server, or loading a module on
             client, or handling sessionStorage, to name a few.
             Ports are defined by a component and handlers of required interface (complies, not implements) types can be 
             supplied from outside as per usage requirements</p>
</dd>
<dt><a href="#AssemblyLoadContext">AssemblyLoadContext</a></dt>
<dd><p>The isolation boundary of type loading across assemblies.</p>
</dd>
<dt><a href="#Assembly">Assembly</a></dt>
<dd><p>Assembly object.</p>
</dd>
<dt><a href="#Resource">Resource</a></dt>
<dd><p>Resource object.</p>
</dd>
<dt><a href="#Route">Route</a></dt>
<dd><p>Route object.</p>
</dd>
<dt><a href="#SharedChannel">SharedChannel</a></dt>
<dd><p>Shared channel that communicates between two threads.</p>
</dd>
<dt><a href="#AppDomainProxy">AppDomainProxy</a></dt>
<dd><p>Proxy to AppDomain that is created inside other worker.</p>
</dd>
<dt><a href="#AssemblyLoadContextProxy">AssemblyLoadContextProxy</a></dt>
<dd><p>Proxy of the AssemblyLoadContext that is created inside other AppDomain.</p>
</dd>
<dt><a href="#AppDomain">AppDomain</a></dt>
<dd><p>Thread level isolation.</p>
</dd>
<dt><a href="#getAttr">getAttr</a> ⇒ <code><a href="#IAttribute">Array.&lt;IAttribute&gt;</a></code></dt>
<dd><p>Gets the attributes for given object or Type.</p>
</dd>
<dt><a href="#getAssembly">getAssembly</a> ⇒ <code>object</code></dt>
<dd><p>Gets the assembly of a given flair type/instance</p>
</dd>
<dt><a href="#getAssemblyOf">getAssemblyOf</a> ⇒ <code>string</code></dt>
<dd><p>Gets the assembly file of a given flair type</p>
</dd>
<dt><a href="#getContext">getContext</a> ⇒ <code>object</code></dt>
<dd><p>Gets the assembly load context where a given flair type is loaded</p>
</dd>
<dt><a href="#getResource">getResource</a> ⇒ <code>object</code></dt>
<dd><p>Gets the registered resource from default assembly load context of default appdomain
but for possible alias names, it also checks DI container, if resource is not found</p>
</dd>
<dt><a href="#getRoute">getRoute</a> ⇒ <code>object</code></dt>
<dd><p>Gets the registered route from default assembly load context of default appdomain</p>
</dd>
<dt><a href="#getType">getType</a> ⇒ <code>object</code></dt>
<dd><p>Gets the flair Type from default assembly load context of default appdomain
but for possible alias names, it also checks DI container, if type is not found</p>
</dd>
<dt><a href="#getTypeOf">getTypeOf</a> ⇒ <code>type</code></dt>
<dd><p>Gets the underlying type which was used to construct this object</p>
</dd>
<dt><a href="#getTypeName">getTypeName</a> ⇒ <code>string</code></dt>
<dd><p>Gets the name of the underlying type which was used to construct this object</p>
</dd>
<dt><a href="#ns">ns</a> ⇒ <code>object</code></dt>
<dd><p>Gets the registered namespace from default assembly load context of default appdomain</p>
</dd>
<dt><a href="#isDerivedFrom">isDerivedFrom</a> ⇒ <code>boolean</code></dt>
<dd><p>Checks if given flair class type is derived from given class type, directly or indirectly</p>
</dd>
<dt><a href="#isAbstract">isAbstract</a> ⇒ <code>boolean</code></dt>
<dd><p>Checks if given flair class type is abstract.</p>
</dd>
<dt><a href="#isSealed">isSealed</a> ⇒ <code>boolean</code></dt>
<dd><p>Checks if given flair class type is sealed.</p>
</dd>
<dt><a href="#isStatic">isStatic</a> ⇒ <code>boolean</code></dt>
<dd><p>Checks if given flair class type is static.</p>
</dd>
<dt><a href="#isSingleton">isSingleton</a> ⇒ <code>boolean</code></dt>
<dd><p>Checks if given flair class type is singleton.</p>
</dd>
<dt><a href="#isDeprecated">isDeprecated</a> ⇒ <code>boolean</code></dt>
<dd><p>Checks if given flair class type is deprecated.</p>
</dd>
<dt><a href="#isInstanceOf">isInstanceOf</a> ⇒ <code>boolean</code></dt>
<dd><p>Checks if given flair class/struct instance is an instance of given class/struct type or
             if given class instance implements given interface or has given mixin mixed somewhere in class
             hierarchy</p>
</dd>
<dt><a href="#as">as</a> ⇒ <code>object</code></dt>
<dd><p>Checks if given object can be consumed as an instance of given type</p>
</dd>
<dt><a href="#isComplies">isComplies</a> ⇒ <code>boolean</code></dt>
<dd><p>Checks if given object complies to given flair interface</p>
</dd>
<dt><a href="#isImplements">isImplements</a> ⇒ <code>boolean</code></dt>
<dd><p>Checks if given flair class/struct instance or class/struct implements given interface</p>
</dd>
<dt><a href="#isMixed">isMixed</a> ⇒ <code>boolean</code></dt>
<dd><p>Checks if given flair class/struct instance or class/struct has mixed with given mixin</p>
</dd>
<dt><a href="#bring">bring</a> ⇒ <code>void</code></dt>
<dd><p>Fetch, load and/or resolve an external dependency for required context</p>
</dd>
<dt><a href="#include">include</a> ⇒ <code>Promise</code></dt>
<dd><p>bring the required dependency</p>
</dd>
<dt><a href="#dispose">dispose</a> ⇒ <code>void</code></dt>
<dd><p>Call dispose of given flair object</p>
</dd>
<dt><a href="#using">using</a> ⇒ <code>any</code></dt>
<dd><p>Ensures the dispose of the given object instance is called, even if there was an error 
             in executing processor function</p>
</dd>
<dt><a href="#attr / $$">attr / $$</a> ⇒ <code>void</code></dt>
<dd><p>Decorator function to apply attributes on type and member definitions</p>
</dd>
<dt><a href="#Class">Class</a> ⇒ <code>type</code></dt>
<dd><p>Constructs a Class type.</p>
</dd>
<dt><a href="#Interface">Interface</a> ⇒ <code>type</code></dt>
<dd><p>Constructs a Interface type</p>
</dd>
<dt><a href="#Struct">Struct</a> ⇒ <code>type</code></dt>
<dd><p>Constructs a Struct type</p>
</dd>
<dt><a href="#Enum">Enum</a> ⇒ <code>type</code></dt>
<dd><p>Constructs a Enum type</p>
</dd>
<dt><a href="#Mixin">Mixin</a> ⇒ <code>type</code></dt>
<dd><p>Constructs a Mixin type</p>
</dd>
<dt><a href="#on">on</a> ⇒ <code>void</code></dt>
<dd><p>Register an event handler to handle a specific event.</p>
</dd>
<dt><a href="#post">post</a> ⇒</dt>
<dd><p>Dispatch an event for any flair component to react.
             This together with &#39;on&#39; makes a local pub/sub system which is capable to react to external
             events when they are posted via &#39;post&#39; here and raise to external world which can be hooked to &#39;on&#39;</p>
</dd>
<dt><a href="#Container">Container</a></dt>
<dd><p>Dependency injection container system</p>
</dd>
<dt><a href="#telemetry">telemetry</a></dt>
<dd><p>Telemetry enable/disable/filter/collect</p>
</dd>
<dt><a href="#Serializer">Serializer</a> ⇒ <code>string</code> | <code>object</code></dt>
<dd><p>Serializer/Deserialize object instances</p>
</dd>
<dt><a href="#Tasks">Tasks</a> ⇒ <code>object</code></dt>
<dd><p>Task execution</p>
</dd>
<dt><a href="#ClientFileLoaderPort">ClientFileLoaderPort</a></dt>
<dd><p>Default client file loading implementation</p>
</dd>
<dt><a href="#ClientModuleLoaderPort">ClientModuleLoaderPort</a></dt>
<dd><p>Default client module loading implementation</p>
</dd>
<dt><a href="#ServerFileLoaderPort">ServerFileLoaderPort</a></dt>
<dd><p>Default server file loading implementation</p>
</dd>
<dt><a href="#ServerModuleLoaderPort">ServerModuleLoaderPort</a></dt>
<dd><p>Default server module loading implementation</p>
</dd>
<dt><a href="#SettingsReaderPort">SettingsReaderPort</a></dt>
<dd><p>Default settings reader implementation</p>
</dd>
<dt><a href="#Reflector">Reflector</a></dt>
<dd><p>Reflection of flair type.</p>
</dd>
<dt><a href="#utils">utils</a></dt>
<dd><p>Helper functions exposed.</p>
</dd>
<dt><a href="#before">before</a></dt>
<dd><p>Before advise</p>
</dd>
<dt><a href="#after">after</a></dt>
<dd><p>After advise</p>
</dd>
<dt><a href="#IAttribute">IAttribute</a></dt>
<dd><p>IAttribute interface</p>
</dd>
<dt><a href="#name_ string - name of custom attribute">name: string - name of custom attribute</a></dt>
<dd></dd>
<dt><a href="#constraints_ string - An expression that defined the constraints of applying this attribute 
                    using NAMES, PREFIXES, SUFFIXES and logical Javascript operator

                 NAMES can be_ 
                     type names_ class, struct, enum, interface, mixin
                     type member names_ prop, func, construct, dispose, event
                     inbuilt modifier names_ static, abstract, sealed, virtual, override, private, protected, readonly, async, etc.
                     inbuilt attribute names_ promise, singleton, serialize, deprecate, session, state, conditional, noserialize, etc.
                     custom attribute names_ any registered custom attribute name
                     type names itself_ e.g., Aspect, Attribute, etc. (any registered type name is fine)
                         SUFFIX_ A typename must have a suffix (^) e.g., Aspect^, Attribute^, etc. Otherwise this name will be treated as custom attribute name
                 
                 PREFIXES can be_
                     No Prefix_ means it must match or be present at the level where it is being defined">constraints: string - An expression that defined the constraints of applying this attribute 
                    using NAMES, PREFIXES, SUFFIXES and logical Javascript operator

                 NAMES can be: 
                     type names: class, struct, enum, interface, mixin
                     type member names: prop, func, construct, dispose, event
                     inbuilt modifier names: static, abstract, sealed, virtual, override, private, protected, readonly, async, etc.
                     inbuilt attribute names: promise, singleton, serialize, deprecate, session, state, conditional, noserialize, etc.
                     custom attribute names: any registered custom attribute name
                     type names itself: e.g., Aspect, Attribute, etc. (any registered type name is fine)
                         SUFFIX: A typename must have a suffix (^) e.g., Aspect^, Attribute^, etc. Otherwise this name will be treated as custom attribute name
                 
                 PREFIXES can be:
                     No Prefix: means it must match or be present at the level where it is being defined</a></dt>
<dd></dd>
<dt><a href="#decorateProperty (optional)">decorateProperty </a> ⇒ <code>object</code></dt>
<dd><p>Property decorator</p>
</dd>
<dt><a href="#decorateFunction (optional)">decorateFunction </a> ⇒ <code>function</code></dt>
<dd><p>Function decorator</p>
</dd>
<dt><a href="#decorateEvent (optional)">decorateEvent </a> ⇒ <code>function</code></dt>
<dd><p>Event decorator</p>
</dd>
<dt><a href="#IDisposable">IDisposable</a></dt>
<dd><p>IDisposable interface</p>
</dd>
<dt><a href="#IPortHandler">IPortHandler</a></dt>
<dd><p>IPortHandler interface</p>
</dd>
<dt><a href="#name_ string - name of port handler">name: string - name of port handler</a></dt>
<dd></dd>
<dt><a href="#IProgressReporter">IProgressReporter</a></dt>
<dd><p>IProgressReporter interface</p>
</dd>
<dt><a href="#Task">Task</a></dt>
<dd><p>Task base class.</p>
</dd>
<dt><a href="#construct">construct</a></dt>
<dd><p>Task constructor</p>
</dd>
<dt><a href="#dispose">dispose</a></dt>
<dd><p>Task disposer</p>
</dd>
<dt><a href="#args_ array - for task setup">args: array - for task setup</a></dt>
<dd></dd>
<dt><a href="#context_ object - current assembly load context where this task is loaded">context: object - current assembly load context where this task is loaded</a></dt>
<dd></dd>
<dt><a href="#domain_ object - current assembly domain where this task is executing">domain: object - current assembly domain where this task is executing</a></dt>
<dd></dd>
<dt><a href="#run">run</a> ⇒ <code>any</code></dt>
<dd><p>Task executor</p>
</dd>
<dt><a href="#progress">progress</a></dt>
<dd><p>Progress event</p>
</dd>
<dt><a href="#setup">setup</a> ⇒ <code>Promise</code></dt>
<dd><p>Task related setup, executed only once, before onRun is called, - async</p>
</dd>
<dt><a href="#onRun">onRun</a> ⇒ <code>any</code></dt>
<dd><p>Task run handler - async</p>
</dd>
</dl>

## Objects

<dl>
<dt><a href="#Aspects">Aspects</a> : <code>object</code></dt>
<dd><p>Aspects api root</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#IAspect">IAspect</a></dt>
<dd><p>IAspect interface</p>
</dd>
</dl>

<a name="Exception"></a>

## Exception
**Kind**: global class  
**Params**: type: string - error name or type
 message: string - error message
 error: object - inner error or exception object
 stStart: function - hide stack trace before this function  
<a name="new_Exception_new"></a>

### new Exception()
Lightweight Exception class that extends Error object and serves as base of all exceptions

**Example**  
```js
Exception()
 Exception(type)
 Exception(type, stStart)
 Exception(error)
 Exception(error, stStart)
 Exception(type, message)
 Exception(type, message, stStart)
 Exception(type, error)
 Exception(type, error, stStart)
 Exception(type, message, error)
 Exception(type, message, error, stStart)
```
<a name="noop"></a>

## noop
No Operation function

**Kind**: global variable  
**Example**  
```js
noop()
```
<a name="nip"></a>

## nip
Not Implemented Property

**Kind**: global variable  
**Example**  
```js
nip()
```
<a name="nim"></a>

## nim
Not Implemented Method

**Kind**: global variable  
**Example**  
```js
nim()
```
<a name="typeOf"></a>

## typeOf ⇒ <code>string</code>
Finds the type of given object in flair type system

**Kind**: global variable  
**Returns**: <code>string</code> - - type of the given object
                  it can be following:
                   > special ones like 'undefined', 'null', 'NaN', infinity
                   > special javascript data types like 'array', 'date', etc.
                   > inbuilt flair object types like 'class', 'struct', 'enum', etc.
                   > native regular javascript data types like 'string', 'number', 'function', 'symbol', etc.  
**Params**: obj: object - object that needs to be checked  
**Example**  
```js
typeOf(obj)
```
<a name="is"></a>

## is ⇒ <code>boolean</code>
Checks if given object is of a given type

**Kind**: global variable  
**Returns**: <code>boolean</code> - - true/false  
**Params**: obj: object - object that needs to be checked
 type: string OR type - type to be checked for, it can be following:
                        > expected native javascript data types like 'string', 'number', 'function', 'array', 'date', etc.
                        > 'function' - any function, cfunction' - constructor function and 'afunction - arrow function
                        > any 'flair' object or type, 'flairtype' - only flair types and 'flairinstance' - only flair instances
                        > inbuilt flair object types like 'class', 'struct', 'enum', etc.
                        > custom flair object instance types which are checked in following order:
                          >> for class instances: 
                             isInstanceOf given as type
                             isImplements given as interface 
                             isMixed given as mixin
                          >> for struct instances:
                             isInstance of given as struct type  
**Example**  
```js
is(obj, type)
```
<a name="is"></a>

## is ⇒ <code>boolean</code>
Checks if given object has specified member defined

**Kind**: global variable  
**Returns**: <code>boolean</code> - - true/false  
**Params**: obj: object - object that needs to be checked
 memberName: string - name of the member to check  
**Example**  
```js
isDefined(obj, memberName)
```
<a name="Args"></a>

## Args ⇒ <code>function</code>
Lightweight args pattern processing that returns a validator function to validate arguments against given arg patterns

**Kind**: global variable  
**Returns**: <code>function</code> - - validator function that is configured for specified patterns  
**Params**: patterns: string(s) - multiple pattern strings, each representing one pattern set
                       each pattern set can take following forms:
                       'type, type, type, ...' OR 'name: type, name: type, name: type, ...'
                         type: can be following:
                             > special types: 'undefined' - for absence of a passed value
                             > expected native javascript data types like 'string', 'number', 'function', 'array', etc.
                             > 'function' - any function, cfunction' - constructor function and 'afunction - arrow function
                             > inbuilt flair object types like 'class', 'struct', 'enum', etc.
                             > custom flair object instance types which are checked in following order:
                                 >> for class instances: 
                                    isInstanceOf given as type
                                    isImplements given as interface 
                                    isMixed given as mixin
                                 >> for struct instances:
                                    isInstance of given as struct type
                         name: argument name which will be used to store extracted value by parser  
**Example**  
```js
Args(...patterns)
```
<a name="event"></a>

## event ⇒ <code>function</code>
Event marker

**Kind**: global variable  
**Returns**: <code>function</code> - function - returns given function or a noop function as is with an event marked tag  
**Params**: argsProcessor - args processor function, if args to be processed before event is raised  
**Example**  
```js
event()
```
<a name="nie"></a>

## nie
Not Implemented Event

**Kind**: global variable  
**Example**  
```js
nie()
```
<a name="Dispatcher"></a>

## Dispatcher
Event dispatching.

**Kind**: global variable  
<a name="InjectedArg"></a>

## InjectedArg
An argument that is injected by a custom attribute OR an advise

**Kind**: global variable  
<a name="Port"></a>

## Port
Customize configurable functionality of the core. This gives a way to configure a different component to
             handle some specific functionalities of the core, e.g., fetching a file on server, or loading a module on
             client, or handling sessionStorage, to name a few.
             Ports are defined by a component and handlers of required interface (complies, not implements) types can be 
             supplied from outside as per usage requirements

**Kind**: global variable  
**Params**: name: string - name of the port
 members: array of strings - having member names that are checked for their presence when a port is accepted and connected
 ph: object - an object having all required members defined in port definition  
**Example**  
```js
Port(name)                     // returns handler/null - if connected returns handler else null
 Port.define(name, members)     
 Port.connect(ph)
 Port.disconnect(name)
 Port.isDefined(name)
 Port.isConnected(name)
```
<a name="AssemblyLoadContext"></a>

## AssemblyLoadContext
The isolation boundary of type loading across assemblies.

**Kind**: global variable  
<a name="Assembly"></a>

## Assembly
Assembly object.

**Kind**: global variable  
<a name="Resource"></a>

## Resource
Resource object.

**Kind**: global variable  
<a name="Route"></a>

## Route
Route object.

**Kind**: global variable  
<a name="SharedChannel"></a>

## SharedChannel
Shared channel that communicates between two threads.

**Kind**: global variable  
<a name="AppDomainProxy"></a>

## AppDomainProxy
Proxy to AppDomain that is created inside other worker.

**Kind**: global variable  
<a name="AssemblyLoadContextProxy"></a>

## AssemblyLoadContextProxy
Proxy of the AssemblyLoadContext that is created inside other AppDomain.

**Kind**: global variable  
<a name="AppDomain"></a>

## AppDomain
Thread level isolation.

**Kind**: global variable  
<a name="getAttr"></a>

## getAttr ⇒ [<code>Array.&lt;IAttribute&gt;</code>](#IAttribute)
Gets the attributes for given object or Type.

**Kind**: global variable  
**Returns**: [<code>Array.&lt;IAttribute&gt;</code>](#IAttribute) - - array of attributes information objects { name, isCustom, args, type }
         name: name of the attribute
         isCustom: true/false - if this is a custom attribute
         args: attribute arguments
         type: name of the Type (in inheritance hierarchy) where this attribute comes from (when a type is inherited, attributes can be applied anywhere in hierarchy)  
**Params**: obj: object - flair object instance or flair Type that needs to be checked
 memberName: string - when passed is flair object instance - member name for which attributes are to be read 
                when passed is flair type - attribute name - if any specific attribute needs to be read (it will read all when this is null)
 attrName: string - if any specific attribute needs to be read (it will read all when this is null)  
**Example**  
```js
getAttr(obj, name, attrName)
```
<a name="getAssembly"></a>

## getAssembly ⇒ <code>object</code>
Gets the assembly of a given flair type/instance

**Kind**: global variable  
**Returns**: <code>object</code> - - assembly object  
**Params**: Type: type/instance/string - flair type or instance whose assembly is required
                              qualified type name, if it is needed to know in which assembly this exists
                              assembly name, if assembly is to be looked for by assembly name
                              (since this is also string, this must be enclosed in [] to represent this is assembly name and not qualified type name)
                              (if assembly is not loaded, it will return null)  
**Example**  
```js
_getAssembly(Type)
```
<a name="getAssemblyOf"></a>

## getAssemblyOf ⇒ <code>string</code>
Gets the assembly file of a given flair type

**Kind**: global variable  
**Returns**: <code>string</code> - - assembly file name which contains this type  
**Params**: Type: string - qualified type name, if it is needed to know in which assembly file this exists  
**Example**  
```js
_getAssemblyOf(Type)
```
<a name="getContext"></a>

## getContext ⇒ <code>object</code>
Gets the assembly load context where a given flair type is loaded

**Kind**: global variable  
**Returns**: <code>object</code> - - assembly load context object where this type is loaded  
**Params**: Type: type - flair type whose context is required  
**Example**  
```js
_getContext(Type)
```
<a name="getResource"></a>

## getResource ⇒ <code>object</code>
Gets the registered resource from default assembly load context of default appdomain
but for possible alias names, it also checks DI container, if resource is not found

**Kind**: global variable  
**Returns**: <code>object</code> - - resource object's data  
**Params**: qualifiedName: string - qualified resource name  
**Example**  
```js
getResource(qualifiedName)
```
<a name="getRoute"></a>

## getRoute ⇒ <code>object</code>
Gets the registered route from default assembly load context of default appdomain

**Kind**: global variable  
**Returns**: <code>object</code> - - route's data  
**Params**: qualifiedName: string - qualified route name  
**Example**  
```js
getRoute(qualifiedName)
```
<a name="getType"></a>

## getType ⇒ <code>object</code>
Gets the flair Type from default assembly load context of default appdomain
but for possible alias names, it also checks DI container, if type is not found

**Kind**: global variable  
**Returns**: <code>object</code> - - if assembly which contains this type is loaded, it will return flair type object OR will return null  
**Params**: qualifiedName: string - qualified type name whose reference is needed  
**Example**  
```js
getType(qualifiedName)
```
<a name="getTypeOf"></a>

## getTypeOf ⇒ <code>type</code>
Gets the underlying type which was used to construct this object

**Kind**: global variable  
**Returns**: <code>type</code> - - flair type for the given object  
**Params**: obj: object - object that needs to be checked  
**Example**  
```js
getType(obj)
```
<a name="getTypeName"></a>

## getTypeName ⇒ <code>string</code>
Gets the name of the underlying type which was used to construct this object

**Kind**: global variable  
**Returns**: <code>string</code> - - name of the type of given object  
**Params**: obj: object - object that needs to be checked  
**Example**  
```js
getTypeName(obj)
```
<a name="ns"></a>

## ns ⇒ <code>object</code>
Gets the registered namespace from default assembly load context of default appdomain

**Kind**: global variable  
**Returns**: <code>object</code> - if no name is passed to represents root-namespace OR promise that resolves with namespace object for specified namespace name  
**Params**: name: string - name of the namespace
 scan: string (optional) - can be:
     absent/empty: no assemblies will be scanned, namespace will be picked whatever is loaded
     *: all registered ADOs will be scanned for this namespace and any unloaded assemblies will be loaded, before returning the namespace
        Note: This is time consuming and if there are cyclic conditions - it is unpredictable (TODO: Check and fix this scenario)
     <assembly-file-name>: all registered ADOs will be scanned for this registered assembly and if this assembly is not loaded yet, it will be loaded before returning the namespace
         Note: In general, cyclic conditions should be avoided as best practice - although this code will take care of this
         <assembly-file-name> can be xyz.js | xyz.min.js | ./<path>/xyz.js | ./<path>/xyz.min.js 
             no need to use .min. in file name here, it will pick whatever is applicable for the environment
             but if this is added, it will be ignored  
**Example**  
```js
ns(name)
 ns(name, scan)
```
<a name="isDerivedFrom"></a>

## isDerivedFrom ⇒ <code>boolean</code>
Checks if given flair class type is derived from given class type, directly or indirectly

**Kind**: global variable  
**Returns**: <code>boolean</code> - - true/false  
**Params**: Type: class - flair class type that needs to be checked
 Parent: string OR class - class type to be checked for being in parent hierarchy, it can be following:
                           > fully qualified class type name
                           > class type reference  
**Example**  
```js
isDerivedFrom(type, parent)
```
<a name="isAbstract"></a>

## isAbstract ⇒ <code>boolean</code>
Checks if given flair class type is abstract.

**Kind**: global variable  
**Returns**: <code>boolean</code> - - true/false  
**Params**: Type: class - flair class type that needs to be checked  
**Example**  
```js
isAbstract(type)
```
<a name="isSealed"></a>

## isSealed ⇒ <code>boolean</code>
Checks if given flair class type is sealed.

**Kind**: global variable  
**Returns**: <code>boolean</code> - - true/false  
**Params**: Type: class - flair class type that needs to be checked  
**Example**  
```js
isSealed(type)
```
<a name="isStatic"></a>

## isStatic ⇒ <code>boolean</code>
Checks if given flair class type is static.

**Kind**: global variable  
**Returns**: <code>boolean</code> - - true/false  
**Params**: Type: class - flair class type that needs to be checked  
**Example**  
```js
isStatic(type)
```
<a name="isSingleton"></a>

## isSingleton ⇒ <code>boolean</code>
Checks if given flair class type is singleton.

**Kind**: global variable  
**Returns**: <code>boolean</code> - - true/false  
**Params**: Type: class - flair class type that needs to be checked  
**Example**  
```js
isSingleton(type)
```
<a name="isDeprecated"></a>

## isDeprecated ⇒ <code>boolean</code>
Checks if given flair class type is deprecated.

**Kind**: global variable  
**Returns**: <code>boolean</code> - - true/false  
**Params**: Type: class - flair class type that needs to be checked  
**Example**  
```js
isDeprecated(type)
```
<a name="isInstanceOf"></a>

## isInstanceOf ⇒ <code>boolean</code>
Checks if given flair class/struct instance is an instance of given class/struct type or
             if given class instance implements given interface or has given mixin mixed somewhere in class
             hierarchy

**Kind**: global variable  
**Returns**: <code>boolean</code> - - true/false  
**Params**: obj: object - flair object instance that needs to be checked
 Type: flair type of string  
**Example**  
```js
isInstanceOf(obj, type)
```
<a name="as"></a>

## as ⇒ <code>object</code>
Checks if given object can be consumed as an instance of given type

**Kind**: global variable  
**Returns**: <code>object</code> - - if can be used as specified type, return same object, else null  
**Params**: obj: object - object that needs to be checked
 type: string OR type - type to be checked for, it can be following:
                        > expected native javascript data types like 'string', 'number', 'function', 'array', 'date', etc.
                        > 'function' - any function, cfunction' - constructor function and 'afunction - arrow function
                        > any 'flair' object or type
                        > inbuilt flair object types like 'class', 'struct', 'enum', etc.
                        > custom flair object instance types which are checked in following order:
                          >> for class instances: 
                             isInstanceOf given as type
                             isImplements given as interface 
                             isMixed given as mixin
                          >> for struct instances:
                             isInstance of given as struct type  
**Example**  
```js
as(obj, type)
```
<a name="isComplies"></a>

## isComplies ⇒ <code>boolean</code>
Checks if given object complies to given flair interface

**Kind**: global variable  
**Returns**: <code>boolean</code> - - true/false  
**Params**: obj: object - any object that needs to be checked
 intf: interface - flair interface type to be checked for  
**Example**  
```js
isComplies(obj, intf)
```
<a name="isImplements"></a>

## isImplements ⇒ <code>boolean</code>
Checks if given flair class/struct instance or class/struct implements given interface

**Kind**: global variable  
**Returns**: <code>boolean</code> - - true/false  
**Params**: obj: object - flair object that needs to be checked
 intf: string OR interface - interface to be checked for, it can be following:
                             > fully qualified interface name
                             > interface type reference  
**Example**  
```js
isImplements(obj, intf)
```
<a name="isMixed"></a>

## isMixed ⇒ <code>boolean</code>
Checks if given flair class/struct instance or class/struct has mixed with given mixin

**Kind**: global variable  
**Returns**: <code>boolean</code> - - true/false  
**Params**: obj: object - flair object instance or type that needs to be checked
 mixin: string OR mixin - mixin to be checked for, it can be following:
                          > fully qualified mixin name
                          > mixin type reference  
**Example**  
```js
isMixed(obj, mixin)
```
<a name="bring"></a>

## bring ⇒ <code>void</code>
Fetch, load and/or resolve an external dependency for required context

**Kind**: global variable  
**Usage**: bring([
   'my.namespace.MyStruct',
   '[IBase]'
   'myServerClass | myClientClass'
   'fs | x'
   'x | page/page.js'
   './abc.mjs'
   './somepath/somefile.css'
 ], (MyStruct, IBase, MyClass, fs, abc, someCSS) => {
     ... use them here
 });  
**Params**: deps: array - array of strings, each defining a dependency to fetch/load or resolve
     >> each dep definition string  can take following form:

         >> [<name>]
             >> e.g., '[IBase]'
             >> this can be a registered alias to any type and is resolved via DI container
             >> if resolved type is an string, it will again pass through <namespace>.<name> resolution process
         >> <namespace>.<name>
             >> e.g., 'my.namespace.MyClass' or 'my.namespace.MyResource'
             >> this will be looked in given namespace first, so an already loaded type will be picked first
             >> if not found in given namespace, it will look for the assembly where this type might be registered
             >> if found in a registered assembly, it will load that assembly and again look for it in given namespace

         >> <name>
             >> e.g., 'fs'
             >> this can be a NodeJS module name (on server side) or a JavaScript module name (on client side)
             >> on server, it uses require('moduleName') to resolve
             >> on client-side it look for this in './modules/moduleName/?' file
                 >> to get on the file 

         >> <path>/<file>.js|.mjs
             >> e.g., './my/path/somefile.js'
             >> this can be a bare file to load to
             >> path is always treated in context of the root path - full, relative paths from current place are not supported
             >> to handle PRODUCTION and DEBUG scenarios automatically, use <path>/<file>{.min}.js|.mjs format. 
             >> it PROD symbol is available, it will use it as <path>/<file>.min.js otherwise it will use <path>/<file>.js

         >> <path>/<file.css|json|html|...>
             >> e.g., './my/path/somefile.css'
             >>  if ths is not a js|mjs file, it will treat it as a resource file and will use fetch/require, as applicable
     
         NOTE: <path> for a file MUST start with './' to represent this is a file path from root
               if ./ is not used in path - it will be assumed to be a path inside a module and on client ./modules/ will be prefixed to reach to the file inside module
               on server if file started with './', it will be replaced with '' instead of './' to represents root

         NOTE: Each dep definition can also be defined for contextual consideration as:
         '<depA> | <depB>'
         when running on server, <depA> would be considered, and when running on client <depB> will be used

         IMPORTANT: Each dependency is resolved with the resolved Object/content returned by dependency
                    if a dependency could not be resolved, it will throw the console.error()
                    cyclic dependencies are taken care of - if A is looking for B which is looking for C and that is looking for A - or any such scenario - it will throw error
 fn: function - function where to pass resolved dependencies, in order they are defined in deps  
**Example**  
```js
bring(deps, fn)
```
<a name="include"></a>

## include ⇒ <code>Promise</code>
bring the required dependency

**Kind**: global variable  
**Returns**: <code>Promise</code> - - that gets resolved with given dependency  
**Params**: dep: string - dependency to be included
               NOTE: Dep can be of any type as defined for 'bring'
 globalVar: string - globally added variable name by the dependency
            NOTE: if dependency is a file and it emits a global variable, this should be name
                  of that variable and it will return that variable itself  
**Example**  
```js
include(dep)
```
<a name="dispose"></a>

## dispose ⇒ <code>void</code>
Call dispose of given flair object

**Kind**: global variable  
**Params**: obj: object - flair object that needs to be disposed
      boolean - if passed true, it will clear all of flair internal system  
**Example**  
```js
dispose(obj)
```
<a name="using"></a>

## using ⇒ <code>any</code>
Ensures the dispose of the given object instance is called, even if there was an error 
             in executing processor function

**Kind**: global variable  
**Returns**: <code>any</code> - - returns anything that is returned by processor function, it may also be a promise  
**Params**: obj: object/string - object that needs to be processed by processor function or qualified name for which object will be created
               If a disposer is not defined for the object, it will not do anything
 fn: function - processor function  
**Example**  
```js
using(obj, fn)
```
<a name="attr / $$"></a>

## attr / $$ ⇒ <code>void</code>
Decorator function to apply attributes on type and member definitions

**Kind**: global variable  
**Params**: attrName: string/type - Name of the attribute, it can be an internal attribute or namespaced attribute name
                         It can also be the Attribute flair type itself
 attrArgs: any - Any arguments that may be needed by attribute  
**Example**  
```js
$$(name)
```
<a name="Class"></a>

## Class ⇒ <code>type</code>
Constructs a Class type.

**Kind**: global variable  
**Returns**: <code>type</code> - - constructed flair class type  
**Params**: name: string - name of the class
                it can take following forms:
                >> simple, e.g.,
                   MyClass
                >> auto naming, e.g., 
                   ''
                   Use this only when putting only one type in a file and using flairBuild builder to build assembly
                   And in that case, filename will be used as type name. So if file name is 'MyType.js', name would be 'MyType' (case sensitive)
                   To give namespace to a type, use $$('ns', 'com.product.feature');
                   Apply this attribute on type definition itself. then type can be accessed as getType('com.product.feature.MyType');
                   To put a type in root namespace, use $$('ns' '(root)') or just put it in '(root)' folder and use auto-naming
                   Then type can be accessed as getType('MyType');
                   Note: When auto-naming is being used, namespace is also added automatically, and $$('ns') should not be applied
 inherits: type - A flair class type from which to inherit this class
 mixints: array - An array of mixin and/or interface types which needs to be applied to this class type
                       mixins will be applied in order they are defined here
 factory: function - factory function to build class definition  
**Example**  
```js
Class(name, factory)
 Class(name, inherits, factory)
 Class(name, mixints, factory)
 Class(name, inherits, mixints, factory)
```
<a name="Interface"></a>

## Interface ⇒ <code>type</code>
Constructs a Interface type

**Kind**: global variable  
**Returns**: <code>type</code> - - constructed flair interface type  
**Params**: name: string - name of the interface
                it can take following forms:
                >> simple, e.g.,
                   IInterfaceName
                >> auto naming, e.g., 
                   ''
                   Use this only when putting only one type in a file and using flairBuild builder to build assembly
                   And in that case, filename will be used as type name. So if file name is 'MyType.js', name would be 'MyType' (case sensitive)
                   To give namespace to a type, use $$('ns', 'com.product.feature');
                   Apply this attribute on type definition itself. then type can be accessed as getType('com.product.feature.MyType');
                   To put a type in root namespace, use $$('ns' '(root)') or just put it in '(root)' folder and use auto-naming
                   Then type can be accessed as getType('MyType');
                   Note: When auto-naming is being used, namespace is also added automatically, and $$('ns') should not be applied
 factory: function - factory function to build interface definition  
**Example**  
```js
Interface(name, factory)
```
<a name="Struct"></a>

## Struct ⇒ <code>type</code>
Constructs a Struct type

**Kind**: global variable  
**Returns**: <code>type</code> - - constructed flair struct type  
**Params**: name: string - name of the struct
                >> simple, e.g.,
                   MyStruct
                >> auto naming, e.g., 
                   ''
                   Use this only when putting only one type in a file and using flairBuild builder to build assembly
                   And in that case, filename will be used as type name. So if file name is 'MyType.js', name would be 'MyType' (case sensitive)
                   To give namespace to a type, use $$('ns', 'com.product.feature');
                   Apply this attribute on type definition itself. then type can be accessed as getType('com.product.feature.MyType');
                   To put a type in root namespace, use $$('ns' '(root)') or just put it in '(root)' folder and use auto-naming
                   Then type can be accessed as getType('MyType');
                   Note: When auto-naming is being used, namespace is also added automatically, and $$('ns') should not be applied
 factory: function - factory function to build struct definition  
**Example**  
```js
Struct(name, factory)
```
<a name="Enum"></a>

## Enum ⇒ <code>type</code>
Constructs a Enum type

**Kind**: global variable  
**Returns**: <code>type</code> - - constructed flair enum type  
**Params**: name: string - name of the enum
                >> simple, e.g.,
                   MyEnum
                >> auto naming, e.g., 
                   ''
                   Use this only when putting only one type in a file and using flairBuild builder to build assembly
                   And in that case, filename will be used as type name. So if file name is 'MyType.js', name would be 'MyType' (case sensitive)
                   To give namespace to a type, use $$('ns', 'com.product.feature');
                   Apply this attribute on type definition itself. then type can be accessed as getType('com.product.feature.MyType');
                   To put a type in root namespace, use $$('ns' '(root)') or just put it in '(root)' folder and use auto-naming
                   Then type can be accessed as getType('MyType');
                   Note: When auto-naming is being used, namespace is also added automatically, and $$('ns') should not be applied
 factory: function - factory function to build enum definition  
**Example**  
```js
Enum(name, factory)
```
<a name="Mixin"></a>

## Mixin ⇒ <code>type</code>
Constructs a Mixin type

**Kind**: global variable  
**Returns**: <code>type</code> - - constructed flair mixin type  
**Params**: name: string - name of the mixin
                >> simple, e.g.,
                   MyMixin
                >> auto naming, e.g., 
                   ''
                   Use this only when putting only one type in a file and using flairBuild builder to build assembly
                   And in that case, filename will be used as type name. So if file name is 'MyType.js', name would be 'MyType' (case sensitive)
                   To give namespace to a type, use $$('ns', 'com.product.feature');
                   Apply this attribute on type definition itself. then type can be accessed as getType('com.product.feature.MyType');
                   To put a type in root namespace, use $$('ns' '(root)') or just put it in '(root)' folder and use auto-naming
                   Then type can be accessed as getType('MyType');
                   Note: When auto-naming is being used, namespace is also added automatically, and $$('ns') should not be applied
 factory: function - factory function to build mixin definition  
**Example**  
```js
Mixin(name, factory)
```
<a name="on"></a>

## on ⇒ <code>void</code>
Register an event handler to handle a specific event.

**Kind**: global variable  
**Params**: event: string - Name of the even to subscribe to
 handler: function - event handler function
 isRemove: boolean - is previously associated handler to be removed  
**Example**  
```js
on(event, handler)
 on(event, handler, isRemove)
```
<a name="post"></a>

## post ⇒
Dispatch an event for any flair component to react.
             This together with 'on' makes a local pub/sub system which is capable to react to external
             events when they are posted via 'post' here and raise to external world which can be hooked to 'on'

**Kind**: global variable  
**Returns**: void  
**Params**: event: string - Name of the even to dispatch
        Note: external events are generally namespaced like pubsub.channelName
 args: any - any arguments to pass to event handlers  
**Example**  
```js
post(event)
 post(event, args)
```
<a name="Container"></a>

## Container
Dependency injection container system

**Kind**: global variable  
**Params**: alias: string - name of alias for an item
 item: type/object/string - either a flair type, any object or a qualified type name or a file name
       when giving string, it can be of format 'x | y' for different resolution on server and client
 args: arguments to pass to type constructor when created instances for items
 isAll: boolean - if resolve with all registered items against given alias or only first  
**Example**  
```js
isRegistered(alias)                                // - true/false
 get(alias, isAll)                                  // - item / array of registered unresolved items, as is
 register(alias, item)                              // - void
 resolve(alias, isAll, ...args)                     // - item / array of resolved items
```
<a name="telemetry"></a>

## telemetry
Telemetry enable/disable/filter/collect

**Kind**: global variable  
**Params**: types: string - as many types, as needed, when given, telemetry for given types only will be released
 handler: function - an event handler for telemetry event
                     Note: This can also be done using flair.on('telemetry', handler) call.  
**Example**  
```js
.on()
 .on(...types)
 .on(handler, ...types)
 .collect()
 .off()
 .off(handler)
 .isOn()
 .types
```
<a name="Serializer"></a>

## Serializer ⇒ <code>string</code> \| <code>object</code>
Serializer/Deserialize object instances

**Kind**: global variable  
**Returns**: <code>string</code> \| <code>object</code> - string: json string when serialized
 object: flair object instance, when deserialized  
**Params**: instance: object - supported flair type's object instance to serialize
 json: object - previously serialized object by the same process  
**Example**  
```js
.serialiaze(instance)
 .deserialize(json)
```
<a name="Tasks"></a>

## Tasks ⇒ <code>object</code>
Task execution

**Kind**: global variable  
**Returns**: <code>object</code> - - if assembly which contains this type is loaded, it will return flair type object OR will return null  
**Params**: qualifiedName: string - qualified type name whose reference is needed  
**Example**  
```js
new Tasks.TaskInfo(qualifiedName, ...args)
 Tasks.invoke(task, progressListener)
 Tasks.getHandle(task, progressListener) -> handle
     handle.run(...args) // (can be executed many times)
     handle.close() // finally close
 Tasks.parallel.invoke.any(...tasks)
 Tasks.parallel.invoke.all(...tasks)
 Tasks.parallel.invoke.each(onSuccess, onError, ...tasks)
 Tasks.sequence.invoke(...tasks)
```
<a name="ClientFileLoaderPort"></a>

## ClientFileLoaderPort
Default client file loading implementation

**Kind**: global variable  
<a name="ClientModuleLoaderPort"></a>

## ClientModuleLoaderPort
Default client module loading implementation

**Kind**: global variable  
<a name="ServerFileLoaderPort"></a>

## ServerFileLoaderPort
Default server file loading implementation

**Kind**: global variable  
<a name="ServerModuleLoaderPort"></a>

## ServerModuleLoaderPort
Default server module loading implementation

**Kind**: global variable  
<a name="SettingsReaderPort"></a>

## SettingsReaderPort
Default settings reader implementation

**Kind**: global variable  
<a name="Reflector"></a>

## Reflector
Reflection of flair type.

**Kind**: global variable  
**Params**: Type: object - flair type to reflect on  
**Example**  
```js
Reflector(Type)
```
<a name="utils"></a>

## utils
Helper functions exposed.

**Kind**: global variable  
**Example**  
```js
utils.<...>
```
<a name="before"></a>

## before
Before advise

**Kind**: global variable  
**Arguments**: ctx: object     - context object that is shared across all weaving
 typeName()      - gives the name of the type
 funcName()      - gives the name of the function
 error(err)      - store new error to context, or just call error() to get last error
 result(value)   - store new result to context, or just call result() to get last stored result
 args()          - get original args passed to main call
 data: {}        - an object to hold context data for temporary use, e.g., storing something in before advise and reading back in after advise  
**Example**  
```js
before(ctx)
```
<a name="after"></a>

## after
After advise

**Kind**: global variable  
**Arguments**: ctx: object     - context object that is shared across all weaving
 typeName()      - gives the name of the type
 funcName()      - gives the name of the function
 error(err)      - store new error to context, or just call error() to get last error
 result(value)   - store new result to context, or just call result() to get last stored result
 args()          - get original args passed to main call
 data: {}        - an object to hold context data for temporary use, e.g., storing something in before advise and reading back in after advise  
**Example**  
```js
after(ctx)
```
<a name="IAttribute"></a>

## IAttribute
IAttribute interface

**Kind**: global variable  
<a name="name_ string - name of custom attribute"></a>

## name: string - name of custom attribute
**Kind**: global variable  
<a name="constraints_ string - An expression that defined the constraints of applying this attribute 
                    using NAMES, PREFIXES, SUFFIXES and logical Javascript operator

                 NAMES can be_ 
                     type names_ class, struct, enum, interface, mixin
                     type member names_ prop, func, construct, dispose, event
                     inbuilt modifier names_ static, abstract, sealed, virtual, override, private, protected, readonly, async, etc.
                     inbuilt attribute names_ promise, singleton, serialize, deprecate, session, state, conditional, noserialize, etc.
                     custom attribute names_ any registered custom attribute name
                     type names itself_ e.g., Aspect, Attribute, etc. (any registered type name is fine)
                         SUFFIX_ A typename must have a suffix (^) e.g., Aspect^, Attribute^, etc. Otherwise this name will be treated as custom attribute name
                 
                 PREFIXES can be_
                     No Prefix_ means it must match or be present at the level where it is being defined"></a>

## constraints: string - An expression that defined the constraints of applying this attribute 
                    using NAMES, PREFIXES, SUFFIXES and logical Javascript operator

                 NAMES can be: 
                     type names: class, struct, enum, interface, mixin
                     type member names: prop, func, construct, dispose, event
                     inbuilt modifier names: static, abstract, sealed, virtual, override, private, protected, readonly, async, etc.
                     inbuilt attribute names: promise, singleton, serialize, deprecate, session, state, conditional, noserialize, etc.
                     custom attribute names: any registered custom attribute name
                     type names itself: e.g., Aspect, Attribute, etc. (any registered type name is fine)
                         SUFFIX: A typename must have a suffix (^) e.g., Aspect^, Attribute^, etc. Otherwise this name will be treated as custom attribute name
                 
                 PREFIXES can be:
                     No Prefix: means it must match or be present at the level where it is being defined
**Kind**: global variable  
**:**: means it must be inherited from or present at up in hierarchy chain
                     $: means it either must ne present at the level where it is being defined or must be present up in hierarchy chain
                 <name>  
**&lt;name&gt;**: $<name>

                 BOOLEAN Not (!) can also be used to negate:
                 !<name>
                 !@<name>
                 !$<name>
                 
                 NOTE: Constraints are processed as logical boolean expressions and 
                       can be grouped, ANDed or ORed as:

                       AND: <name1> && <name2> && ...
                       OR: <name1> || <name2>
                       GROUPING: ((<name1> || <name2>) && (<name1> || <name2>))
                                 (((<name1> || <name2>) && (<name1> || <name2>)) || <name3>)  
<a name="decorateProperty (optional)"></a>

## decorateProperty  ⇒ <code>object</code>
Property decorator

**Kind**: global variable  
**Returns**: <code>object</code> - object - having decorated { get: fn, set: fn }
          Note: decorated get must call member's get
                decorated set must accept value argument and pass it to member's set with or without processing  
**Arguments**: typeName: string - typeName
 memberName: string - member name
 member - object - having get: getter function and set: setter function
         both getter and setter can be applied attribute functionality on  
**Example**  
```js
decorateProperty(typeName, memberName, member)
```
<a name="decorateFunction (optional)"></a>

## decorateFunction  ⇒ <code>function</code>
Function decorator

**Kind**: global variable  
**Returns**: <code>function</code> - function - decorated function
            Note: decorated function must accept ...args and pass-it on (with/without processing) to member function  
**Arguments**: typeName: string - typeName
 memberName: string - member name
 member - function - function to decorate  
**Example**  
```js
decorateFunction(typeName, memberName, member)
```
<a name="decorateEvent (optional)"></a>

## decorateEvent  ⇒ <code>function</code>
Event decorator

**Kind**: global variable  
**Returns**: <code>function</code> - function - decorated function
            Note: decorated function must accept ...args and pass-it on (with/without processing) to member function  
**Arguments**: typeName: string - typeName
 memberName: string - member name
 member - function - event argument processor function  
**Example**  
```js
decorateEvent(typeName, memberName, member)
```
<a name="IDisposable"></a>

## IDisposable
IDisposable interface

**Kind**: global variable  
<a name="IPortHandler"></a>

## IPortHandler
IPortHandler interface

**Kind**: global variable  
<a name="name_ string - name of port handler"></a>

## name: string - name of port handler
**Kind**: global variable  
<a name="IProgressReporter"></a>

## IProgressReporter
IProgressReporter interface

**Kind**: global variable  
<a name="Task"></a>

## Task
Task base class.

**Kind**: global variable  
<a name="construct"></a>

## construct
Task constructor

**Kind**: global variable  
<a name="dispose"></a>

## dispose
Task disposer

**Kind**: global variable  
<a name="args_ array - for task setup"></a>

## args: array - for task setup
**Kind**: global variable  
<a name="context_ object - current assembly load context where this task is loaded"></a>

## context: object - current assembly load context where this task is loaded
**Kind**: global variable  
<a name="domain_ object - current assembly domain where this task is executing"></a>

## domain: object - current assembly domain where this task is executing
**Kind**: global variable  
<a name="run"></a>

## run ⇒ <code>any</code>
Task executor

**Kind**: global variable  
**Returns**: <code>any</code> - any - anything  
**Arguments**: args: array - array as passed to task constructor*  
**Example**  
```js
run()
```
<a name="progress"></a>

## progress
Progress event

**Kind**: global variable  
**Example**  
```js
progress()
```
<a name="setup"></a>

## setup ⇒ <code>Promise</code>
Task related setup, executed only once, before onRun is called, - async

**Kind**: global variable  
**Returns**: <code>Promise</code> - promise  
**Example**  
```js
setup()
```
<a name="onRun"></a>

## onRun ⇒ <code>any</code>
Task run handler - async

**Kind**: global variable  
**Returns**: <code>any</code> - any - anything  
**Arguments**: args: array - array as passed to task run  
**Example**  
```js
onRun(...args)
```
<a name="Aspects"></a>

## Aspects : <code>object</code>
Aspects api root

**Kind**: global namespace  
**Access**: public  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| register | <code>function</code> | Register given aspect type against given pointcut pattern |

<a name="IAspect"></a>

## IAspect
IAspect interface

**Kind**: global typedef  
