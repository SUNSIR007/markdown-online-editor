// 修复分支配置的脚本
// 在浏览器控制台中运行这个脚本来修复分支问题

function fixBranchConfig() {
    console.log('开始修复分支配置...');
    
    // 1. 检查当前配置
    const currentConfig = localStorage.getItem('image-service-config');
    console.log('当前配置:', currentConfig);
    
    if (currentConfig) {
        const config = JSON.parse(currentConfig);
        console.log('解析后的配置:', config);
        
        // 2. 修复分支配置
        if (config.branch === 'main') {
            console.log('发现main分支，正在修复为master...');
            config.branch = 'master';
            
            // 3. 保存修复后的配置
            localStorage.setItem('image-service-config', JSON.stringify(config));
            console.log('配置已修复:', config);
            
            // 4. 重新设置imageService配置
            if (window.imageService) {
                window.imageService.setConfig(config);
                console.log('imageService配置已更新');
                console.log('当前imageService分支:', window.imageService.branch);
            }
            
            alert('分支配置已修复为master！请重新测试上传。');
        } else {
            console.log('分支配置正确，无需修复');
            alert('分支配置已经是正确的：' + config.branch);
        }
    } else {
        console.log('未找到保存的配置');
        alert('未找到保存的配置，请先配置图床');
    }
}

// 检查当前配置状态
function checkCurrentConfig() {
    console.log('=== 当前配置状态 ===');
    
    const savedConfig = localStorage.getItem('image-service-config');
    if (savedConfig) {
        const config = JSON.parse(savedConfig);
        console.log('localStorage配置:', config);
    } else {
        console.log('localStorage: 无配置');
    }
    
    if (window.imageService) {
        console.log('imageService配置:', {
            owner: window.imageService.owner,
            repo: window.imageService.repo,
            branch: window.imageService.branch,
            hasToken: !!window.imageService.token,
            isConfigured: window.imageService.isConfigured()
        });
    } else {
        console.log('imageService: 未初始化');
    }
}

// 强制重新配置
function forceReconfigure() {
    const token = prompt('请输入GitHub Token:');
    if (!token) return;
    
    const config = {
        token: token,
        owner: 'SUNSIR007',
        repo: 'picx-images-hosting',
        branch: 'master',
        imageDir: 'images'
    };
    
    localStorage.setItem('image-service-config', JSON.stringify(config));
    
    if (window.imageService) {
        window.imageService.setConfig(config);
    }
    
    console.log('强制重新配置完成:', config);
    alert('配置已重置为master分支！');
}

// 导出函数到全局
window.fixBranchConfig = fixBranchConfig;
window.checkCurrentConfig = checkCurrentConfig;
window.forceReconfigure = forceReconfigure;

console.log('修复脚本已加载！');
console.log('可用函数:');
console.log('- fixBranchConfig(): 修复分支配置');
console.log('- checkCurrentConfig(): 检查当前配置');
console.log('- forceReconfigure(): 强制重新配置');
