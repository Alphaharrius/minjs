/**
 * min.js v0.1.0 Beta Build
 * (c) 2019 Chan Hing Nin Harry (Alphaharrius)
 * 
 * Features in this version:
 * - watcher
 * - data binding
 * - data bounder
 * - conditional rendering
 * - event handler
 * - two way data binding
 * - reactive content
 * 
 * The library header included a require function for 
 * importing external library into the current window,
 * this can be removed if Babel/Webpack/ES6 is avaliable.
 * 
 */

/**
 * Dev Log
 * - Implemented Watcher.
 * - Tested the functionality of Watcher, Passed.
 * - Upcoming work to implement the Update Checker that runs watcherMASGC automatically.
 * - Upcoming work to migrate the Parallex DOM and implement new APIs.
 * - Migrated the Parallex DOM
 * - Upcoming work to migrate the Autoworker runtime and implement new APIs.
 * - Abandoned Autoworker for a new implementation of runtime with IntervalHandler.
 * - Implemented one way data bindings.
 */

(function(global, factory){ 
    global.module === undefined && 
    typeof global.module !== 'object' ? global.module = {exports : undefined} : {}, 
    global.require = global.require ? global.require : function(url){ var req = new this.XMLHttpRequest();
    req.open('GET', url, false); req.send(null); if(req.status === 200){try{this.eval(req.responseText);}
    catch(e){return warn('require', 'Failed to import, ' + e);} var imported = this.module.exports;
    this.module.exports = undefined; if(imported !== undefined){ console.log('$import', 'From "' + url 
    + '"'); return imported;}else return console.warn('require', 'Unable to located imports...');}else
    return warn('require', 'Unable to import target file...');}, global.Min = factory(global), 
    global.Min.version = '0.1.0';
})(this, function(){

    /**
     * Similar to Function.prototype.bind,
     * when this will not affect the 'this'
     * value binded to this function.
     */
     Function.prototype.pass = function(){
        var args = arguments;
        var func = this;
        return function(){
            return func.apply(this, args);
        }
    }
        
    function polyfillBind(){
        var args = arguments;
        var func = this;
        return function(){
            return func.apply(this, args);
        }
    }

    var nativeBind = Function.prototype.bind;

    Function.prototype.bind = nativeBind ? nativeBind : polyfillBind;

    function isDef(m){
        return m !== null && m !== undefined;
    }

    function isUndef(m){
        return m !== null && m === undefined;
    }

    function isObject(m){
        return m !== null && typeof m === 'object';
    }

    function isFunction(m){
        return m !== null && typeof m === 'function';
    }

    function upush(arr, val){
        if(arr.indexOf(val) === -1)
            return arr.push(val);
        return -1;
    }

    
    /**
     * Only the first match will be removed
     */
    function remove(arr, val) {
        if (arr.length) {
            var index = arr.indexOf(val);
            if (index > -1)
                return arr.splice(index, 1);
        }
    }

    var _keys = Object.keys;
    function keys($object){
        return _keys.call(null, $object);
    }

    /**
     * Cloning of JSON object by recursive function,
     * all layers of the object will be cloned, when
     * the order of properties within object type might
     * change, the element order of array type will not
     * be affected, thus it is safe to use.
     */
    function deepClone($object){
        if(!isObject($object))
            return $object;
        var $clone = Array.isArray($object) ? [] : {};
        function clone($0, $1){
            var i; for(i in $0){
                var val0 = $0[i];
                if(!isObject(val0)){
                    $1[i] = val0;
                    continue;
                }
                $1[i] = Array.isArray(val0) ? [] : {};
                clone($0[i], $1[i]);
            }
        }
        clone($object, $clone);
        return $clone;
    }

    function shallowClone($object){

        if(!isObject($object))
            return $object;

        var $clone = Array.isArray($object) ? [] : {};

        for(var i in $object)
            if($object.hasOwnProperty(i))
                $clone[i] = $object[i];

        return $clone;

    }

    function log(caller, msg){
        if(Min.suppressConsole === true)
            return;
        console.log('[Min, ' + caller + ']: ' + msg);
    }

    function error(msg){

        msg = '[Min Error]=>"' + msg + '"';
        console.error(
            new Error(msg).stack
        );
        
    }

    function Min($init){

        if(!this instanceof Min)
            error('Constructor must be called with the new keyword.');

        log('version', Min.version);

        var $mixin = Min.$mixin;
        var mixin; for(mixin in $mixin)
            this._extend($mixin[mixin]);

        var host = this._init($init);
        this._setHostElement(host);
        this._runtimeInit();

    }

    /**
     * This is for the storage of predefined
     * mixin objects, every Min Object will
     * inherit a set of properties.
     */
    Min.$mixin = {};
    
    /**
     * Global API for injecting properties
     * into the Min Object.
     */
    Min.prototype._extend = function($){

        if(!isObject($))
            return error('Param is not of Object type.');

        for(var prop in $)
            if($.hasOwnProperty(prop) || !this.hasOwnProperty(prop))
                this[prop] = $[prop];

    }

    var initParamProps = [
        'elem',
        'data',
        'compute',
        'watch'
    ];

    function validateInitParam($init){
        for(var prop in $init)
            if(initParamProps.indexOf(prop) === -1 || !isObject($init[prop]))
                return false;
        return true;
    }

    Min.prototype._init = function($init){

        if(!isObject($init))
            return error('Init param must be type of Object.');

        if(!validateInitParam($init))
            return error(
                'Init param must be the following keywords: elem, ' + 
                'data, compute, watch. And should be type of Object.'
            );

        var $data = $init.data;
        for(var prop in $data)
            this.$data(prop, $data[prop]);

        var $compute = $init.compute;
        for(var prop in $compute)
            this.$compute(prop, $compute[prop]);

        var $watch = $init.watch;
        for(var ref in $watch)
            this.$watch(ref, $watch[ref]);

        return $init.elem;

    }
    
    /**
     * Mixing of native methods and APIs
     */
    watcherMixin(Min);
    runtimeMixin(Min);
    vnodeMixin(Min);
    vdomMixin(Min);
    dataBind$1Mixin(Min);

    /**
     * A Reactive Object defines the value and attributes of
     * a reactive property within the current vm, it also helds
     * the linkage between reactive properties.
     */
    function Reactive($min, listeners, prop, val, compute){

        /**
         * The current vm.
         */
        this.$min = $min;

        /**
         * The Reactive index of this Reactive.
         */
        this.self = $min.reactiveIdx++;
        /**
         * The Reactive indexs of the callers
         * that calls to this Reactive on change.
         */
        this.callers = [];
        /**
         * The Reactive Indexs of the listeners
         * that is being called when this Reactive
         * updates.
         */
        this.listeners = listeners;

        /**
         * Whether the associated property is a
         * computed property.
         */
        this.isCompute = isDef(compute);

        /**
         * Whether this Reactive belongs to an Object
         */
        this.isObject = isObject(val);

        /**
         * The associated property.
         */
        this.prop = prop;
        /**
         * The current value of the property,
         * this will get changed when it's sub
         * properties gets updated.
         */
        this.val = val;
        /**
         * The old value of the associated property,
         * this will be updates after the setters of
         * this Reactive is called on update.
         */
        this.oldVal = deepClone(val);
        /**
         * The compute function of the associated property,
         * if the associated property is not a computed
         * property, this will be undefined.
         */
        this.compute = compute;

        /**
         * The setters of this Reactive, gets invoked on update.
         */
        this.$setter = {};

        /**
         * Create linkage to other Reactives
         */
        this._bindListeners();
        /**
         * Add this Reactive to the current vm.
         */
        $min.$reactives[this.self] = this;

    }

    Reactive.prototype._bindListeners = function(){

        var $reactives = this.$min.$reactives;

        var listeners = this.listeners;
        for(var i in listeners){

            var $callerReactive = $reactives[listeners[i]];
            $callerReactive.callers.push(this.self);

        }
    }

    /**
     * This updates the current Reactive, gets invoked
     * when the associated property gets changed or
     * the callers updates this Reactive.
     */
    Reactive.prototype._update = function(updateListeners, invokeSetters, val){

        var $reactives = this.$min.$reactives;
        var oldVal = this.oldVal;

        if(this.isCompute === true){
            /**
             * The compute function is assumed 
             * to be binded to the current vm.
             * If the compute function relates
             * to other compute properties, 
             * those properties will be updated
             * before the compute function returns
             * the value.
             */
            val = this.compute.call();

            /**
             * As compute properties will triggers
             * a update on get, to prevent trivial
             * updates on the vm, return the update
             * function when the computed value is
             * equal to the old value.
             */
            if(oldVal === val){
                this.oldVal = deepClone(this.val);
                return;
            }
        }

        if(isDef(val)){
            this.val = val;
            if(this.isObject === true && this.isCompute === false)
                this.callers = [];
            this.isObject = isObject(val);
        }
        
        if(invokeSetters === true){
            var $setter = this.$setter;
            for(var setter in $setter)
                $setter[setter].call(this.$min, this.val, oldVal);
        }

        /**
         * Update the old value to the new value,
         * cloning of the new value separates the
         * references of the old value with the
         * new value.
         */
        this.oldVal = deepClone(this.val);

        if(updateListeners === false)
            return;

        var listeners = this.listeners;
        for(var i in listeners)
            $reactives[listeners[i]]._update(true, true);

        return oldVal;

    }

    function watcherMixin(M){

        M.$mixin.$watcher = {

            /**
             * This defines the new index that will 
             * be recieved by a new Reactive.
             */
            reactiveIdx : 0,

            /**
             * This defines the most recent accessed Reactive.
             */
            $curReactive : undefined,

            /**
             * This stores the Reactive Objects within current vm.
             */
            $reactives : {},

            /**
             * This stores the root Reactives
             */
            rootReactives : []

        }

        /**
         * This util function allows to retrieve a Reactive by the 
         * reference given in the argument, for the argument should 
         * be in form of: [STR].[STR].[STR].[...], the same applies
         * to array type objects: [ARR].[INT].[INT].[...]. This 
         * function does not have protection against undefined
         * references, if the Reactive is not found.
         */
         M.prototype._reactiveFromRef = function(ref){

            var $reactives = this.$reactives;

            function search($reactive, prop){
                var callers = $reactive.callers;
                for(var i in callers){
                    var $idxReactive = $reactives[callers[i]];
                    if($idxReactive.prop === prop)
                        return $idxReactive;
                }
            }

            var props = ref.split('.');
            var rootProp = props[0];
            
            var rootReactives = this.rootReactives;
            var $rootReactive = undefined;
            for(var i in rootReactives){
                var $reactive = rootReactives[i];
                if($reactive.prop === rootProp){
                    $rootReactive = $reactive;
                    break;
                }
            }
            if(isUndef($rootReactive))
                return;

            var len = props.length;
            var $curReactive = $rootReactive;
            var c = 1; while(c < len && isDef($curReactive)){
                $curReactive = search($curReactive, props[c++]);
            }

            return $curReactive;

        }

        /**
         * Watcher Mark and Sweep Garbage Collection
         * This API allow the removal of unused Reactives
         * when a reference to a property is deleted.
         */

        /**
         * This mark algorithm is based on the callers of
         * the Reactive, as each value update to the Reactive
         * will flush the callers, Reactives that is unreachable
         * will not be added to the life Reactive collection.
         */
        function markLifeReactives($reactives, $currentReactive, $lifeReactives){

            $lifeReactives[$currentReactive.self] = true;
            var callers = $currentReactive.callers;
            for(var i in callers){
                var reactive = callers[i];
                markLifeReactives($reactives, $reactives[reactive], $lifeReactives);
            }

        }

        /**
         * All Reactives that is not in the life Reactive Collection
         * will be removed from the current Reactive Collection.
         */
        function sweepReactiveCollection($reactives, $lifeReactives){

            var sweeped = 0;

            for(var reactive in $reactives)
                if(isUndef($lifeReactives[reactive]))
                    delete $reactives[reactive], sweeped++;

            return sweeped;

        }

        /**
         * This function will be called automatically after a number
         * of changes made to the Reactive Collection, but it can be
         * used manually to force a garbage collection.
         */
        M.prototype._watcherMASGC = function(){

            var $reactives = this.$reactives;
            var $lifeReactives = {};

            var rootReactives = this.rootReactives;
            for(var i in rootReactives)
                markLifeReactives($reactives, rootReactives[i], $lifeReactives);

            var sweeped = sweepReactiveCollection($reactives, $lifeReactives);

            /**
             * Remove the reference if given, pointed to the objects.
             */
            delete this.$curReactive;

            log('watcherMASGC', 'Sweeped ' + sweeped + ' unused Reactives.');

        }

        /**
         * Define a reactive property to an Object type within
         * the current vm, the Reactive Object of the property
         * must be defined before using this function.
         */
        function define($min, $o, p, $r){

            if($r.prop != p)
                $r.prop = p;

            /**
             * Predefines the parameters of Object.defineProperty
             * to reduce code complexity.
             */
            var $i = {
                enumerable : true,
                configurable : true,
                get(){
                    /**
                     * Set the recent Reactive be this.
                     */
                    $min.$curReactive = $r;

                    if($r.isCompute)
                        $r._update(false, false);
                    return $r.val;
                },
                set(v){
                    /**
                     * Prevent redundant operations 
                     * and infinite loop of cyclic
                     * linkage.
                     */
                    if(v === $r.val)
                        return;
                    $r._update(true, true, v);
                    /**
                     * Convert all sub properties
                     * into Reactive if v is type
                     * of Object.
                     */
                    if(isObject(v))
                        deep($min, v, $r);
                }
            }

            Object.defineProperty(
                $o,
                p,
                $i
            );

        }

        function patchArray($min, arr, $arrReactive){

            var proto = Array.prototype;

            var _push = proto.push;
            var $push = {
                enumerable : false,
                configurable : true,
                value(val){

                    var idx = _push.call(this, undefined) - 1;
                    var $reactive = new Reactive($min, [$arrReactive.self], idx, val);
                    define($min, arr, idx, $reactive);

                    if(isObject(val))
                        deep($min, this[idx], $reactive);
                    
                    $arrReactive._update();

                    return idx;

                }
            }

            /**
             * Helper to get the Reactive of a indexed
             * element of the array.
             */
            var $reactives = $min.$reactives;
            function reactiveIdxFromIdx(idx){
                var callers = $arrReactive.callers;
                for(var i in callers){
                    $callerReactive = $reactives[callers[i]];
                    if($callerReactive.prop == idx)
                        return $callerReactive.self;
                }
            }

            /**
             * Helper to remove a Reactive and it's associated
             * sub Reactives completely from the vm and array.
             */
            function removeReactive(idx){
                var reactive = reactiveIdxFromIdx(idx);
                var callers = $reactives[reactive].callers;
                for(var i in callers)
                    delete $reactives[callers[i]];
                delete $reactives[reactive];
                return reactive;
            }


            var _pop = proto.pop;
            var $pop = {
                enumerable : false,
                configurable : true,
                value(){

                    var ret = _pop.call(this);
                    if(isUndef(ret))
                        return;

                    var reactive = removeReactive(this.length);
                    remove($arrReactive.callers, reactive);
                    $arrReactive._update();

                    return ret;

                }
            }

            var _shift = proto.shift;
            var $shift = {
                enumerable : false,
                configurable : true,
                value(){

                    var reactives = [];
                    for(var i = 0, len = this.length; i < len; i++){
                        var reactive = reactiveIdxFromIdx(i);
                        if(i != 0)
                            delete this[i],
                            reactives.push(reactive);
                    }

                    reactive = removeReactive(0);
                    var ret = _shift.call(this);
                    for(var i in reactives)
                        define($min, arr, i, $reactives[reactives[i]]);

                    remove($arrReactive.callers, reactive);
                    $arrReactive._update();

                    return ret;
                    
                }
            }

            var _unshift = proto.unshift;
            var $unshift = {
                enumerable : false,
                configurable : true,
                value(val){

                    var reactives = [];
                    for(var i = 0, len = this.length; i < len; i++){
                        delete this[i],
                        reactives.push(reactiveIdxFromIdx(i));
                    }

                    var $newReactive = new Reactive($min, [$arrReactive.self], 0, val);
                    var ret = _unshift.call(this, undefined);
                    define($min, this, 0, $newReactive);

                    if(isObject(val))
                        deep($min, this[0], $newReactive);
                        
                    for(var i = 1, len = this.length; i < len; i++){
                        var $idxReactive = $reactives[reactives[i - 1]];
                        $idxReactive.prop = i;
                        define($min, this, i, $idxReactive);
                    }

                    $arrReactive._update();

                    return ret;

                }
            }

            Object.defineProperties(arr, {
                push : $push,
                pop : $pop,
                shift : $shift,
                unshift : $unshift
            });

        }

        function deep($min, $object, $superReactive){
            if(!isObject($object))
                return;
            if(Array.isArray($object))
                patchArray($min, $object, $superReactive);
            for(var p in $object){
                var $val = $object[p];
                var $reactive = new Reactive($min, [$superReactive.self], p, $val);
                define($min, $object, p, $reactive);
                deep($min, $val, $reactive);
            }
        }

        M.prototype.$data = function(prop, val){

            if(isUndef(prop) || isUndef(val) || isFunction(val))
                return error('The given params is undefined/invalid.');

            var $reactive = new Reactive(this, [], prop, val);
            this.rootReactives.push($reactive);
            define(this, this, prop, $reactive);
            if(!isObject(val)) return;
            deep(this, this[prop], $reactive);

        }

        /**
         * Processing of compute functions to fetch
         * the associated dependent Reactives.
         */

        /**
         * This function removes the last
         * element from the reference.
         */
        function removeLastFromRef(ref){

            if(ref.indexOf('.') === -1)
                return undefined;
            
            var splits = ref.split('.');
            var newRef = splits[0], len = splits.length - 1;
            for(var i = 1; i < len; i++)
                newRef += '.' + splits[i];
            
            return newRef;
        
        }

        var stopChars = [
            '\n', '\t', ' ', ')', '{', '}',
            '+', '-', '*', '/', '<', '>', '=',
            '!', '@', '#', '%', '^', '&', '|',
            '?', ':', '\'', '\"', ';'
        ];

        function isStopChar(char){
            if(stopChars.indexOf(char) === -1)
                return false;
            return true;
        }
        
        /**
         * This function scans the function string
         * and extract all references that begins
         * with the this keyword without duplicates.
         */
        function rawRefsFromStr(str, thisLocations){

            var thisKeyword = 'this.';
        
            var raws = [];
            var len = str.length;
            var i = 0; for(; i < len; i++){
                
                var cont = true;
                var c = 0; for(; c < 5; c++)
                    if(str[i + c] !== thisKeyword[c])
                        cont = false;
                if(cont === false)
                    continue;

                thisLocations.push(i);
        
                var raw = '';
                var m = c, char = '', isFunc = false; 
                while(isStopChar(char) === false && i + m < len){
                    if(char === '(')
                        isFunc = true;
                    raw += char;
                    char = str[i + m++];
                }
                if(isFunc === true)
                    raw = removeLastFromRef(raw);
                if(raws.indexOf(raw) === -1)
                    raws.push(raw);
                
                if(i + m < len)
                    i += m - 1;
                else
                    break;
            }
        
            return raws;
        
        }
        
        /**
         * This function converts a javascript
         * expressions of array references into
         * vm readable reference.
         */
        function rawRefToRef(raw){
        
            if(
                raw.indexOf('[') === -1 && 
                raw.indexOf(']') === -1
            ) return raw;
        
            var ref = '';
            for(var i in raw){
                var char = raw[i];
                if(char === ']')
                    continue;
                if(char === '['){
                    ref += '.';
                    continue;
                }
                ref += char;
            }
            return ref;
        
        }
        
        /**
         * This function fetch all associated 
         * Reactives of the properties found 
         * within a function string.
         */
        function reactivesFromStr($min, str, thisLocations){
        
            var raws = rawRefsFromStr(str, thisLocations);
            var $refReactive = {};
            for(var i in raws){
                var ref = rawRefToRef(raws[i]);
                var $reactive = $min._reactiveFromRef(ref);
                if(isUndef($reactive))
                    return error(
                        'Unable to proceed, unidentified property ' +
                        'in the compute function...'
                    );
                $refReactive[ref] = $reactive;
            }

            return $refReactive;
        
        }

        M.prototype._compute = function(prop, comp){

            var compStr = comp.toString();
            comp = comp.bind(this);
            var $reactive = new Reactive(this, [], prop, undefined, comp);
            this.rootReactives.push($reactive);
            define(this, this, prop, $reactive);

            var thisLocations = [];
            var $callerReactive = reactivesFromStr(this, compStr, thisLocations);

            for(var ref in $callerReactive){
                $currentReactive = $callerReactive[ref];
                $currentReactive.listeners.push($reactive.self);
                $reactive.callers.push($currentReactive.self);
            }

            var val = comp.call();
            $reactive.val = val;

            return $reactive;

        }

        M.prototype.$compute = function(prop, comp){

            if(isUndef(prop) || isUndef(comp) || !isFunction(comp))
                return error('The given params is undefined/invalid.');

            this._compute(prop, comp);

        }

        M.prototype.$watch = function(ref, handler){

            if(isUndef(ref) || isUndef(handler) || !isFunction(handler))
                return error('The given params is undefined/invalid.');

            var $reactive = this._reactiveFromRef(ref);
            if(isUndef($reactive))
                return error('Undefined property in reference.');

            $reactive.$setter.watch = handler;

        }

        M.prototype.$unwatch = function(ref){

            if(isUndef(ref))
                return error('The given params is undefined/invalid.');

            var $reactive = this._reactiveFromRef(ref);
            if(isUndef($reactive))
                return error('Undefined property in reference.');

            var $setter = $reactive.$setter;
            if(isUndef($setter.watch))
                return error('Unable to unwatch non-watched property.');

            delete $setter.watch;

        }

    }

    /**
     * IntervalHandler
     * This handler provides a way to limit the
     * activation of a set of function handlers
     * such as the invokers of DOM events or any
     * form of high frequency called functions.
     */
    function IntervalHandler(subs, intv){
        this.intv = intv;
        this.subs = subs;
        this.work = undefined;
        this.cont = false;
    }
    
    IntervalHandler.prototype._call = function(){
        var _this = this;
        var subs = this.subs;
        if(isDef(this.work)){
            this.cont = true;
            return;
        }
        this.work = setInterval(function(){
            _this.cont = false;
            subs.call(_this);
            if(_this.cont === false){
                clearInterval(_this.work);
                _this.work = undefined;
            }
        }, this.intv);
    }

    /**
     * Min Runtime
     *  - This runtime is implemented using IntervalHandler.
     *  - This runtime is invoked in all DOM changes.
     *  - This runtime can be invoked using _invokeRuntime.
     */
    function runtimeMixin(M){

        M.$mixin.$runtime = {

            $runtime : {

                $runtimeHandler : undefined,

                runtimeInterval : 25

            }

        }

        M.prototype._runtimeInit = function(){

            var $runtime = this.$runtime;

            if(isDef($runtimeHandler))
                return;

            /**
             * It is safe to pass this function to
             * the IntervalHandler to execute as
             * the subscribed function will be run
             * synchronously, all addition to both
             * buffers will be processed after or
             * before this function's execution.
             */
            var runtime = function(){

                var $min = this.$min;

                var revampVnodes = this.revampVnodes;
                var $patchVnodes = this.$patchVnodes;

                if(revampVnodes.length !== 0){
                    $min._parallexRevamp(revampVnodes);
                    this.revampVnodes = [];
                }

                if(keys($patchVnodes).length !== 0){
                    $min._parallexPatch($patchVnodes);
                    this.$patchVnodes = {};
                }

            }

            var $runtimeHandler = new IntervalHandler(runtime, $runtime.runtimeInterval);
            
            $runtimeHandler.$min = this;
            $runtimeHandler.$patchVnodes = {};
            $runtimeHandler.revampVnodes = [];

            $runtime.$runtimeHandler = $runtimeHandler;

        }

        M.prototype._invokeRuntime = function(vn, p, $p, r){

            var $runtimeHandler = this.$runtime.$runtimeHandler;

            var $patchVnodes = $runtimeHandler.$patchVnodes;
            var revampVnodes = $runtimeHandler.revampVnodes;

            if(isUndef($patchVnodes[vn]))
                $patchVnodes[vn] = {

                    doHide : false,

                    ppAll : false,

                    attAll : false,

                    clAll : false,

                    slAll : false,

                    $pp : {},

                    $att : {},

                    $cl : {},

                    $sl : {}

                }

            var $vnPatch = $patchVnodes[vn];
            
            if(p === true)
                
                $vnPatch.doHide = 
                $vnPatch.ppAll = 
                $vnPatch.attAll = 
                $vnPatch.clAll = 
                $vnPatch.slAll = true;

            else if(isDef($p)){

                if($p.doHide === true) $vnPatch.doHide = true;

                var pp = $p.$prop;
                if(isDef(pp)) $vnPatch.$pp[pp] = true;

                var att = $p.$attrib;
                if(isDef(att)) $vnPatch.$att[att] = true;

                var cl = $p.cl;
                if(isDef(cl)) $vnPatch.$cl[cl] = true;

                var sl = $p.sl;
                if(isDef(sl)) $vnPatch.$sl[sl] = true;

            }

            if(r === true)
                revampVnodes.push(vn);

            $runtimeHandler._call();

        }

        M.prototype._setRuntimeInterval = function(intv){

            var $runtime = this.$runtime;
            $runtime.runtimeInterval = intv;
            $runtime.$runtimeHandler.intv = intv;

        }

    }

    /**
     * Parallex DOM API Implementation
     */
    function vnodeMixin(M){

        function createElemNodeTrace($vn){

            var trace = document.createElement($vn.tag);

            var $pp = $vn.$pp;
            for(var pp in $pp)
                trace[pp] = $pp[pp];

            var $att = $vn.$att;
            for(var att in $att)
                trace.setAttribute(att, $att[att]);

            var $cs = $vn.$cl;
            var cl = trace.classList;
            for(var cs in $cs)
                cl.add(cs);

            var $sl = $vn.$sl;
            var tsl = trace.style;
            for(var sl in $sl)
                tsl[sl] = $sl[sl];

            return trace;

        }

        function createTextNodeTrace($vn){

            return document.createTextNode($vn.$prop.textContent);

        }

        function createElemNode(tag, $att, $pp, $cl, $sl){

            return {

                type : M.PARALLEX_VN_T_EL,

                tag : tag,

                $att : shallowClone($att),

                $pp : shallowClone($pp),

                $cl : shallowClone($cl),

                $sl : shallowClone($sl),

                pn : M.PARALLEX_PN_STORE,

                cns : [],

                hide : false

            }

        }

        function createTextNode(content){

            return {

                type : M.PARALLEX_VN_T_TXT,

                $prop : {

                    textContent : content

                },

                pn : M.PARALLEX_PN_STORE,

                hide : false

            }

        }

        M.prototype._elem = function(tag, $att, $pp, $cl, $sl){

            var $parallex = this.$parallex;

            var vn = $parallex.vnCount++;

            var $vn = $parallex.$vDOM[vn] = 
                createElemNode(tag, $att, $pp, $cl, $sl);

            $parallex.$rDOM[vn] = 
                createElemNode(tag, $att, $pp, $cl, $sl);

            $parallex.$vTrace[vn] = createElemNodeTrace($vn);

            return vn;

        }

        M.prototype._text = function(content){

            var $parallex = this.$parallex;

            var vn = $parallex.vnCount++;

            var $vn = $parallex.$vDOM[vn] = 
                createTextNode(content);

            $parallex.$rDOM[vn] = 
                createTextNode(content);

            $parallex.$vTrace[vn] = 
                createTextNodeTrace($vn);

            return vn;

        }

        M.prototype._pushVnode = function(vn, pn){

            var $parallex = this.$parallex;
            var $vDOM = $parallex.$vDOM;

            if(isUndef(pn))
                pn = M.PARALLEX_VN_HOST;

            var $vn = $vDOM[vn], $pn = $vDOM[pn];

            if(isUndef($vn) || isUndef($pn))
                return false;

            /**
             * We will not use _pullVnode 
             * because of performance impact.
             */
            if($vn.pn !== M.PARALLEX_PN_STORE)
                remove($vDOM[$vn.pn].cns, vn);

            $vn.pn = pn;

            $pn.cns.push(vn);

            /**
             * Invoking the runtime.
             */
            this._invokeRuntime(vn, true, undefined, false);
            this._invokeRuntime(pn, false, undefined, true);

            return true;

        }

        M.prototype._pullVnode = function(vn, rmv){

            var $parallex = this.$parallex;
            var $vDOM = $parallex.$vDOM;

            var $vn = $vDOM[vn];

            if(isUndef($vn))
                return false;

            var pn = $vn.pn;
            if(pn === M.PARALLEX_PN_STORE)
                return false;

            $vn.pn = rmv === true ?
                M.PARALLEX_PN_RMV :
                M.PARALLEX_PN_STORE;

            remove($vDOM[pn].cns, vn);

            /**
             * Below for the invoking the runtime.
             */
            this._invokeRuntime(pn, false, undefined, true);

            return true;

        }

        M.prototype._mutateVnode = function(vn, src, key, val){

            var $parallex = this.$parallex;
            var $vDOM = $parallex.$vDOM;

            var $vn = $vDOM[vn];

            $vn[src][key] = val;

            var $invokeParam = {};

            $invokeParam[src] = key;
            this._invokeRuntime(vn, true, $invokeParam, false);

        }

    }

    /**
     * Parallex DOM Implementation
     */
    function vdomMixin(M){

        M.PARALLEX_VN_T_EL = 1;
        M.PARALLEX_VN_T_TXT = 3;

        M.PARALLEX_PN_STORE = -2;
        M.PARALLEX_PN_RMV = -3;
        M.PARALLEX_VN_HOST = -1;

        M.PARALLEX_ATT_SL = '$style';

        M.PARALLEX_PP_INNERHTML = 'innerHTML';

        var ANIMS = [
            '@keyframes minfadein{from{opacity:0}to{opacity:1}}',
            '@keyframes minfadeout{from{opacity:1}to{opacity:0}}',
            '@keyframes minmovein{0%{left:100%}100%{left:0}}',
            '@keyframes minmoveout{0%{left:0}100%{left:100%}}',
            '@keyframes minfademovein{0%{left:100%;opacity:0}100%{left:0;opacity:1}}',
            '@keyframes minfademoveout{0%{left:0;opacity:1}100%{left:100%;opacity:0}}',
            '@keyframes minswell{0%{transform:scale(0)}100%{transform:scale(1)}}',
            '@keyframes minshrink{0%{transform:scale(1)}100%{transform:scale(0)}',
            '@keyframes minfadeswell{0%{opacity:0;transform:scale(0)}100%{opacity:1;transform:scale(1)}}',
            '@keyframes minfadeshrink{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(0)}',
            '@keyframes minvexpand{0%{transform:scaleY(0)}100%{transform:scaleY(1)}}',
            '@keyframes minvcompress{0%{transform:scaleY(1)}100%{transform:scaleY(0)}}',
            '@keyframes minhexpand{0%{transform:scaleX(0)}100%{transform:scaleX(1)}}',
            '@keyframes minhcompress{0%{transform:scaleX(1)}100%{transform:scaleX(0)}}'
        ];

        var css;

        var sheets = document.styleSheets;
        for(var i in sheets)
            if(sheets[i].href === null){
                css = sheets[i];
                break;
            }

        if(isUndef(css))
            return error(
                'Unable to insert transition animations.'
            );

        var i = 0, len = ANIMS.length;
        for(; i < len; i++)
            css.insertRule(ANIMS[i], css.cssRules.length);

        M.ANIMATION = {
            FADE_IN : ['minfadein ease-in-out 0.5s', 300],
            FADE_OUT : ['minfadeout ease-in-out 0.5s', 300],
            MOVE_IN : ['minmovein 0.15s forwards', 150],
            MOVE_OUT : ['minmoveout 0.15s forwards', 150],
            FADE_MOVE_IN : ['minfademovein 0.15s forwards', 150],
            FADE_MOVE_OUT : ['minfademoveout 0.15s forwards', 150],
            SWELL : ['minswell 0.5s ease-out forwards', 500],
            SHRINK : ['minshrink 0.5s ease-in forwards', 500],
            FADE_SWELL : ['minfadeswell 0.5s ease-out forwards', 500],
            FADE_SHRINK : ['minfadeshrink 0.5s ease-in forwards', 500],
            VEXPAND : ['minvexpand 0.2s ease-in-out forwards', 200],
            VCOMPRESS : ['minvcompress 0.2s ease-in-out forwards', 200],
            HEXPAND : ['minhexpand 0.2s ease-in-out forwards', 200],
            HCOMPRESS : ['minhcompress 0.2s ease-in-out forwards', 200]
        }

        M.ANIMATION_PUSH = 0;
        M.ANIMATION_PULL = 1;

        var $hostInit = {

            type : M.PARALLEX_VN_T_EL,

            cns : []

        }

        var $vDOMInit = {}, $rDOMInit = {};
        $vDOMInit[M.PARALLEX_VN_HOST] = deepClone($hostInit);
        $rDOMInit[M.PARALLEX_VN_HOST] = deepClone($hostInit);

        M.$mixin.$vdom = {

            $parallex : {
                
                vnCount : 0,

                $vDOM : $vDOMInit,

                $vTrace : {},

                $hTrace : {},

                $rDOM : $rDOMInit

            }

        }

        M.prototype._setHostElement = function(hostElem){
            this.$parallex.$vTrace[M.PARALLEX_VN_HOST] = hostElem;
        }

        /**
         * Parallex Patch
         * - To use this function, an Object type param
         * - must be passed, the format is as follow:
         * 
         *  $ops : {
         *      doHide  :   BOOLEAN,
         *      ppAll   :   BOOLEAN,
         *      attAll  :   BOOLEAN,
         *      clAll   :   BOOLEAN,
         *      slAll   :   BOOLEAN,
         *      $pp     :   OBJECT,
         *      $att    :   OBJECT,
         *      $sl     :   OBJECT,
         *      $cl     :   OBJECT
         *  }
         * 
         */
        M.prototype._parallexPatch = function($ops){

            var $parallex = this.$parallex;

            var $vDOM = $parallex.$vDOM;
            var $rDOM = $parallex.$rDOM;
            var $vTrace = $parallex.$vTrace;
            var $hTrace = $parallex.$hTrace;

            function hideTrace(vn, pn, ranim, ranimd){

                /**
                 * We will write the data of the comment
                 * as the node index for this stage of 
                 * developement, it will be removed in
                 * release stage.
                 */
                var mk = document.createComment(vn);

                var vt = $vTrace[vn];

                if(isDef(ranim)){

                    var pt = $vTrace[pn];

                    var dum = vt.cloneNode(true);

                    replaceChild(pt, dum, vt);
                    insertBefore(pt, mk, dum);

                    dum.style.animation = ranim;

                    setTimeout(function(){
                        pt.removeChild(dum);
                        return;
                    }, ranimd);

                }else
                    $vTrace[pn].replaceChild(mk, vt);

                $vTrace[vn] = mk;
                $hTrace[vn] = vt;

            }
    
            function showTrace(vn, pn, aanim, aanimd){

                var ht = $hTrace[vn], pt = $vTrace[pn];

                if(isDef(aanim)){

                    var tsl = ht.style;

                    var trans = tsl.transition;
                    tsl.transition = '';
                    tsl.animation = aanim;

                    setTimeout(function(){

                        tsl.animation = '';
                        tsl.transition = trans;
                        return;

                    }, aanimd);

                }

                pt.replaceChild(ht, $vTrace[vn]);

                $vTrace[vn] = ht;

                delete $hTrace[vn];
    
            }

            var vn, $vn, $rn, vt; for(vn in $ops){

                $vn = $vDOM[vn], $rn = $rDOM[vn];

                /**
                 * host node will not be managed by this dom
                 */
                if(vn === M.PARALLEX_VN_HOST)
                    continue;

                /**
                 * The code below seems to be reusable
                 * and able to be contained by a function,
                 * yet I am still unsure if function calls
                 * are faster then procedural code.
                 * Instead I code it as a high performance
                 * javascript implementation.
                 */
                var pn = $vn.pn

                /**
                 * No changes will be made to vns that
                 * is currently in storage, as the updates
                 * buffered at the virtual DOM, we assume
                 * that no update is lost in the overall
                 * process and could be applied when the
                 * vn got pushed later on
                 */
                if(pn === M.PARALLEX_PN_STORE)
                    continue;

                /**
                 * Implementation of hiding system
                 * we place this below the store checking
                 * as a stored node cannot be hidden, or replaced
                 * with a comment node, instead when it is pushed
                 * again to the DOM, given it's current status
                 * in virtual DOM is hidden, it will be hidden
                 * after it is pushed.
                 */
                var $cur = $ops[vn];

                $vn = $vDOM[vn], $rn = $rDOM[vn];
                vt = $vTrace[vn];

                if($cur.doHide === true){

                    /**
                     * Implementation of hiding system
                     * we place this below the store checking
                     * as a stored node cannot be hidden, or replaced
                     * with a comment node, instead when it is pushed
                     * again to the DOM, given it's current status
                     * in virtual DOM is hidden, it will be hidden
                     * after it is pushed.
                     */
                    var vhid = $vn.hide, rhid = $rn.hide;

                    if(vhid && rhid)
                        continue;

                    if(!vhid && rhid)
                        showTrace(vn, pn, $vn.aanim, $vn.aanimd), $rn.hide = false;

                    if(vhid && !rhid)
                        hideTrace(vn, pn, $vn.ranim, $vn.ranimd), $rn.hide = true;

                }

                var $vpp = $vn.$pp;
                var $rpp = $rn.$pp;
                var $pp = $cur.ppAll === true ? $vpp : $cur.$pp;
                var pp; for(pp in $pp){

                    if(
                        pp === M.PARALLEX_PP_INNERHTML && 
                        (
                            $vn.cns.length !== 0 ||
                            $rn.cns.length !== 0
                        )
                    ){
                        error(
                            'Foreign invasion detected, ' +
                            'setting innerHTML in parent ' +
                            'node is forbidden!'
                        );
                        continue;
                    }

                    var vval = $vpp[pp];
        
                    if(vval === $rpp[pp])
                        continue;
        
                    $rpp[pp] = vval;
                    vt[pp] = vval;

                }

                /**
                 * The process below is only for element nodes
                 */
                if($vn.type == M.PARALLEX_VN_T_TXT)
                    continue;

                var $vatt = $vn.$att;
                var $ratt = $rn.$att;

                var $att = $cur.attAll === true ? $vatt : $cur.$att;
                var att; for(att in $att){

                    var vval = $vatt[att];
        
                    if(vval === $ratt[att])
                        continue;
        
                    $ratt[att] = vval;
                    
                    vt.setAttribute(key, vval);

                }

                var $vcl = $vn.$cl;
                var $rcl = $rn.$cl;
                var $cl = $cur.clAll === true ? $vcl : $cur.$cl;
                var vtcl = vt.classList;
                var cl; for(cl in $cl){

                    var vval = $vcl[cl];
                    var rval = $rcl[cl];
        
                    if(vval === rval)
                        continue;

                    if(vval === true)
                        vtcl.add(cl);
                    else
                        vtcl.remove(cl);

                }

                var $vsl = $vn.$sl;
                var $rsl = $rn.$sl;
                var $sl = $cur.slAll === true ? $vsl : $cur.$sl;
                var vtsl = vt.style;
                var sl; for(sl in $sl){

                    var vval = $vsl[sl];

                    if(vval === $rsl[sl])
                        continue;

                    $rsl[sl] = vval;
                    vtsl[sl] = vval;

                }

            }

        }

        /**
         * Parallex Revamp
         * This function takes in an array of vnodes
         * to be revamped, which updates the children.
         */
        M.prototype._parallexRevamp = function(vns){

            /**
             * A efficent revamping algorithm,
             * this might takes more time to
             * compute than the previous version
             * but the DOM modification count is
             * greatly reduced.
             */
            var $parallex = this.$parallex;

            $vDOM = $parallex.$vDOM;
            $rDOM = $parallex.$rDOM;

            $vTrace = $parallex.$vTrace;

            /**
             * Prepare the revamp pushed buffer
             */
            var $rvppp = {};

            /**
             * Loop through the vns list provided
             */
            var i = 0, len, vn, $vn, $rn, vcs, rcs;
            for(len = vns.length; i < len; i++){

                vn = vns[i];
                $vn = $vDOM[vn];

                /**
                 * Only an element node is allowed to be revamped
                 */
                if($vn.type !== M.PARALLEX_VN_T_EL)
                    continue;
                
                $rn = $rDOM[vn];
                vcs = $vn.cns, rcs = $rn.cns;

                if(!vcs.length && !rcs.length)
                    continue;

                /**
                 * Map both children list for later usage
                 * The value contained in the map is the
                 * current index of the child in the list
                 */
                var vmap = {}, rmap = {};
                var vd, rd, vc, rc, c = 0; for(;; c++){
                    vc = vcs[c], rc = rcs[c];
                    vd = isDef(vc), rd = isDef(rc);
                    if(!vd && !rd)
                        break;
                    if(vd) vmap[vc] = c;
                    if(rd) rmap[rc] = c;
                }

                /**
                 * Processed buffer for skipping
                 */
                var $p = {}, $apn = {};

                /**
                 * Loop through both children lists
                 */
                var c = 0, m = 0, n = 0, mm, nn; for(;;){

                    /**
                     * mm is the current index for the vcs,
                     * when nn is the current index for rcs,
                     * the m and n delta is for the skipping
                     * of removed or appended nodes
                     */
                    mm = c - m, nn = c++ - n;
                    vc = vcs[mm], rc = rcs[nn],

                    /**
                     * Get the if defined values
                     */
                    vd = isDef(vc), rd = isDef(rc);

                    /**
                     * Break off the loop when iteration is done
                     */
                    if(!vd && !rd)
                        break;

                    /**
                     * Case: defined in render children list
                     * when not contained within the virtual
                     * children list,
                     * remove the node and skip one child
                     */
                    if(rd && isUndef(vmap[rc])){

                        m++;
                        vremove(vn, rc);
                        ch = true;
                        continue;

                    }

                    /**
                     * Case: defined in virtual children list
                     * when not contained within the render
                     * children list,
                     * append the node with the correct order
                     */
                    if(vd && isUndef(rmap[vc])){

                        n++;

                        var vc1 = vcs[mm + 1];
                        $apn[vc] = {b : vc1, p : vn};
                        $rvppp[vc] = true;

                        $p[vc] = true;
                        ch = true;

                        continue;
                    
                    }

                    /**
                     * Case: defined in both children list but
                     * with their node index unmatched,
                     * for previous processed node this will be true,
                     * skip directly;
                     * else push the node with the correct order
                     */
                    if(vd && rd && vc !== rc){

                        var com0 = vmap[vc] - rmap[vc];
                        var com1 = vmap[rc] - rmap[rc];

                        if(com0 < 0) com0 = -com0;
                        if(com1 < 0) com1 = -com1;

                        if(com0 < com1){

                            if(isDef($p[vc])){
                                n++;
                                continue;
                            }
    
                            m++;
    
                            $p[rc] = true;
                            var vc1 = vcs[vmap[rc] + 1];
                            $apn[rc] = {b : vc1, p : vn};
                            $rvppp[rc] = true;
                            ch = true;
    
                            continue;

                        }else{

                            if(isDef($p[rc])){
                                m++;
                                continue;
                            }
    
                            n++;
    
                            $p[vc] = true;
                            var vc1 = vcs[vmap[vc] + 1];
                            $apn[vc] = {b : vc1, p : vn};
                            $rvppp[vc] = true;
                            ch = true;
    
                            continue;

                        }

                    }

                }

                var k; for(k = vcs.length; k >= 0; k--){
                    var vc = vcs[k];
                    var $ = $apn[vc];
                    if(isUndef($))
                        continue;
                    vbefore(vc, $.b, $.p);
                }

                if(m || n)
                    $rn.cns = vcs.slice();

            }
            
            function vbefore(n, nn, p){

                $rDOM[n].pn = p;
                var t = $vTrace[n]
                    tsl = t.style,
                    $n = $vDOM[n],
                    aanim = $n.aanim;
                if(isDef(aanim) && t.nodeType === M.PARALLEX_VN_T_EL){
                    var trans = tsl.transition;
                    tsl.transition = '';
                    tsl.animation = aanim;
                    setTimeout(function(){
                        tsl.animation = '';
                        tsl.transition = trans;
                        return;
                    }, $n.aanimd);
                }
                if(isUndef(nn))
                    $vTrace[p].appendChild(t);
                else
                    $vTrace[p].insertBefore(t, $vTrace[nn]);

            }

            function vremove(p, n){

                $rDOM[n].pn = M.PARALLEX_PN_STORE;
                var t = $vTrace[n];
                var pt = $vTrace[p];
                var $n = $vDOM[n];
                var ranim = $n.ranim;

                if(isDef(ranim) && t.nodeType === M.PARALLEX_VN_T_EL){

                    /**
                     * The implementation of the removal
                     * animation is to create a dummy node
                     * to apply the animation on, when the
                     * real node is removed instantly
                     */
                    var dum = t.cloneNode(true);
                    replaceChild(pt, dum, t);
                    dum.style.animation = ranim;
                    setTimeout(function(){
                        pt.removeChild(dum);
                        return;
                    }, $n.ranimd);
                }else if(isUndef($rvppp[n]))
                    pt.removeChild(t);

                if($n.pn === M.PARALLEX_PN_RMV){
                    delete $vDOM[n];
                    delete $rDOM[n];
                    delete $vTrace[n];
                    if(isDef($hTrace[n]))
                        delete $hTrace[n];
                }
                
            }

        }

    }

    /**
     * One Way Data Binding Implemetation
     */
    function dataBind$1Mixin(M){

        M.$mixin.$bind$1 = {

            $bind$1 : {

                currentBind : 0

            }

        }

        var compileChars = [
            '=', '+', '-', '*', '/', '!', '&', '|', '^', '%', 
            '<', '>', '?', ':', '[', ']', '(', ')', '\'', '"'
        ];

        function isCompileChar(char){
            return compileChars.indexOf(char) !== -1;
        }

        function processBind(str){

            var isCompile = false;

            var trim = '';
            for(var i in str){

                var char = str[i];
                if(char === ' ' || char === '\t' || char === '\n')
                    continue;

                if(isCompile === false)
                    if(isCompileChar(char))
                        isCompile = true;

                trim += char;

            }

            return {
                isCompile : isCompile,
                trim : trim
            }

        }

        function compileBind($min, compRef, bind){

            var current = isCompileChar(bind[0]);
            var str = '', compiled = '';
            for(var i = 0, len = bind.length; i <= len; i++){

                var char = bind[i];

                var newCurrent = isCompileChar(char)
                if(current !== newCurrent || i === len){
                    if(current === false && isDef($min._reactiveFromRef(str)))
                        str = 'this.' + str;
                    compiled += str;
                    current = newCurrent;
                    str = '';
                }

                str += char;

            }

            var comp = new Function('return ' + compiled);
            
            return $min._compute(compRef, comp);

        }

        M.prototype._bind = function(bind, vn, src, key){

            var $bind$1 = this.$bind$1;
            var currentBind = $bind$1.currentBind++;

            var processed = processBind(bind);
            var isCompile = processed.isCompile;
            var processedBind = processed.trim;

            var $reactive;
            if(isCompile)
                $reactive = compileBind(this, '<bindComp' + currentBind + '>', processedBind);
            else
                $reactive = this._reactiveFromRef(bind);

            var bindSetter = function(nv){
                this._mutateVnode(vn, src, key, nv);
            }

            bindSetter.call(this, $reactive.val);

            $reactive.$setter['bind-' + currentBind] = bindSetter;

        }

    }

    return Min;

});
