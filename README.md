# OOJS (pronounced ojus)
> Complete object oriented implementation for native JavaScript.

### First Look
```javascript
let Vehicle = Class('Vehicle', function() {
    this.func('constructor', (capacity) => {
        this.cc = capacity;
    });
    this.prop('cc', 0);
    this.func('start', () => {
        this.started();
    });
    this.event('started');
});

let myVehicle = new Vehicle(3000);
``` 



let Car = Class('Car', Vehicle, function() {
    this.func('constructor', (base, model, capacity) => {
        base('car', capacity);
        this.model = model;
    });
    this.prop('model', '');
});

let BMW = Class('BMW', Car, function() {
    this.func('constructor', (base, capacity) => {
        base('BMW', capacity);
    }); 
});

