## 简介
vue-router作为vue全局桶的一个核心类库, 其实现方式, 有着很多巧妙之处, 你是否真正了解呢?

## 使用一个vue-router的正确姿态.
最简单的是通过cli安装一个vue-router插件, 会自动的修改我们项目的代码, 正确的使用vue-router. 一条命令搞定. 
``` node
vue add router
```

### 正确的姿态.
1. 新建一个路由配置文件.
``` javascript
import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home
  },
  {
    path: '/about',
    name: 'about',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
  }
]

const router = new VueRouter({
  routes
})

export default router

```
2. 根组件, 挂载router.
``` javascript
import Vue from 'vue'
import App from './App.vue'
import router from './router';

Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')

```
4. 使用router-link做导航, router-view做占位.

看起来是否很简单? 答案是肯定的. 因为以上步骤都是安装vue-router插件时, 会自动帮我们添加的. 

## 我们的问题是?
1. Vue.use(VueRouter), 这行代码是干什么用? 为什么要放在顶部执行, 放到后面行不行?
2. 在入口处, 为什么要传入router? 是干什么用?
3. router-link， router-view组件在哪里定义的? 为什么我们能直接用?
4. 路由更改后, 是怎样渲染对于组件的?

## 核心版vue-router.
lib/x-vue-router.js
``` javascript
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
 * 创建一个新插件. 实现一个静态的install方法.
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
```

## 看完这80行代码后, 以上的4个问题是否已有答案了呢?
