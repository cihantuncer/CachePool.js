/** CachePool.js v1.0.0
* https://github.com/cihantuncer/cachepool.js
* (c) 2024, Cihan Tuncer - cihan@cihantuncer.com
* This code is licensed under MIT license (see LICENSE.md for details)
*/

class CachePool {

    /**
     * Creates new cache pool object.
     * @param {function|object} objectConstructor - Function or object to create new instances of for the cache pool.
     * @param {number} initSize - Initial size of the cache pool.
     * @param {number} maxSize - Maximum size of the cache pool. If not given, or set to 0, the pool will grow up to the memory limit.
     * @param {function|string} popCall - Function or function name to call on the object just before popping it from the pool. If set to true, the object itself is treated as a function.
     * @param {function|string} pushCall - Function or function name to call on the object just after pushing it to the pool. If set to true, the object itself is treated as a function.
     * @param {function|string} initCall - Function or function name to call on newly created objects. If not given, popCall is used by default.
     * @param {boolean} deepCopy - If true, the objectConstructor is used to create deep copies of the object to put in the cache pool. If false, the object itself is used.
     */
    constructor(objectConstructor, initSize = 1, maxSize, popCall, pushCall, initCall, deepCopy){
        
        if(CachePool.checkInput(initSize,"initial size") === false){
            initSize = 1;
        }

        this.tag               = "Cache Pool Object";
        this.stack             = [];
        this.slot              = 0;
        this.size              = initSize || 0;
        this.initSize          = initSize || 0;
        this.maxSize           = maxSize  || 0; (this.size > this.maxSize) && (this.maxSize = 0);
        this.initMaxSize       = this.maxSize;
        this.stack.length      = this.size;
        this.deepCopy          = deepCopy || false;
        this.pushCall          = pushCall;
        this.popCall           = popCall;
        this.initCall          = initCall || this.popCall;
        this.objectConstructor = objectConstructor && 
                                (typeof objectConstructor === "function" || typeof objectConstructor === "object") 
                                ? objectConstructor || objectConstructor.constructor
                                : {};
        for (let i = 0; i < this.size; i++) {
    
            this.stack[i] = this.new();
    
            // Created new object. Now call initCall function on it.
            CachePool.callFunc(this.stack[i],this.initCall);
    
            this.slot++;
        }
    }

    /**
     * Generates new object.
     * @returns {*} The new object.
     */
    new(){
        return (typeof this.objectConstructor == "function") ? new this.objectConstructor() : CachePool.cloneObject(this.objectConstructor, this.deepCopy)
    }

    /**
     * Pops an object from the cache pool and initializes it for use.
     * @param {...*} args - Arguments to pass to the initCall function.
     * @returns {*} The object taken from the cache pool, or a newly created one if none is available.
     */
    pop(...args){

        let obj;
    
        // We have available cache object in the pool. Pop object and decrease available slots count by one.
        if(this.slot > 0){
            this.slot--;
            obj = this.stack[this.slot];
            this.stack[this.slot] = undefined;
        }
    
        // No object left in the cache pool. Create new one to use.
        else{
            obj = (typeof this.objectConstructor === "function") ? 
                   new this.objectConstructor() :
                   CachePool.cloneObject(this.objectConstructor,this.deepCopy);
        }

        // Object provided. Initialize for use. 
        CachePool.callFunc(obj,this.popCall,...args);

        return obj;
    }
    
    /**
     * Pushes an object to the cache pool, first deinitializing it with the pushCall function.
     * @param {*} obj - The object to push to the cache pool.
     * @param {...*} args - Arguments to pass to the pushCall function.
     */
    push(obj,...args){
        
        if(!obj)
            return;

        // First, deinit (or whatever you want before storing it in the cache) object to its defaults.
        CachePool.callFunc(obj,this.pushCall,...args);
        // Then, store it in the cache pool.
        if(this.slot < this.maxSize || this.maxSize <= 0){
            this.stack[this.slot++] = obj;
            (this.slot > this.size) && (this.size = this.slot)
        }
    }
    
    /**
     * Resets the cache pool to its initial state.
     */
    reset(){
    
        this.slot         = 0;                   // Reset slot
        this.size         = this.initSize;       // Reset size
        this.stack.length = this.initSize;       // Empty array
        this.maxSize      = this.initMaxSize; // Reset max size

        for(let i=0; i < this.size; i++){
            this.stack[i] = this.new();
            CachePool.callFunc(this.initCall,this.stack[i]);
            this.slot++;
        }
    }
    
    /**
     * Increase cache pool by given number or 25% of its size by default.
     * @param {number} [add] - Number to increase the cache pool by.
     * If not given, or set to 0, the pool will expand to 25% of its original size.
     */
    expand(add){
    
        add = CachePool.checkInput(add,"expand",null,undefined,0);

        if(add === false){
            return;
        }

        add = (add && add > 0) ? add : Math.floor(this.size*0.25);

        let newSize = this.size + add;

        newSize = (newSize > this.maxSize && this.maxSize > 0) ? this.maxSize : newSize;

        this.size = newSize;

        let maxAdd = this.slot + add;

        if(maxAdd > this.maxSize && this.maxSize > 0){
            maxAdd = this.maxSize;
        }

        for(; this.slot < maxAdd; this.slot++){
            this.stack[this.slot] = this.new();
            CachePool.callFunc(this.stack[this.slot],this.initCall);
        }

        this.slot > this.size && (this.size = this.slot);
        this.stack.length = this.size;
    }

    /**
     * Decrease cache pool by given number.
     * @param {number} [remove] - Number to decrease the cache pool by.
     * If not given, or set to 0, the pool will shrink down to filled stack size.
     */
    shrink(remove){

        remove = CachePool.checkInput(remove,"shrink");

        if(remove === false){
            return;
        }

        const willRemove = !remove ? this.size - this.slot : (remove > this.slot ? this.slot : remove);
    
        this.size -= willRemove;
        this.stack.length = this.size;
        
        if(this.slot > this.size){
            this.slot = this.size;
        }
    }

    /**  
     * Sets the size of the cache pool.
     * @param {number} size - The new size of the cache pool.
    */
    setSize(size){

        size = CachePool.checkInput(size,"size");

        if(size === false){
            return;
        }

        const newSize = Math.floor(( this.maxSize > 0 && size > this.maxSize) ? this.maxSize : size < 0 ? 0 : size);
        
        this.size = newSize;
        this.stack.length = newSize;

        if(this.slot > this.size){
            this.slot = this.size;
        }

    }

    /**
     * Sets the maximum size of the cache pool.
     * @param {number} maxSize - The new maximum size of the cache pool.
    */
    setMaxSize(maxSize){

        maxSize = CachePool.checkInput(maxSize,"maxSize",0,undefined,null);

        if(maxSize === false){
            return;
        }

        this.maxSize = !maxSize ? 0 : maxSize;

        if(this.maxSize === 0)
            return;

        if(this.size >= this.maxSize){
            this.size = this.maxSize;
            this.stack.length = this.maxSize;
        }

        if(this.slot >= this.maxSize){
            this.slot = this.maxSize;
        }

    }

    /**
     * Calls a function on an object, either directly or by looking up a method by name.
     * Used internally by the CachePool class.
     * @param {*} obj - The object to call the function on.
     * @param {boolean|string|function} func - The function to call.
     * If true, the object itself is called as a function.
     * If a string, the object's method with that name is called.
     * If a function, that function is called with the object as 'this'.
     * @param {...*} args - Arguments to pass to the called function.
     */
    static callFunc(obj,func, ...args){

        const noArgs = args.length === 0;

        if (func){

            const funType = typeof func;

            // Object itself is a Call function
            if(func === true && typeof obj === "function"){
                noArgs ? obj() : obj.call(undefined,...args);
            }
            // Call is a function
            else if(funType === "function"){

                noArgs ? func.call(obj) : func.call(obj,...args);
            }
            // Call is a method name of cached object
            else if(funType === "string" && obj[func]){

                noArgs ? obj[func]() : obj[func].call(obj,...args);
            }
        }
    }

    /**
     * Checks if the input is a valid number and returns it.    
     * @param {number} input - The number to check.
     * @param {string} name - The name of the input.
     * @param {...*} args - Allowed values for the input.    
     */
    static checkInput(input,name,...args){

        if(args && args.includes(input)){
            return input;
        }

        if(typeof input !== "number" || input < 0){
            !CachePool.debug && console.error(`Can't set ${name} value of cache pool to a negative or non-number:`,input);
            return false;
        }else if(Number.isInteger(input) === false){
            input = Math.floor(input);
            !CachePool.debug && console.debug(`${name} value is floored to a integer:`,input);
        }
        return input;
    }


    /** Returns the type of the object constructor  
     * @param {object} objectConstructor
     */
    static getConstructorType(objectConstructor){

        return typeof objectConstructor === "function" ? "function" :
               Array.isArray(objectConstructor)        ? "array"    :
               objectConstructor instanceof Object     ? "object"   :
               "unknown";
    }

    static cloneObject = cloneObject;
    static debug=false;
}

/**
 * Clones an object.
 * @function cloneObject
 * @param {object} obj - The object to clone.
 * @param {boolean} deep - Whether to clone the object recursively.
 * @returns {object} The cloned object.
 */
function cloneObject(obj, deep = true, visiteds = new WeakMap()) {

    if (!obj || typeof obj !== 'object')
        return obj;

    // Circular Reference
    if (visiteds.has(obj))
        return visiteds.get(obj);

    let clone;

    // Regular  Objects
    if(obj.constructor === Object) {
        clone = Object.create(Object.getPrototypeOf(obj));
        visiteds.set(obj, clone);
        const keys = [...Object.keys(obj), ...Object.getOwnPropertySymbols(obj)];
        keys.forEach(key => {
            clone[key] = deep ? cloneObject(obj[key], true, visiteds) : obj[key];
        });
    }

    // Array
    else if (Array.isArray(obj)) {
        clone = [];
        visiteds.set(obj, clone);
        clone = obj.map(item => (deep ? cloneObject(item, true, visiteds) : item));

        // Clone custom array properties
        Object.keys(obj).forEach(key => {
            if (!Number.isInteger(parseInt(key))) {
                clone[key] = deep ? cloneObject(obj[key], true, visiteds) : obj[key];
            }
        });

    }

    // Map 
    else if (obj instanceof Map) {
        clone = new Map();
        visiteds.set(obj, clone);
        obj.forEach((value, key) => {
            const clonedKey = deep ? cloneObject(key, true, visiteds) : key;
            const clonedValue = deep ? cloneObject(value, true, visiteds) : value;
            clone.set(clonedKey, clonedValue);
        });
    }
    // Set
    else if (obj instanceof Set) {
        clone = new Set();
        visiteds.set(obj, clone);

        for (let value of obj){
            const clonedValue = deep ? cloneObject(value, true, visiteds) : value;
            clone.add(clonedValue);  
        }
    }
    // Date
    else if (obj instanceof Date) {
        clone = new Date(obj);
    }

    // RegExp
    else if (obj instanceof RegExp) {
        clone = new RegExp(obj);
    }

    // Error
    else if (obj instanceof Error) {
        clone       = new obj.constructor(obj.message);
        clone.name  = obj.name;
        clone.stack = obj.stack;
        visiteds.set(obj, clone);
    }

    // ArrayBuffer, TypedArray
    else if (obj instanceof ArrayBuffer) {
        clone = deep ? obj.slice(0) : obj;
    }
    else if (ArrayBuffer.isView(obj) && !(obj instanceof DataView)) {
        clone = deep ? new obj.constructor(obj) : obj;
    }
    else if (obj instanceof DataView) {
        clone = deep ? new DataView(obj.buffer.slice(0), obj.byteOffset, obj.byteLength): obj;
    }

    // Functions (as references)
    else if (typeof obj === 'function') {
        clone = obj;
    }

    // WeakMap, WeakSet (as empty references)
    else if (obj instanceof WeakMap) {
        clone = new WeakMap();
        visiteds.set(obj, clone);
    } else if (obj instanceof WeakSet) {
        clone = new WeakSet();
        visiteds.set(obj, clone);
    }
    else{
        !CachePool.debug && console.warn("Unknown object type encountered:", obj);
        return null;
    }


    return clone;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CachePool;
}
else{
    window.CachePool=CachePool;
}

