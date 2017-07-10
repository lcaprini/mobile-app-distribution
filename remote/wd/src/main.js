import Vue from 'vue'
import VueResource from 'vue-resource'
import App from './App.vue'
import iView from 'iview';

Vue.use(VueResource);
Vue.use(iView);

import 'iview/dist/styles/iview.css';

new Vue({
    el: '#app',
    render: h => h(App)
})