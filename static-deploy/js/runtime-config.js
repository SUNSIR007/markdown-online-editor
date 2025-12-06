// 此文件由 scripts/generate-runtime-config.js 自动生成
// 如需更新配置，请修改 Vercel 环境变量后重新执行 npm run build

const RuntimeConfig = {
    "github": {
        "token": null,
        "owner": null,
        "repo": null
    },
    "imageService": {
        "token": null,
        "owner": null,
        "repo": null,
        "branch": "main",
        "imageDir": "images",
        "linkRule": "jsdelivr"
    }
};

// 向后兼容 - 保留全局变量
if (typeof window !== 'undefined') {
    window.RuntimeConfig = RuntimeConfig;
}

// ES Module 导出
export default RuntimeConfig;
