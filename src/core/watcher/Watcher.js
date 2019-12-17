var Reactive = require('/Reactive.js');

module.exports = function watcherMixin(M){

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
        $reactiveCollection : {},

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

        var props = ref.split('.');
        if(props.length > 1){
            var $ = this;
            for(var i in props)
                $[props[i]],
                $ = $[props[i]];
        }else this[ref];

        var $reactive = this.$curReactive;
        this.$curReactive = undefined;

        return $reactive;

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
    function markLifeReactives($reactiveCollection, $currentReactive, $lifeReactiveCollection){

        $lifeReactiveCollection[$currentReactive.self] = true;
        var callers = $currentReactive.callers;
        for(var i in callers){
            var reactive = callers[i];
            markLifeReactives($reactiveCollection, $reactiveCollection[reactive], $lifeReactiveCollection);
        }

    }

    /**
     * All Reactives that is not in the life Reactive Collection
     * will be removed from the current Reactive Collection.
     */
    function sweepReactiveCollection($reactiveCollection, $lifeReactiveCollection){

        var sweeped = 0;

        for(var reactive in $reactiveCollection)
            if(isUnDef($lifeReactiveCollection[reactive]))
                delete $reactiveCollection[reactive], sweeped++;

        return sweeped;

    }

    /**
     * This function will be called automatically after a number
     * of changes made to the Reactive Collection, but it can be
     * used manually to force a garbage collection.
     */
    M.prototype._watcherMASGC = function(){

        var $reactiveCollection = this.$reactiveCollection;
        var $lifeReactiveCollection = {};

        var rootReactives = this.rootReactives;
        for(var i in rootReactives)
            markLifeReactives($reactiveCollection, rootReactives[i], $lifeReactiveCollection);

        var sweeped = sweepReactiveCollection($reactiveCollection, $lifeReactiveCollection);

        log('watcherMASGC', 'Sweeped ' + sweeped + ' unused reactives.');

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
                return $r.val;
            },
            set(v){
                $r._update(v);
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
        var $reactiveCollection = $min.$reactiveCollection;
        function reactiveIdxFromIdx(idx){
            var callers = $arrReactive.callers;
            for(var i in callers){
                $callerReactive = $reactiveCollection[callers[i]];
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
            var callers = $reactiveCollection[reactive].callers;
            for(var i in callers)
                delete $reactiveCollection[callers[i]];
            delete $reactiveCollection[reactive];
            return reactive;
        }


        var _pop = proto.pop;
        var $pop = {
            enumerable : false,
            configurable : true,
            value(){

                var ret = _pop.call(this);
                if(isUnDef(ret))
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
                    define($min, arr, i, $reactiveCollection[reactives[i]]);

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
                    var $idxReactive = $reactiveCollection[reactives[i - 1]];
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

        if(isUnDef(prop) || isUnDef(val) || isFunction(val))
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
