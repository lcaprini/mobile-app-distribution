import Vue from 'vue';
import VueResource from 'vue-resource';
import App from './App.vue';
import iView from 'iview';
import 'iview/dist/styles/iview.css';
import FastClick from 'fastclick';

FastClick.attach(document.body);

Vue.use(VueResource);
Vue.use(iView);

new Vue({
    el     : '#app',
    render : h => h(App)
});