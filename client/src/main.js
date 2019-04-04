import Vue from 'vue'
import axios from 'axios'
import VueAxios from 'vue-axios'
import DotLoader from 'vue-spinner/src/DotLoader.vue'

import '@/assets/css/tailwind.css'
import 'vue-awesome/icons'

import App from './App.vue'
import router from './router'
import Icon from 'vue-awesome/components/Icon'

Vue.config.productionTip = false
Vue.use(VueAxios, axios)
Vue.component('v-icon', Icon)
Vue.component('dot-loader', DotLoader);


new Vue({
  router,
  render: h => h(App),
}).$mount('#app')
