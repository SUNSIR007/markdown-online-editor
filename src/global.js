/** @format */

import Vue from 'vue'

/* ------------------------Vue Global Config------------------------------ */
Vue.config.productionTip = false

/* ------------------------- Global Variable ------------------------------- */
import { appTitle } from './config/constant'
window.$appTitle = appTitle

/* ------------------------Vue Global Variable------------------------------ */
import { $utils, $lodash } from '@helper'
import { Message } from 'element-ui'
Vue.prototype.$_ = $lodash
Vue.prototype.$utils = $utils
Vue.prototype.$message = options => Message(options)

/* ------------------------Vue Global Components------------------------------ */
import { Button, Dropdown, DropdownMenu, DropdownItem, Loading, Select, Option, Input } from 'element-ui'
Vue.use(Button)
Vue.use(Dropdown)
Vue.use(DropdownMenu)
Vue.use(DropdownItem)
Vue.use(Loading)
Vue.use(Select)
Vue.use(Option)
Vue.use(Input)

import VueMeta from 'vue-meta'
Vue.use(VueMeta)

// 注册错误处理服务
import { install as ErrorHandlerInstall } from '@/utils/errorHandler'
Vue.use(ErrorHandlerInstall)

import Icon from '@components/Icon'
Vue.component('icon', Icon)
