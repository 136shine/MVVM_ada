function Watcher(vm, expOrFn, cb) {
    this.cb = cb; // 回调函数
    this.vm = vm; // this 调用对象
    this.expOrFn = expOrFn; // watch的对象的key或者函数
    this.depIds = {};
    console.log(typeof expOrFn, expOrFn);
    if (typeof expOrFn === 'function') { // function
        this.getter = expOrFn;
    } else { // express
        // this.getter 等于 this.parseGetter 的return返回的匿名函数
        this.getter = this.parseGetter(expOrFn);
    }
    // 调用get方法，从而触发getter
    // this.get() ==> this.getter.call(this.vm, this.vm) ==> this.parseGetter(expOrFn)
    // this.value = parseGetter中return匿名函数的返回值
    this.value = this.get();
}

Watcher.prototype = {
    update: function() {
        this.run(); // 属性值变化收到通知，每次data属性值变化触发dep.notify()
    },
    run: function() {
        var value = this.get(); // 取到最新值
        var oldVal = this.value;
        if (value !== oldVal) { // 新值与旧值比较
            this.value = value;
            this.cb.call(this.vm, value, oldVal); // 执行Compile中绑定的回调，更新视图
        }
    },
    addDep: function(dep) {
        // 1. 每次调用run()的时候会触发相应属性的getter
        // getter里面会触发dep.depend()，继而触发这里的addDep
        // 2. 假如相应属性的dep.id已经在当前watcher的depIds里，说明不是一个新的属性，仅仅是改变了其值而已
        // 则不需要将当前watcher添加到该属性的dep里
        // 3. 假如相应属性是新的属性，则将当前watcher添加到新属性的dep里
        // 如通过 vm.child = {name: 'a'} 改变了 child.name 的值，child.name 就是个新属性
        // 则需要将当前watcher(child.name)加入到新的 child.name 的dep里
        // 因为此时 child.name 是个新值，之前的 setter、dep 都已经失效，如果不把 watcher 加入到新的 child.name 的dep中
        // 通过 child.name = xxx 赋值的时候，对应的 watcher 就收不到通知，等于失效了
        // 4. 每个子属性的watcher在添加到子属性的dep的同时，也会添加到父属性的dep
        // 监听子属性的同时监听父属性的变更，这样，父属性改变时，子属性的watcher也能收到通知进行update
        // 这一步是在 this.get() --> this.getVMVal() 里面完成，forEach时会从父级开始取值，间接调用了它的getter
        // 触发了addDep(), 在整个forEach过程，当前wacher都会加入到每个父级过程属性的dep
        // 例如：当前watcher的是'child.child.name', 那么child, child.child, child.child.name这三个属性的dep都会加入当前watcher
        if (!this.depIds.hasOwnProperty(dep.id)) {
            dep.addSub(this);
            this.depIds[dep.id] = dep;
        }
    },
    get: function() {
        Dep.target = this; // 将当前订阅者指向自己
        console.log(Dep.target);
        var value = this.getter.call(this.vm, this.vm); // 触发getter，添加自己到属性订阅器中
        Dep.target = null; // 添加完毕，重置
        console.log(Dep.target);
        return value;
    },

    parseGetter: function(exp) {
        if (/[^\w.$]/.test(exp)) return;

        var exps = exp.split('.');
        //  this.getter.call(this.vm, this.vm)的第二个this.vm 传入 obj
        return function(obj) {
            for (var i = 0, len = exps.length; i < len; i++) {
                if (!obj) return;
                obj = obj[exps[i]];
            }
            console.log('watcher=>', obj);
            return obj;
        }
    }
};