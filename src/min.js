/**
 * Min.js beta build 0.1.0
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

    function isUnDef(m){
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

    /**
     * Check if the given prop is a computed prop
     * which normally not start with 'on'
     */
    function isComProp(prop){
        return prop[0] !== 'o' || prop[1] !=='n';
    }

    function log(caller, msg){
        if(Min.suppressConsole === true)
            return;
        console.log('[Min, ' + caller + ']: ' + msg);
    }

    function error(msg){

        msg = '[Min Error]=>"' + msg + '"';
        console.warn(
            new Error(msg).stack
        );
        
    }

    function Min(host){

        if(!this instanceof Min)
            error('Constructor must be called with the new keyword.');

        log('version', Min.version);

        var $mixin = Min.$mixin;
        var mixin; for(mixin in $mixin)
            this._extend($mixin[mixin]);

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
    
    /**
     * Mixing of native methods and APIs
     */
    watcherMixin(Min);
    eventMixin(Min);
    
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
        $min.$reactive[this.self] = this;

    }

    Reactive.prototype._bindListeners = function(){

        var $reactive = this.$min.$reactive;

        var listeners = this.listeners;
        for(var i in listeners){

            var $callerReactive = $reactive[listeners[i]];
            $callerReactive.callers.push(this.self);

        }
    }

    /**
     * This updates the current Reactive, gets invoked
     * when the associated property gets changed or
     * the callers updates this Reactive.
     */
    Reactive.prototype._update = function(val){

        var $reactive = this.$min.$reactive;
        var oldVal = this.oldVal;

        if(this.isCompute === true)
            /**
             * The compute function is assumed 
             * to be binded to the current vm.
             */
            val = this.compute.call();
        if(isDef(val))
            this.val = val;

        
        var $setter = this.$setter;
        for(var setter in $setter)
            $setter[setter].call(null, this.val, oldVal);
        /**
         * Update the old value to the new value,
         * cloning of the new value separates the
         * references of the old value with the
         * new value.
         */
        this.oldVal = deepClone(this.val);

        var listeners = this.listeners;
        for(var i in listeners)
            $reactive[listeners[i]]._update();

        return oldVal;

    }

    function watcherMixin(M){

        Min.$mixin.watcher = {

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
            $reactive : {}

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
            var props = ref.split('.');
            if(props.length > 1){
                var $ = this;
                for(var i in props){
                    $[props[i]];
                    $ = $[props[i]];
                }
            }else this[ref];
            var $reactive = this.$curReactive;
            this.$curReactive = undefined;
            return $reactive;
        }

        /**
         * Define a reactive property to an Object type within
         * the current vm, the Reactive Object of the property
         * must be defined before using this function.
         */
        function define($min, $o, p, $r){
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
                    return $r.val;
                },
                set(v){
                    $r._update(v);
                }
            }
            Object.defineProperty(
                $o,
                p,
                $i
            );

        }

        function deep($min, $object, $superReactive){
            if(!isObject($object))
                return;
            for(var p in $object){
                var $val = $object[p];
                var $reactive = new Reactive($min, [$superReactive.self], p, $val);
                define($min, $object, p, $reactive);
                deep($min, $val, $reactive);
            }
        }

        M.prototype.$set = function(prop, val){

            if(isUnDef(prop) || isUnDef(val) || isFunction(val))
                return error('The given params is undefined/invalid.');

            var $reactive = new Reactive(this, [], prop, val);
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
        
        /**
         * This function scans the function string
         * and extract all references that begins
         * with the this keyword without duplicates.
         */
        function rawRefsFromStr(str){

            var thisKeyword = 'this.';
        
            var stopChars = [
                '\t', ' ', ')', '{', '}',
                '+', '-', '*', '/', '<', '>', '=',
                '!', '@', '#', '%', '^', '&', '|',
                '?', ':', '\'', '\"', ';'
            ];
        
            function isStopChar(char){
                for(var i in stopChars)
                    if(char === stopChars[i])
                        return true;
                return false;
            }
        
            var raws = [];
            var len = str.length;
            var i = 0; for(; i < len; i++){
                
                var cont = true;
                var c = 0; for(; c < 5; c++)
                    if(str[i + c] !== thisKeyword[c])
                        cont = false;
                if(cont === false)
                    continue;
        
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
        function reactivesFromStr($min, str){
        
            var raws = rawRefsFromStr(str);
            var $refReactive = {};
            for(var i in raws){
                var ref = rawRefToRef(raws[i]);
                var $reactive = $min._reactiveFromRef(ref);
                if(isUnDef($reactive))
                    return error(
                        'Unable to proceed, unidentified property ' +
                        'in the compute function...'
                    );
                $refReactive[ref] = $reactive;
            }

            return $refReactive;
        
        }

        M.prototype.$compute = function(prop, comp){

            if(isUnDef(prop) || isUnDef(comp) || !isFunction(comp))
                return error('The given params is undefined/invalid.');

            var compStr = comp.toString();
            comp = comp.bind(this);
            var $reactive = new Reactive(this, [], prop, undefined, comp);
            define(this, this, prop, $reactive);
            
            var $callerReactive = reactivesFromStr(this, compStr);
            for(var ref in $callerReactive){
                $currentReactive = $callerReactive[ref];
                $currentReactive.listeners.push($reactive.self);
                $reactive.callers.push($currentReactive.self);
            }

            var val = comp.call();
            $reactive.val = val;
        }

        M.prototype.$watch = function(ref, handler){

            if(isUnDef(ref) || isUnDef(handler) || !isFunction(handler))
                return error('The given params is undefined/invalid.');

            var $reactive = this._reactiveFromRef(ref);
            if(isUnDef($reactive))
                return error('Undefined property in reference.');

            $reactive.$setter.watch = handler;

        }

        M.prototype.$unwatch = function(ref){

            if(isUnDef(ref))
                return error('The given params is undefined/invalid.');

            var $reactive = this._reactiveFromRef(ref);
            if(isUnDef($reactive))
                return error('Undefined property in reference.');

            var $setter = $reactive.$setter;
            if(isUnDef($setter.watch))
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
    
    function IntervalHandler($subs, intv){
        this.intv = intv;
        this.$subs = $subs;
        this.work = undefined;
        this.cont = false;
    }
    
    IntervalHandler.prototype.$subscribe = function(key, handler){
        this.$subs[key] = handler;
    }

    IntervalHandler.prototype.$unsubscribe = function(key){
        if(isDef(this.$subs[key]))
            delete this.$subs[key];
    }
    
    IntervalHandler.prototype._call = function(){
        var _this = this;
        var $subs = this.$subs;
        if(isDef(this.work)){
            this.cont = true;
            return;
        }
        this.work = setInterval(function(){
            _this.cont = false;
            for(var subs in $subs)
                $subs[subs].call(_this);
            if(_this.cont === false){
                clearInterval(_this.work);
                _this.work = undefined;
            }
        }, this.intv);
    }

    function eventMixin(M){

        M.$mixin.event = {

            $evtHandler : {}

        }

    }

    return Min;

});