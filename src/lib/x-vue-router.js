/**
 * - 创建一个插件
 * - vueRouter是一个class, 可以new一个实例
 * - $router挂载到vue的原型上.
 * - 监听hash变化, 可以及时响应
 * - router-link, router-view两个全局组件
 */
let Vue;
class XVueRouter {
  constructor(options) {
    this.$options = options;

    // 保存path和组件的对应关系.
    this.routeMap = {};

    // 使用vue来做数据响应式. curren保存当前的url hash
    // 一旦hash发生改变, 通过onHashChange更改current值, 对应的router-view组件的
    // render方法就会被重新执行(也就是新的组件就会重新渲染, 路径切换成功). 
    this.vm = new Vue({
      data: {
        current: '/'
      }
    });

    this.onHashChange = this.onHashChange.bind(this);
  }

  init() {
    // hashchange
    this.bindEvents();

    // 初始化path和组件的键值对
    this.initRouteMap();

    // 添加router-link, router-view组件.
    this.createGlobalComponent();
  }

  bindEvents() {
    window.addEventListener('hashchange', this.onHashChange);
    window.addEventListener('load', this.onHashChange);
  }

  initRouteMap() {
    this.$options.routes.forEach(m => this.routeMap[m.path] = m.component);
  }

  onHashChange() {
    // #/about -> /about
    this.vm.current = window.location.hash.slice(1) || '/';
  }

  createGlobalComponent() {
    Vue.component('router-link', {
      props: { to: { type: String, required: true } },
      render() {
        return <a href={`#${this.to}`}>{this.$slots.default}</a>;
      }
    });

    Vue.component('router-view', {
      render: h => h(this.routeMap[this.vm.current])
    });
  }
}

/**
 * 创建一个新插件.
 */
XVueRouter.install = function (_Vue) {
  // 通过Vue.use方法来安装插件时, 会传入一个Vue构造器.
  Vue = _Vue;

  // 调用vue的mixin方法, 在组件的beforeCreate生命周期中
  // 初始化vueRouter.
  Vue.mixin({
    beforeCreate() {
      // this指向的是组件的实例(这里解析了为什么要在跟组件中传入router实例.)
      if (this.$options.router) {
        // 1. 将$router挂载到vue的原型, 方便组件内部直接调用.
        Vue.prototype.$router = this.$options.router;

        // 2. 初始化vueRouter.
        this.$options.router.init();
      }
    }
  })
}

export default XVueRouter;