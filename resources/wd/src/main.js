import Vue from 'vue'
import VueResource from 'vue-resource'
import App from './App.vue'
import 'bootstrap/dist/css/bootstrap.css'
import $ from "jquery";
window.jQuery = window.$ = $;
require('bootstrap')

Vue.use(VueResource);

new Vue({
    el: '#app',
    render: h => h(App)
})