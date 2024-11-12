
## CachePool.js

CachePool is a lightweight, dependency-free caching solution that provides an efficient cache pool for object reuse. It includes features like customizable object creation, deep copy support, and size control to optimize memory use and performance. 

The script is designed to handle common cache operations such as popping, pushing, expanding, and shrinking, all while supporting various data types.

### Key Features

- **Deep Copying**: Supports deep copying for safe reuse without unwanted side effects.
- **Dynamic Size Management**: Define initial and maximum sizes, expand and shrink the pool dynamically.
- **Callbacks on Actions**: Use custom functions for handling objects when they are pushed, popped or inited.

<br>

### Installation

You can install `cachepool.js` via npm:

```bash
npm install cachepool.js
```

Or include it directly in your project:
`<script src="path/to/cachepool.js"></script>`

<br>

### Basic Usage

```javascript
// Import CachePool
const { CachePool } = require('cachepool.js');

// Our beloved object.
const myObject = {
   id:0,
   someProp:"Some Content"
}

// We have created cache pool that contains 100 clones of myObject.
const myCachePool = new CachePool(myObject,100);

// We are getting 1 cached clone of myObject from myCachePool.
let obj1 = myCachePool.pop();

// Now, we can use "obj1" for some cool stuff.
obj1.id=1;
obj1.someProp = "Let's do something cool!";
doCoolStuff(obj1);
...

// Let's get another one for fancy stuff.
let obj2 = myCachePool.pop();
obj2.id=2;
obj2.someProp = "Lets do something fancy!";
doFancyStuff(obj2);
...

// Let’s put our clones back in the pool, ready for next time.
myCachePool.push(obj1);
myCachePool.push(obj2);

// Clearing out any references so they won't fool around.
obj1 = undefined;
obj2 = undefined;
```

<br>

### Parameters

```javascript
new CachePool(constructor, initSize, maxSize, popCall, pushCall, initCall, deepCopy);
```

| Parameter   | Arguments                          | Description                                                              |
| ----------- | ---------------------------------- | ------------------------------------------------------------------------ |
| constructor | `function`, `class`, `object`      | A constructor, class, or object template to create new instances.**(1)** |
| initSize    | `number`                           | Initial size of the pool (default: 1).**(2)**                            |
| maxSize     | `number`                           | Maximum pool size; unlimited if not specified.**(3)**                    |
| popCall     | `function`, `"methodName"`, `true` | Function to call when an object is popped from pool.**(4)**              |
| pushCall    | `function`, `"methodName"`, `true` | Function to call when an object is pushed to pool.**(4)**                |
| initCall    | `function`, `"methodName"`, `true` | Function to call when an object is created in the pool.**(4)**           |
| deepCopy    | `boolean`                          | Indicates if objects should be deep cloned.                              |

#### Notes
- **(1) Constructor Types:** It can be `Class`, `Function` as constructor to create instances or `object` (`regular Object`, `Array`, `Map`, `Set`, `ArrayBuffer`,`TypedArray`, `DataView`, `Date`, `RegExp`, `Error`) to clone. There is no point in storing `Primitives`, `WeakMap`, `WeakSet` in the cache pool. However, they are acceptable to maintain flexibility and stability.
- **(2) Initial Size:** If you don't provide an initial size, the pool will gradually expand as you use it, starting from 1. This can be useful in some cases, but it is recommended to specify an estimated size based on your scenario. You can change it later via setSize().
- **(2) Initial Max Size:** If you don't provide initial maximum size, the maximum size of the pool will be unlimited.
- **(4) Hook Functions:** You can provide hook functions directly, as properties or as methods. For example, if cache object constructor is a class or function that has `myPop` method; or it's is an object that has `myPop` property, you can give just its name `"myPop"` as argument. All hook functions will be pointed to cache object as "this" reference.

<br>

**See examples for more details.**

<br>

### Methods


`pop()`: Pops an object from the cache pool. `popCall` is called with 'this' as object reference, if provided.
**Note**: If there are no stored objects left in the pool, new objects will be created automatically to fulfill request.

 ```javascript
 myObject = myCachePool.pop();
```


`push(<object>)`: Pushes an object to the cache pool. `pushCall` is called with 'this' as object reference, if provided.
**Note**: If maximum pool size reached, pushed objects will be discarded.

```javascript
myCachePool.push(myObject);
```


`expand(<number>|<empty>)`: Increase cache pool with new objects by given number or 25% of its size by default.  

```javascript
// Pool Size:100, Stored Objects:100, Pool Max Size:300
myCachePool.expand(60); // Pool Size:160, Stored Objects:160 (+60)
myCachePool.expand();   // Pool Size:200, Stored Objects:200 (+40, increase by 25%)
myCachePool.expand(600);// Pool Size:300, Stored Objects:300 (+100, stops at max size)

// Pool Size:100, Stored Objects:30, Empty Slots:70
yourCachePool.expand(20); // Pool Size:120 (+20), Stored Objects:50 (+20), Empty Slots:70

```  


`shrink(<number>|<empty>)`: Decrease cache pool by given number. If argument is not given, or set to 0, the pool will shrink down to filled stack size.

```javascript
// Pool Size:100, Stored Objects:30, Empty Slots:70
myCachePool.shrink(20);  // Pool Size:80, Stored Objects:30, Empty Slots:50
myCachePool.shrink();    // Pool Size:30, Stored Objects:30, Empty Slots:0
```


`setSize(<number>)`: Sets the size of the cache pool.

```javascript
// Pool Size:100, Stored Objects:30, Empty Slots:70, Pool Max Size:300
myCachePool.setSize(200); // Pool Size:200, Stored Objects:30, Empty Slots:170
myCachePool.setSize(20);  // Pool Size:20,  Stored Objects:20, Empty Slots:0
myCachePool.setSize(600); // Pool Size:300 (stops at max size), Stored Objects:20, Empty Slots:280
```


`setMaxSize(<number>)`: Sets the maximum size of the cache pool.

```javascript
// Pool Size:100, Pool Max Size:100, Stored Objects:100 (Doesn't accept new objects.)
myCachePool.setMaxSize(200); // Accepts new objects until max size is reached (+100).
myCachePool.setMaxSize();    // Accepts unlimited new objects.
myCachePool.setMaxSize(30);  // Shrinks to max size. Pool Size:30, Pool Max Size:30, Stored Objects:30
```


`reset()`: Resets the cache pool to its initial state. It will have the same initial size and max size as it had when it was created. All objects in the pool will be destroyed and created again according to the initial size.

```javascript
myCachePool.reset();
```


<br>

### Detailed Examples

It's highly recommended to review cachepool.test.js results for better understanding.

[]()


##### Calling external hook functions directly with `this` reference

```javascript
// We have a Regular Object.
let myObject  = {
   id       : null,
   name     : "My Object",
   status   : "none",
}
// And a Constructor Function.
function myConstr{
   this.id      = null,
   this.name     = "My Constructor Instance",
   this.status   = "none",
};
myConstr.idCounter=0;

// And a Class.
class myClass{

   constructor(){
      this.id       = null;
      this.name     = "My Class Instance";
      this.status   = "none";
   }

   static idCounter = 0;
};

// Also an Array.
let myArray = ["some content",1,2,3];

// We have some hook functions that will be called for cache objects.
function initFun(){
   this.status = "I am newly created and stored in the pool.";
   this.name   = "Cached Object";

   console.log(`initFun called on ${this.name} with id ${this.id}`,this);
}

function popFun(){
   this.status = "I was popped out. Prepare me for some action.";
   this.id     = this.constructor.idCounter++;
   this.name   = "Active Object";

   console.log(`popFun called on ${this.name} with id ${this.id}`,this);
}

function pushFun(){
   console.log(`pushFun called on ${this.name} with id ${this.id}`,this);

   this.status = "I'm being pushed back again. Resetting my props would be a good idea.";
   this.id     = null;
   this.name   = "Cached Object";
}

// Counter for ids.
let idCounter=0;

// We create a new cache pools and provide hook functions directly as parameters.
// 10 x 'initFun' will be called on the newly created objects with 'this' reference for each pool.
let myObjectPool = new CachePool(myObject, 10, 100, popFun, pushFun, initFun);
let myConstrPool = new CachePool(myConstr, 10, 100, popFun, pushFun, initFun);
let myClassPool  = new CachePool(myClass,  10, 100, popFun, pushFun, initFun);
let myArrayPool  = new CachePool(myArray,  10, 100, popFun, pushFun, initFun);

// Gets cached object from pool, triggers 'popFun' with 'this' reference. 
let myObj1 = myObjectPool.pop();
let myCon1 = myConstrPool.pop();
let myCla1 = myClassPool.pop();
let myArr1 = myArrayPool.pop();

// Triggers 'pushFun' with 'this' reference, pushes used object back to pool. 
myObjectPool.push(myObj1);
myConstrPool.push(myCon1);
myClassPool.push(myCla1);
myArrayPool.push(myArr1);

// Clear out references.
myObj1 = undefined;
myCon1 = undefined;
myCla1 = undefined;
myArr1 = undefined;
```

<br>

##### Calling properties and methods as hook functions with `this` reference.

```javascript

// -------------------------------------------------
// Sample Object
// -------------------------------------------------

// We have a object with some hook functions as properties in it.
let myObject  = {
   id       : null,
   name     : "My Object",
   status   : "none",

   // Internal hook functions as properties.
   // We can point them to outer functions as well.
   objInit: function(){
      this.status  = "I am newly created and stored in the pool.";
      this.name    = "Cached Object";
      console.log(`objInit called on ${this.name} with id ${this.id}`,this);
   },
   
   objPop: function(){
      this.status ="I was popped out. Prepare me for some action.";
      this.id     = objectIdCounter++;
      this.name   = "Active Object";
      this.content = "Some Content";
      console.log(`objPop called on ${this.name} with id ${this.id}`,this);
   },
   
   objPush: function(){
      this.status="I'm being pushed back again. Resetting my props would be a good idea.";
      this.id    = null;
      this.name  = "Cached Object";
      this.content = "";
      console.log(`objPush called on ${this.name} with id ${this.id}`,this);
   }
}
// Counter for newly created object ids.
let objectIdCounter=0;


// -------------------------------------------------
// Sample Array
// -------------------------------------------------

let myArray = ["some content",1,2,3];

// Arrays can have custom properties and methods.
// But this can lead to unexpected behaviors and it's not recommended.

myArray.arrayInit = function(){
   this.status = "I am newly created and stored in the pool.";
   this.name   = "Cached Object";
   console.log(`arrayInit called on ${this.name} with id ${this.id}`,this);
}

myArray.arrayPop = function()(){
   this.status = "I was popped out. Prepare me for some action.";
   this.id     = this.constructor.idCounter++;
   this.name   = "Active Object";
   console.log(`arrayPop called on ${this.name} with id ${this.id}`,this);
}

myArray.arrayPush = function()(){
   console.log(`arrayPush called on ${this.name} with id ${this.id}`,this);
   this.status = "I'm being pushed back again. Resetting my props would be a good idea.";
   this.id     = null;
   this.name   = "Cached Object";
}


// -------------------------------------------------
// Sample Constructor Function
// -------------------------------------------------

// And a Constructor Function.
function myConstr{
   // We don't need provide init function for CachePool,
   // because this constructor will be triggered natively
   // when a cache object is created.
   //
   this.id       = null;
   this.name     = "Cached Object";
   this.status   = "I am newly created and stored in the pool.";
   console.log(`This is native constructor and being called on ${this.name} with id ${this.id}`,this);
}

myConstr.prototype.constrPop = function(){
   this.id       = myConstr.idCounter++;
   this.name     = "Active Object";
   this.status   = "I was popped out. Prepare me for some action.";
   this.content  = "Some Content";
   console.log(`constrPop called on ${this.name} with id ${this.id}`,this);
}

myConstr.prototype.constrPush = function(){
   this.id      = null;
   this.name    = "Cached Object";
   this.status  = "I'm being pushed back again. Resetting my props would be a good idea.";
   this.content = null;
   console.log(`constrPush called on ${this.name} with id ${this.id}`,this);
}
// Static counter for newly created object ids.
myConstr.idCounter = 0;


// -------------------------------------------------
// Sample Class
// -------------------------------------------------

// And a Class.
class myClass{
   // We don't need provide init function for CachePool,
   // because this constructor will be triggered natively when a cache object is created.
   // But if we can also provide a init function, it will be called when an object is created.
    constructor(){
      this.id       = null;
      this.name     = "Cached Object";
      this.status   = "I am newly created and stored in the pool.";
      console.log(`This is native constructor and being called on ${this.name} with id ${this.id}`,this);	
    }

   classPop(){
      this.id       = myClass.idCounter++;
      this.name     = "Active Object";
      this.status   = "I was popped out. Prepare me for some action.";
      this.content  = "Some Content";
      console.log(`classPop called on ${this.name} with id ${this.id}`,this);
   },

   classPush(){
      this.id      = null;
      this.name    = "Cached Object";
      this.status  = "I'm being pushed back again. Resetting my props would be a good idea.";
      this.content = null;
      console.log(`classPush called on ${this.name} with id ${this.id}`,this);
   }
   // Static counter for newly created object ids.
   static idCounter = 0;
};



// -------------------------------------------------
// Pools
// -------------------------------------------------

// We create new cache pools and give name of hook methods.

// 10 x 'initFun' will be called on the newly created objects with 'this' reference for each pool.
let myObjectPool = new CachePool(myObject, 10, 100, "objPop", "objPush", "objInit");
let myArrayPool  = new CachePool(myArray,  10, 100, "arrayPop", "arrayPush", "arrayInit");

// 10 x native constructor will be called on the newly created objects with 'this' reference for each pool.
let myConstrPool = new CachePool(myConstr, 10, 100, "constrPop", "constrPush"); // No init function is needed.
let myClassPool  = new CachePool(myClass,  10, 100, "classPop", "classPush");   // No init function is needed.

// Gets cached object from pool, triggers 'pop' hooks with 'this' reference. 
let myObj1 = myObjectPool.pop();
let myArr1 = myArrayPool.pop();
let myCon1 = myConstrPool.pop();
let myCla1 = myClassPool.pop();

// Triggers 'push' hooks with 'this' reference, pushes used object back to pool. 
myObjectPool.push(myObj1);
myArrayPool.push(myArr1);
myConstrPool.push(myCon1);
myClassPool.push(myCla1);

// Clear out references.
myObj1 = undefined;
myArr1 = undefined;
myCon1 = undefined;
myCla1 = undefined;

```
