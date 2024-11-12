/** CachePool.js Test Script v1.0
* https://github.com/cihantuncer/cachepool.js
* (c) 2024, Cihan Tuncer - cihan@cihantuncer.com
* This code is licensed under MIT license (see LICENSE.md for details)
*/

if (typeof CachePool !== "function") {

  if (typeof module !== "undefined" && module.exports) {
    CachePool = require("../cachepool.js");
  } 
  else if (typeof window !== "undefined") {
    window.CachePool = window.CachePool || require("../cachepool.js"); 
    CachePool = window.CachePool;
  }
}

if (typeof CachePool !== "function") {
  throw new Error("CachePool module not found.");
}

CachePool.debug=true;


// ********************************************************
// *** Utilities ******************************************
// ********************************************************

const def      = "font-style:initial; color:initial; background-color:initial;"
const note     = "font-style:italic; color:#bcbcbc"
const tag      = "background-color:#a4afe9; color: black;"
const tag_     = "background-color:#7f90e3; color: black; font-weight:bold"
const tag2     = "background-color:#ea96ff; color: black;"
const tag2_    = "background-color:#da7bf2; color: black; font-weight:bold"
const tagWARN  = "background-color:#e0ce84; color: black;"
const tagWARN_ = "background-color:#f2d769; color: black; font-weight:bold;"
const tagOK    = "background-color:#96d78e; color: black;"
const tagOK_   = "background-color:#77d06b; color: black; font-weight:bold"
const tagERR   = "background-color:#d7938e; color: black;"
const tagERR_  = "background-color:#e37f78; color: black; font-weight:bold"

function icon(val){
    return val === true ? "✅" : val === false ?"❌" : "";
}

function randChars(length) {

    length = length ?? 4;

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const cLen = chars.length;
    
    let res="";

    for (let i = 0; i < length; i++) {

        res += chars.charAt(Math.floor(Math.random() * cLen));
    }
    return res;
}

// ********************************************************
// *** Test Functions *************************************
// ********************************************************

function Test(testEntries,pool){

    for (let i=0; i < testEntries.length; i++) {

        const testEntry = testEntries[i];

        if(testEntry.method === "cloneObject"){
            Test.testCloning(testEntry);
            continue;
        }

        if(Test.command(testEntry))
            continue;

        Test.getPool(testEntry, pool);

        if(!Test.process(testEntry))
            continue;

        if(!Test.watch(testEntry)){
            continue;
        }

        if(testEntries.length - 1 === i){
            Test.db = {};
        }
    }
}

Test.cloneConstrTest = function(testEntry){

    if(testEntry.input.constructor !== testEntry.clone.constructor){

        Test.output(
            "> "+icon(false),
            [testEntry.methodTxt,tagERR],
            [`${testEntry.name},${testEntry.name}Clone constructors are not same`,tagERR_],
            [ `constructor test`,tagWARN]
        );
        return false;
    }

    return true;
}

Test.clonePropTest = function(testEntry){

    let test     = testEntry.test ?? "testProp";
    let testTxt  = `.${test}`;
    let pass,eqVal,pEQ=false,eqType;

    if(testEntry.input.constructor === Object){
        eqVal = testEntry.input[test] === testEntry.clone[test];
    }
    else if(testEntry.input.constructor === Array){
        test    = testEntry.test ?? 0;
        eqVal   = testEntry.input[test] === testEntry.clone[test];
        testTxt = `[${test}]`;
    }
    else if(testEntry.input instanceof Map){
        eqVal   = testEntry.input.get(test) === testEntry.clone.get(test);
        testTxt = `.get("${test}")`;
    }
    else if(testEntry.input instanceof Set){
        let test = testEntry.test ?? 0, j=0, val1,val2;

        j=0; for (let item of testEntry.input) {if(j==test){val1=item; break; }j++;}
        j=0; for (let item of testEntry.clone) {if(j==test){val2=item; break; }j++;}
      
        eqVal   = val1 === val2;
        testTxt = `:${test}`;
    }
    else if(testEntry.input instanceof ArrayBuffer){
        eqVal   = testEntry.input === testEntry.clone;
        testTxt = ``;
    }
    else if(testEntry.input instanceof DataView){
        eqVal   = testEntry.input === testEntry.clone;
        testTxt = ``;
    }
    else if(testEntry.input instanceof Error){
        eqVal   = testEntry.input.stack === testEntry.clone.stack;
        testTxt = `.stack`;
        pEQ=true
    }
    else if(testEntry.input instanceof Date){
        eqVal   = testEntry.input.getTime() === testEntry.clone.getTime();
        testTxt = `.getTime()`;
        pEQ=true;
    }
    else if(testEntry.input instanceof RegExp){

        const srcEQ  = testEntry.input.source === testEntry.clone.source;
        const flagEQ = testEntry.input.flags  === testEntry.clone.flags;

        testTxt = `.flags|sources`;

        pEQ=true;
        eqVal = srcEQ && flagEQ;
        
    }
    else{
        return;
    }

    pass = testEntry.deep ? !eqVal : eqVal;

    if(pEQ){
        pass = eqVal;
        testEntry.methodTxt = `${testEntry.method}(${testEntry.name},true/false)`;
        testEntry.cloneType = "shallow/deep clone";
    }
    
    let tagPass= pass ? tagOK : tagERR;

    let exp = !pass ? ` (expected ${!pass})` : '';
    let eqL = `${testEntry.name}${testTxt}`
    let eqR = `${testEntry.name}Clone${testTxt}`
    let eqE = eqType ? eqType : "===";
    let eqC = ` = ${eqVal}${exp}`

    Test.output(
        "> "+icon(pass),
        [testEntry.methodTxt,tagPass],
        [eqL,tag],[eqE,tag+"color:blue"],[eqR,tag],[eqC,tagPass],
        [testEntry.cloneType+" prop test",tagWARN]
    );

    return true;
}

Test.testCloning = function(testEntry){

    testEntry.deep      = testEntry.deep ?? true;
    testEntry.clone     = CachePool.cloneObject(testEntry.input,testEntry.deep);

    testEntry.methodTxt = `${testEntry.method}(${testEntry.name},${testEntry.deep})`;
    testEntry.cloneType = testEntry.deep ? "deep clone" : "shallow clone";

    Test.cloneConstrTest(testEntry);
    Test.clonePropTest(testEntry);
}

Test.watch = function(testEntry){

    if(!testEntry.watch)
        return false;

    testEntry.result = Test.checkPoolProp(testEntry.pool,testEntry.watch,testEntry.expected);

    Test.propTestOutput(testEntry); 
  
    return true;
}

Test.getPool = function(testEntry,pool){
   
    const poolName = typeof testEntry?.pool === "string" ? testEntry?.pool : null;

    testEntry.pool = poolName ? Test?.db[testEntry.pool] : testEntry?.pool ?? pool;
                     
    if (!testEntry.pool) {

        testEntry.pool =new CachePool(
            testEntry?.constructor,
            testEntry?.size ?? 10,
            testEntry?.maxSize||10,
            testEntry?.calls?.[0], 
            testEntry?.calls?.[1],
            testEntry?.calls?.[2],
            testEntry?.deepCopy
        );

        poolName && (Test.db[poolName] = testEntry.pool);
    }

}

Test.process = function(testEntry){

    if(typeof testEntry.pool[testEntry?.method] !== "function"){
        return false;
    }

    testEntry.loaded = testEntry.load ? Test.db[testEntry.load] : false;
    testEntry.save && ( Test.db[testEntry.save] = [] );

    const repeat = testEntry.repeat ? testEntry.repeat :
                   testEntry.loaded ? testEntry.loaded.length :
                   1;

    for(let j=0; j < repeat; j++){

        let input;

        if( testEntry.input !== undefined ){
            input = testEntry.input;
        }
        else if(testEntry.new){
            input = testEntry.pool.new();
        }
        else if(testEntry.loaded){
            input = testEntry.loaded[j] ? testEntry.loaded[j] : testEntry.pool.new();
        }

        const process = testEntry.pool[testEntry.method](input);

        testEntry.save && Test.db[testEntry.save].unshift(process);
    }

    return true;


}

Test.command = function(testEntry,pool){

    let com, comVal, comArgs;

    if(typeof testEntry === "string"){
        com = testEntry;
    }
    else if(testEntry?.constructor === Array){
        [com, comVal, ...comArgs] = testEntry;
    }

    if(typeof com === "string" && typeof Test[com] == "function"){

        if(com === "stackBar"){

            Test.stackBar(Test?.db?.[comVal] || pool, ...comArgs);

            return true;
        }

        Test[com](comVal, ...comArgs); 
        return true;
    }
    else if(com === "Notice"){
        console.log(`  %c${com}: ${comVal}`,note);
        return true;
    }
    else if(typeof com === "string"){
        comArgs ? console.log(com,(comVal || ""),...comArgs) : console.log(com,(comVal || ""));
        return true;
    }
}

Test.checkPoolProp = function(pool,propName,expectedValue,msg){

    if(typeof expectedValue !== "number" || expectedValue < 0){
        return [` %c ${propName} OK: Can't set to a negative or non-number. %c `,tag,def];  
    }
    else{
        expectedValue = Math.floor(expectedValue);
    }

    msg = msg ?? "";

    const resultValue = propName === "stack" ? pool?.stack?.length : pool[propName];
    const pass        = resultValue  === expectedValue  ? true : false;

    let result = {
        name       : propName,
        message    : msg,
        expected   : expectedValue,
        result     : resultValue,
        text       : `${propName}:${resultValue}${pass ? "" : ` (Expected: ${expectedValue})`}`,
        pass       : pass,
        tag        : pass ? tagOK : tagERR,
        icon       : pass ? "✅" : "❌",
    };

    return result;
}

Test.propTestOutput = function(testEntry,input){
    
    input = input !== undefined ? input : 
            testEntry.new ? `<${CachePool.getConstructorType(testEntry.pool)}>` :
            testEntry.input !== undefined ? testEntry.input :
            "";

    const repX    = testEntry.repeat > 1 ? ` x ${testEntry.repeat}` : "";
    const mName   = `${testEntry.method}(${input})${repX}`;
    const resText = testEntry.result.text ? testEntry.result.text: "";
    const info    = testEntry.info ? testEntry.info : "";
    const bar     = testEntry.bar ? Test.stackBar(testEntry.pool,true) : "";
    const resMsg  = testEntry?.result?.message ?? "";
    const other   = `${bar}${resMsg}`; 

    let tagPass= testEntry.result.pass ? tagOK : tagERR;

    Test.output(
        "> "+icon(testEntry.result.pass),
        [mName,tagPass],
        [resText,tag],
        [info,tagWARN],
        other
    );
}

Test.checkPool = function(msg="",pool,size,max,slot,bar){

    msg  = msg  ?? "";
    size === true ? ( bar = true ) && ( size = pool.size ) : (size = size ?? pool.size)
    max  = max  ?? pool.maxSize;
    slot = slot ?? pool.slot;

    slot = slot ?? size;

    const _size        = Test.checkPoolProp(pool,"size",size);
    const _maxSize     = Test.checkPoolProp(pool,"maxSize",max);
    const _stackLength = Test.checkPoolProp(pool,"stack",size);
    const _slot        = Test.checkPoolProp(pool,"slot",slot);

    const size_        = `%c ${_size.text} %c `;
    const maxSize_     = `%c ${_maxSize.text} %c `;
    const stackLength_ = `%c ${_stackLength.text} %c `;
    const slot_        = `%c ${_slot.text} %c `;
    const msg_         = msg ? `${msg} ` : "";
    const bar_         = bar ? Test.stackBar(pool,true) : "";

    console.log(
        `> ${msg_}${size_}${maxSize_}${stackLength_}${slot_}${bar_}`,
        _size.tag,def,_maxSize.tag,def,_stackLength.tag,def,_slot.tag,def
    );
}

Test.callerOutput = function (caller,state,msg){

    const caller_ = `%c ${caller} `;
    const state_  = `%c ${state} `;
    const msg_    = msg ? `%c ${msg} ` : "%c";
    const end_    = "%c";

    console.log(`> ${caller_}${state_}${msg_}${end_}`,tag2,tag,tagWARN,def);
}

Test.stackBar = function(pool,msg){

    if(typeof pool !== "object")
        return;

    msg = msg ?? "";

    let cEmpty="▒";
    let cSlot="█";

    let bar="";
    let i = 1;

    for (; i < pool.size+1; i++) {

        if(i > pool.slot){
            bar += cEmpty+" ";
        }
        else{
            bar += cSlot+" ";
        }
    }
    bar += pool.maxSize > 0 ? `(Max size: ${pool.maxSize})` : "∞";

    if(msg === true){
        return `${pool.slot} / ${pool.size} ${bar}`;
    }

    console.log(`> ${msg} ${pool.slot} / ${pool.size} ${bar}`);

}

Test._output = function(pass,part1,part2,part3,other=""){

    const tags = [];

    const pass_  = pass ? "✅" : "❌";
    const part1_ = part1 ? `${pass_} %c ${part1} ` : '';
    part1_ && ( pass ? tags.push(tagOK) : tags.push(tagERR));

    const part2_ = part2 ? `%c ${part2} ` : '';
    part2_ && tags.push(tag);

    const part3_ = part3 ? `%c ${part3} ` : '';
    part3_ && tags.push(tagWARN);

    console.log(`> ${part1_}${part2_}${part3_}%c ${other}`,...tags,def);
}

Test.output = function(...args){

    let str="", tags=[];
   
    for (let i = 0; i < args.length; i++) {

        const arg = args[i];

        if( typeof arg === "string" ){
            str += `%c ${arg} `;
            tags.push(def);
        }
        else if (Array.isArray(arg)){
            str += `%c ${arg[0]} `;
            tags.push(arg[1]);
        }
        
    }

    str +=" %c ";
    tags.push(def);

    console.log(str,...tags);
}

Test.db={};



// ********************************************************
// *** Preparation for Test *******************************
// ********************************************************

// *** Hook functions for all cache objects. --------------
// They are shared across all cache objects for sake of test code simplicity.

function initCall(){

    const state="created and added to the pool";
    const callName = "initCall";

    let content, cloneType;

    if( this.constructor === Object || Array.isArray(this) ){
        cloneType="clone";
        this.id=this.constructor === Object ? sampleObjectCounter++ : sampleArrayCounter++;
    }
    else{
        cloneType="instance";
    }

    if(Array.isArray(this)){
        this[this.length-1]=randChars();
        content=`[${this.toString()}]`;
    }
    else{
        content = this.someContent = `someContent:${randChars()}`;
    }

    const name   = `${this.name} ${cloneType} ${this.id+1}`;
    const output = `id:${this.id}, ${content}`;

    Test.callerOutput(callName,`${name} ${state}`,output);

}

function popCall(){

    const state="popped from the pool";
    const callName = "popCall";

    let content, cloneType;

    if( this.constructor === Object || Array.isArray(this) ){
        cloneType="clone";
    }
    else{
        cloneType="instance";
    }

    if(Array.isArray(this)){
        content=`[${this.toString()}]`;
    }
    else{
        content = this.someContent;
    }
    
    const name   = `${this.name} ${cloneType} ${this.id+1}`;
    const output = `id:${this.id}, ${content}`;

    Test.callerOutput(callName,`${name} ${state}`,output);

}

function pushCall(){

    const state="pushed to the pool";
    const callName = "pushCall";

    let content, cloneType;

    if( this.constructor === Object || Array.isArray(this) ){
        cloneType="clone";
    }
    else{
        cloneType="instance";
    }

    if(Array.isArray(this)){
        content=`[${this.toString()}]`;
    }
    else{
        content = this.someContent;
    }
    
    const name   = `${this.name} ${cloneType} ${this.id+1}`;
    const output = `id:${this.id}, ${content}`;

    Test.callerOutput(callName,`${name} ${state}`,output);
}


// *** Sample Array -----------------------------------------

let sampleArrayCounter = 0;
const sampleArray = ["some content",randChars()];

// Notice:
// Arrays can have custom properties and methods.
// But this may lead to unexpected behaviors and it's not recommended.
sampleArray.name="sampleArray";
sampleArray.id=0;
sampleArray.someContent=0;
sampleArray.arrayInit = initCall;  // Hook function as a property
sampleArray.arrayPop  = popCall;   // Hook function as a property
sampleArray.arrayPush = pushCall;  // Hook function as a property



// *** Sample Object --------------------------------------

let sampleObjectCounter = 0;

const sampleObject = {
    name:"sampleObject",
    id  : 0,
    someContent: 0,
    objectInit: initCall, // Hook function as a property
    objectPop : popCall,  // Hook function as a property
    objectPush: pushCall  // Hook function as a property
}


// *** Sample Constructor Function -------------------------

const sampleConstructor = function(){
    this.name = "sampleConstructor";
    this.id   = sampleConstructor.counter++;
    this.someContent = randChars();
}

sampleConstructor.counter=0;
sampleConstructor.prototype.constructorInit = initCall;  // Hook function as a prototype method
sampleConstructor.prototype.constructorPop  = popCall;   // Hook function as a prototype method
sampleConstructor.prototype.constructorPush = pushCall;  // Hook function as a prototype method


// *** Sample Class -----------------------------------------

class sampleClass{

    constructor(){
        this.name = "sampleClass"
        this.id   = sampleClass.counter++;
        this.someContent = randChars();
    }

    classInit = initCall;  // Hook function as a class method
    classPop  = popCall;   // Hook function as a class method
    classPush = pushCall;  // Hook function as a class method

    static counter = 0;
}


// *****************************************************************
// *** Tests *******************************************************
// *****************************************************************


// *** Test 1 -----------------------------------------

let samplePool = new CachePool(sampleObject,5,10);

let test1=[

    "Test 1 : Basic Tests",
    ["%cBasic functionality and boundary tests without hook functions.",note],
    ["checkPool","Pool created",samplePool,true],

    "1.1 Max Size Tests",
    { method:"setMaxSize", input:-1   ,watch:"maxSize", expected:10 ,info:"neutral value"      ,bar:true },
    { method:"setMaxSize", input:0    ,watch:"maxSize", expected:0  ,info:"unlimited max size" ,bar:true },
    { method:"setMaxSize", input:15.5 ,watch:"maxSize", expected:15 ,info:"floored to int"     ,bar:true },

    "1.2 Size Tests",
    { method:"setSize" ,input:-1   ,watch:"size" ,expected:5  ,info:"neutral value"            ,bar:true },
    { method:"setSize" ,input:12.5 ,watch:"size" ,expected:12 ,info:"floored to int"           ,bar:true },
    { method:"setSize" ,input:100  ,watch:"size" ,expected:15 ,info:"max size reached"         ,bar:true },
    { method:"setSize" ,input:8    ,watch:"size" ,expected:8  ,info:"sets pool size"           ,bar:true },
    { method:"setSize" ,input:0    ,watch:"size" ,expected:0  ,info:"loses all cached objects" ,bar:true },
    { method:"setSize" ,input:5    ,watch:"size" ,expected:5  ,info:"sets pool size"           ,bar:true },

    "1.3 Expand Tests",
    { method:"expand" ,input:4    ,watch:"slot" ,expected:4  ,info:"expands pool with new caches" ,bar:true },
    { method:"expand" ,input:-1   ,watch:"slot" ,expected:4  ,info:"neutral value"                ,bar:true },
    { method:"expand" ,input:null ,watch:"slot" ,expected:6  ,info:"expands pool 25% by its size" ,bar:true },
    { method:"expand" ,input:0    ,watch:"slot" ,expected:8  ,info:"expands pool 25% by its size" ,bar:true },
    { method:"expand" ,input:100  ,watch:"slot" ,expected:15 ,info:"max size reached"             ,bar:true },
    
    "1.4 Shrink Tests",
    { method:"shrink" ,input:""   ,watch:"slot" ,expected:15 ,info:"neutral value"     ,bar:true },
    { method:"shrink" ,input:-1   ,watch:"slot" ,expected:15 ,info:"neutral value"     ,bar:true },
    { method:"shrink" ,input:0    ,watch:"slot" ,expected:15 ,info:"neutral value"     ,bar:true },
    { method:"shrink" ,input:3    ,watch:"slot" ,expected:12 ,info:"shrinks pool size" ,bar:true },
    { method:"shrink" ,input:100  ,watch:"slot" ,expected:0  ,info:"stops at 0"        ,bar:true },

    "1.5 Reset Tests",
    { method:"reset" ,input:""  ,watch:"size" ,expected:5 ,info:"resets pool to its initial state"  ,bar:true },

    "1.6 Pop Tests: Pop objects from cache pool to use",
    { method:"pop" ,repeat:3  ,watch:"slot" ,expected:2 ,info:"pops cached object"                   ,bar:true },
    { method:"pop" ,repeat:15 ,watch:"slot" ,expected:0  ,info:"popped 2 objects, 13 newly generated" ,bar:true },
    ["Notice","If the pool runs out of cache objects, as many as needed are automatically generated."],

    "1.7 Push Tests: Push used or newly created objects to cache pool",
    { method:"push" ,new:true ,repeat:3   ,watch:"slot" ,expected:3 ,info:"pushes object to pool" ,bar:true },
    { method:"push" ,new:true ,repeat:100 ,watch:"slot" ,expected:10 ,info:"max size reached"     ,bar:true },
    ["Notice","If the maximum size of the pool is reached, the remaining push objects are discarded."],

    { method:"setMaxSize"  ,input:0  ,watch:"maxSize" ,expected:0 ,info:"max size limit changed"  ,bar:true },
    { method:"push" ,new:true ,repeat:5 ,watch:"slot" ,expected:15 ,info:"accepts new pushes"     ,bar:true },

]; Test(test1,samplePool);

// *** Test 2 -----------------------------------------

let test2=[

    "",
    "Test 2 : Hook Functions Tests",
    [`%cCall hook functions directly, as properties or as methods.`,note],
    [`%cAll hook functions point to created cache object as "this" reference.`,note],
    "",

    "2.1 Hook Tests for Array (Calling functions directly with 'this' reference)",
    { pool:"arrayPool" ,constructor:sampleArray ,size:6 ,maxSize:10 ,calls:[popCall,pushCall,initCall] },
    ["stackBar","arrayPool","Array Pool created"],

    { method:"pop" ,pool:"arrayPool" ,repeat:3  ,save:"pops" },
    ["stackBar","arrayPool", "Cache objects popped from pool."],

    { method:"push" ,pool:"arrayPool" ,load:"pops" },
    ["stackBar","arrayPool", "Cache objects pushed to pool."],

    "",
    "2.2 Hook Tests for Object (Calling functions as properties with 'this' reference)",
    { pool:"objectPool" ,constructor:sampleObject ,size:6 ,maxSize:10 ,calls:["objectPop","objectPush","objectInit"] },
    ["stackBar","objectPool","Object Pool created"],

    { method:"pop" ,pool:"objectPool" ,repeat:3 ,save:"pops" ,info:"Object Pool" },
    ["stackBar","objectPool", "Cache objects popped from pool."],

    { method:"push" ,pool:"objectPool" ,load:"pops" ,info:"Object Pool" },
    ["stackBar","objectPool", "Cache objects pushed to pool."],

    "",
    "2.3 Hook Tests for Constructor Function (Calling functions as methods with 'this' reference)",
    { pool:"constructorPool" ,constructor:sampleConstructor ,size:6 ,maxSize:10 ,calls:["constructorPop","constructorPush","constructorInit"] },
    ["stackBar","constructorPool","Object Pool created"],

    { method:"pop" ,pool:"constructorPool" ,repeat:3 ,save:"pops" ,info:"Object Pool" },
    ["stackBar","constructorPool", "Cache objects popped from pool."],

    { method:"push" ,pool:"constructorPool" ,load:"pops" ,info:"Object Pool" },
    ["stackBar","constructorPool", "Cache objects pushed to pool."],

    "",
    "2.4 Hook Tests for Class (Calling functions as methods with 'this' reference)",
    { pool:"classPool" ,constructor:sampleClass ,size:6 ,maxSize:10 ,calls:["classPop","classPush","classInit"] },
    ["stackBar","classPool","Object Pool created"],

    { method:"pop" ,pool:"classPool" ,repeat:3 ,save:"pops" ,info:"Object Pool" },
    ["stackBar","constructorPool", "Cache objects popped from pool."],

    { method:"push" ,pool:"classPool" ,load:"pops" ,info:"Object Pool" },
    ["stackBar","constructorPool", "Cache objects pushed to pool."],


]; Test(test2);

// *** Test 3 -----------------------------------------

// Test Objects
const array       = [{ a:1,b:2 },1,2,3]
const object      = {testProp:{a:1,b:2},x:1,y:2}
const map         = new Map([["testProp",{a:1,b:2}],["x",1],["y",2]])
const set         = new Set([{a:1,b:2},1,2]) 
const arrayBuffer = new ArrayBuffer(10)
const dataView    = new DataView(arrayBuffer)
const regex        = /abc/gi;


let test3 = [

    "",
    "Test 3 : Clone Tests",
    ["%ccloneObject( objectToBeCloned , deepClone? )",note],

    { name:"array"       ,input:array  ,test:0             ,method:"cloneObject" },
    { name:"object"      ,input:object ,test:"testProp"    ,method:"cloneObject" },
    { name:"map"         ,input:map    ,test:"testProp"    ,method:"cloneObject" },
    { name:"set"         ,input:set    ,test:0             ,method:"cloneObject" },
    { name:"arrayBuffer" ,input:arrayBuffer                ,method:"cloneObject" },
    { name:"dataView"    ,input:dataView                   ,method:"cloneObject" },
    { name:"error"       ,input:new Error("error message") ,method:"cloneObject" },
    { name:"date"        ,input:new Date()                 ,method:"cloneObject" },
    { name:"regex"       ,input:regex                      ,method:"cloneObject" },

]; Test(test3);

console.log("\n\n");
