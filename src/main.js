import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

import VueToasted from 'vue-toasted';

Vue.use(VueToasted, {
  position: 'top-right',
  duration: 4000,
  fullWidth: true,
  type: 'success'
});

Vue.config.productionTip = false

import BootstrapVue from 'bootstrap-vue';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';
Vue.use(BootstrapVue);

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
