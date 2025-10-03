// 在主页面(index.html)的浏览器控制台中运行此脚本进行诊断
// 复制整个脚本，粘贴到控制台并按回车

console.log('====== 发布按钮问题诊断 ======\n');

// 1. 检查脚本加载
console.log('1. 脚本加载检查:');
console.log('   configManager:', !!window.configManager ? '✓' : '✗');
console.log('   githubService:', !!window.githubService ? '✓' : '✗');
console.log('   imageService:', !!window.imageService ? '✓' : '✗');
console.log('');

// 2. 检查configManager功能
if (window.configManager) {
    console.log('2. configManager功能检查:');
    console.log('   hasGitHubConfig:', window.configManager.hasGitHubConfig());
    const config = window.configManager.getGitHubConfig();
    console.log('   配置内容:', config);
    console.log('');
} else {
    console.error('2. configManager未加载！');
}

// 3. 检查githubService状态
if (window.githubService) {
    console.log('3. githubService状态:');
    console.log('   isConfigured:', window.githubService.isConfigured());
    console.log('   token:', window.githubService.token ? '(已设置)' : '(未设置)');
    console.log('   owner:', window.githubService.owner || '(未设置)');
    console.log('   repo:', window.githubService.repo || '(未设置)');
    console.log('');
} else {
    console.error('3. githubService未加载！');
}

// 4. 检查Vue实例
console.log('4. Vue实例检查:');
const app = document.getElementById('app');
if (app && app.__vue__) {
    const vue = app.__vue__;
    console.log('   Vue实例存在: ✓');
    console.log('   isGitHubConfigured:', vue.isGitHubConfigured);
    console.log('   isImageServiceConfigured:', vue.isImageServiceConfigured);
    console.log('');

    // 5. 尝试手动触发检查
    console.log('5. 手动触发配置检查:');
    vue.checkGitHubConfig();
    console.log('   执行后 isGitHubConfigured:', vue.isGitHubConfigured);
    console.log('');
} else {
    console.error('4. Vue实例未找到！');
}

// 6. 检查localStorage
console.log('6. localStorage检查:');
const storedConfig = localStorage.getItem('github-config');
console.log('   github-config:', storedConfig ? JSON.parse(storedConfig) : '(不存在)');
console.log('');

// 7. 总结
console.log('====== 诊断总结 ======');
if (window.configManager && window.githubService) {
    const hasConfig = window.configManager.hasGitHubConfig();
    const serviceConfigured = window.githubService.isConfigured();

    if (hasConfig && serviceConfigured) {
        console.log('✓ 配置正常');
        if (app && app.__vue__ && !app.__vue__.isGitHubConfigured) {
            console.error('✗ 但是Vue实例的isGitHubConfigured为false！');
            console.log('\n尝试修复：运行以下命令');
            console.log('document.getElementById("app").__vue__.checkGitHubConfig()');
        } else {
            console.log('✓ Vue状态正常，发布按钮应该可用');
        }
    } else {
        console.error('✗ 配置不完整');
        console.log('   - hasConfig:', hasConfig);
        console.log('   - serviceConfigured:', serviceConfigured);
    }
} else {
    console.error('✗ 关键脚本未加载');
}

console.log('=======================\n');
