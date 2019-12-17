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
    $min.$reactiveCollection[this.self] = this;

}

Reactive.prototype._bindListeners = function(){

    var $reactiveCollection = this.$min.$reactiveCollection;

    var listeners = this.listeners;
    for(var i in listeners){

        var $callerReactive = $reactiveCollection[listeners[i]];
        $callerReactive.callers.push(this.self);

    }
}

/**
 * This updates the current Reactive, gets invoked
 * when the associated property gets changed or
 * the callers updates this Reactive.
 */
Reactive.prototype._update = function(val){

    var $reactiveCollection = this.$min.$reactiveCollection;
    var oldVal = this.oldVal;

    if(this.isCompute === true)
        /**
         * The compute function is assumed 
         * to be binded to the current vm.
         */
        val = this.compute.call();

    if(isDef(val)){
        this.val = val;
        if(this.isObject === true){

            /**
             * This releases the linkage in one direction
             * from the listener to the caller Reactive,
             * this ensures the caller Reactive being
             * garbage collected in garbage collection.
             */
            var callers = this.callers;
            var newCallers = [];
            for(var i in callers){
                var $callerReactive = $reactiveCollection[callers[i]];
                /**
                 * Computed Property will not be unlinked
                 * in this process as they are not in the
                 * property sub tree.
                 */
                if($callerReactive.isCompute === true)
                    newCallers.push(callers[i]);
            }
            this.callers = newCallers;

        }
        this.isObject = isObject(val);
    }
    
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
        $reactiveCollection[listeners[i]]._update();

    return oldVal;

}

module.exports = Reactive;
