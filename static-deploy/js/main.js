// ES Module 入口点
import RuntimeConfig from './runtime-config.js';
import { githubService } from './github-service.js';
import { imageService } from './image-service.js';
import * as config from './config.js';
import * as mobileUtils from './mobile-utils.js';
import * as editorManager from './editor-manager.js';
import * as imageHandler from './image-handler.js';

// 初始化 Vue 应用
import './app.js';
