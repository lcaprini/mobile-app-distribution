/* eslint-disable no-new */
/* eslint-disable import/no-webpack-loader-syntax */
import Vue from 'vue';
import VueResource from 'vue-resource';
import App from './App.vue';
import iView from 'iview';
import 'iview/dist/styles/iview.css';
import FastClick from 'fastclick';
import VueScrollTo from 'vue-scrollto';

require('file-loader?name=[name].[ext]!../index.html');
require('file-loader?name=[name].[ext]!../builds.json');

FastClick.attach(document.body);

Vue.use(VueResource);
Vue.use(iView);
Vue.use(VueScrollTo);

new Vue({
    el: '#app',
    render: h => h(App)
});
