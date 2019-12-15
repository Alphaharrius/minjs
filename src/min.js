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
 */

 (function(global, factory){ 
    global.module === undefined && 
    typeof global.module !== 'object' ? global.module = {exports : undefined} : {}, 
    global.require = global.require ? global.require : function(url){ var req = new this.XMLHttpRequest();
    req.open('GET', url, false); req.send(null); if(req.status === 200){try{this.eval(req.responseText);}
    catch(e){return warn('require', 'Failed to import, ' + e);} var imported = this.module.exports;
    this.module.exports = undefined; if(imported !== undefined){ console.log('$import', 'From "' + url + '"');
    return imported;}else return console.warn('require', 'Unable to located imports...');}else
    return warn('require', 'Unable to import target file...');}, global.Min = factory(global), 
    global.Min.version = '0.1.0';
})(this, function(global){

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
     * Global API for checking the given key
     * belongs to a defined watched property.
     */

    Min.prototype.hasProperty = function(key){

        return isDef(this.$wpv[key]);

    }

    
    /**
     * Mixing of native methods and APIs
     */
    watcherMixin(Min);

    function watcherMixin(M){

        M.$mixin.watch = {

            //The current computed value that is being
            //initialized, this is used to add the computed
            //property to the dependancies of related properties
            wccp : undefined,

            //Stores the functions of the computed properties
            $wcp : {},

            $wpv : {},

            //Stores the dependant computed properties of each property
            $wpd : {},

            //Stores the setters of the watched properties
            $wset : {}

        }

        /**
         * This function will define a reactive
         * property to an object type, and create
         * definitions of neccessaries within the
         * base Min Object. By using this function 
         * we need to bind it to the current Min.
         */
        
        function defineReactive($min, $object, prop, val, ref){

            var $wpv = $min.$wpv;
            var $wset = $min.$wset;
            var $wpd = $min.$wpd;
            var $wcp = $min.$wcp;

            var $set = $wset[ref] = {};
            var $dep = $wpd[ref] = {};

            $wpv[ref] = val;

            var $initDef = {
                enumerable : true,
                configurable : true,
                set : function(nv){

                    var ov = $wpv[ref];
                    $wpv[ref] = nv;

                    for(var setter in $set)
                        $set[setter].call($min, ov, nv);

                    for(var dep in $dep)
                        $wpv[dep] = $wcp[dep].call();

                    return ov;

                },
                get : function(){

                    var wccp = $min.wccp;

                    if(isDef(wccp) && isUnDef($dep[wccp]))
                        $dep[wccp] = true;

                    return $wpv[ref];

                }
            }

            Object.defineProperty(
                $object,
                prop,
                $initDef
            );

        }

        function isSubPropertyOf(prop, ref){

            var props = prop.split('.');
            var refs = ref.split('.');

            for(var i in props)
                if(props[i] !== refs[i])
                    return false;
            return true;

        }

        var mixinObjects = [

            '$wcp',
            '$wpv',
            '$wpd',
            '$wset'

        ];

        /**
         * This function will remove all neccessaries
         * relates to the property, such as reference
         * 'a.b.c' and 'a.d' will be removed when 'a'
         * is being deleted.
         */
        function deleteReactive($min, prop){

            for(var i in mixinObjects){

                var $mixin = $min[mixinObjects[i]];

                for(var ref in $mixin)
                    if(isSubPropertyOf(prop, ref))
                        delete $mixin[ref];

            }

        }

        function deep($min, $object, ref){

            if(!isObject($object))
                return;

            if(Array.isArray($object))
                reactiveArray($min, ref, $object);

            for(var pp in $object){
                var $val = $object[pp];
                if(isFunction($val)) continue;
                var cref = ref + '.' + pp;
                defineReactive($min, $object, pp, $val, cref);
                deep($val, cref);
            }

        }

        function reactiveArray($min, ref, arr){

            var proto = Array.prototype;

            var _push = proto.push;
            var _pop = proto.pop;

            Object.defineProperties(arr, {
                push : {
                    enumerable : false,
                    configurable : true,
                    value : function(val){

                        var r = _push.call(this, val);
        
                        var idx = r - 1;
                        var cref = ref + '.' + idx
                        defineReactive($min, this, idx, val, cref);
                        deep($min, this[idx], cref);
        
                        return r;
        
                    }
                },
                pop : {
                    enumerable : false,
                    configurable : true,
                    value : function(){

                        var r = _pop.call(this);
        
                        var idx = this.length;
                        var cref = ref + '.' + idx;
                        deleteReactive($min, cref);
        
                        return r;
        
                    }
                }
            });

        }

        M.prototype.$set = function(prop, val){

            /**
             * Prevents repeative definition, even if it
             * is safe to do so.
             */

            if(this.hasProperty(prop))
                return error('This property was defined.');

            var $wpv = this.$wpv;

            /**
             * Define the reactive property into the Min Object,
             */

            defineReactive(this, this, prop, val, prop);

            deep(this, this[prop], prop);

        }

        M.prototype.$compute = function(prop, comp){

            if(this.hasProperty(prop))
                return error('This property was defined.');

            comp = comp.bind(this);

            this.wccp = prop;
            var val = comp.call();
            this.wccp = undefined;

            this.$wcp[prop] = comp;

            defineReactive(this, this, prop, val, prop);

        }

        /**
         * Helper function for inserting a setter to
         * a reference in the current Min
         */

        function injectSetter($min, ref, key, setter){

            $min.$wset[ref][key] = setter;

        }

        function getSplitRef(ref){

            var self = '';

            var i = ref.length - 1; for(; i >= 0; i--){
                var char = ref[i];
                if(char === '.') break;
                self = char + self;
            }

            return [i >= 0 ? ref.slice(0, i) : undefined, self];

        }

        function genRootSetter($min, ref){

            var splitRef = getSplitRef(ref);
            var immediateRoot = splitRef[0];
            if(isUnDef(immediateRoot))
                return undefined;
            
            var self = splitRef[1];
            var $rootSet = $min.$wset[immediateRoot];

            return function(ov){

                var $rootVal = $min.$wpv[immediateRoot];
                var $oldRootVal = deepClone($rootVal);
                $oldRootVal[self] = ov;

                for(var setter in $rootSet)
                    $rootSet[setter].call($min, $oldRootVal, $rootVal);

            }

        }

        M.prototype.$watch = function(ref, watchSetter, deep){

            var $wset = this.$wset;
            
            if(deep === true)
                for(var key in $wset){

                    if(!isSubPropertyOf(ref, key))
                        continue;

                    if(isDef($wset[key].root)){
                        upush($wset[key].root.to, ref);
                        continue;
                    }

                    var rootSetter = genRootSetter(this, key);
                    

                    if(isUnDef(rootSetter))
                        continue;

                    var to = rootSetter.to = [];
                    upush(to, ref);

                    injectSetter(this, key, 'root', rootSetter);

                }

            injectSetter(this, ref, 'watch', watchSetter);

        }

        M.prototype.$unwatch = function(ref){

            var $wset = this.$wset;
            var $set = $wset[ref];

            if(isDef($set.watch))
                delete $set.watch;

            for(var pp in $wset)
                if(isSubPropertyOf(ref, pp)){

                    $set = $wset[pp];
                    var rootSetter = $set.root;
                    if(isUnDef(rootSetter))
                        continue;

                    var to = rootSetter.to;
                    var idxRef = to.indexOf(ref);
                    if(idxRef === 0 && to.length === 1){
                        delete $set.root;
                        continue;
                    }
                    to.splice(idxRef, 1);

                }

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
