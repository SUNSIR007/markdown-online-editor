const fs = require('fs');
const path = require('path');

const runtimeConfigPath = path.join(__dirname, '..', 'static-deploy', 'js', 'runtime-config.js');

const readEnv = (key) => {
    const value = process.env[key];
    return typeof value === 'string' ? value.trim() : '';
};

const toNullable = (value) => {
    const trimmed = typeof value === 'string' ? value.trim() : value;
    return trimmed ? trimmed : null;
};

const githubToken = readEnv('MARKDOWN_EDITOR_GITHUB_TOKEN');
const githubOwner = readEnv('MARKDOWN_EDITOR_GITHUB_OWNER');
const githubRepo = readEnv('MARKDOWN_EDITOR_GITHUB_REPO');

const imageToken = readEnv('MARKDOWN_EDITOR_IMAGE_TOKEN') || githubToken;
const imageOwner = readEnv('MARKDOWN_EDITOR_IMAGE_OWNER') || githubOwner;
const imageRepo = readEnv('MARKDOWN_EDITOR_IMAGE_REPO') || githubRepo;
const imageBranch = readEnv('MARKDOWN_EDITOR_IMAGE_BRANCH') || 'main';
const imageDir = readEnv('MARKDOWN_EDITOR_IMAGE_DIR') || 'images';
const imageLinkRule = readEnv('MARKDOWN_EDITOR_IMAGE_LINK_RULE') || 'jsdelivr';

const runtimeConfig = {
    github: {
        token: toNullable(githubToken),
        owner: toNullable(githubOwner),
        repo: toNullable(githubRepo)
    },
    imageService: {
        token: toNullable(imageToken),
        owner: toNullable(imageOwner),
        repo: toNullable(imageRepo),
        branch: imageBranch,
        imageDir: imageDir,
        linkRule: imageLinkRule
    }
};

const banner = [
    '// 此文件由 scripts/generate-runtime-config.js 自动生成',
    '// 如需更新配置，请修改 Vercel 环境变量后重新执行 npm run build',
    '(function () {',
    '    window.RuntimeConfig = ' + JSON.stringify(runtimeConfig, null, 4) + ';',
    '})();',
    ''
].join('\n');

fs.mkdirSync(path.dirname(runtimeConfigPath), { recursive: true });
fs.writeFileSync(runtimeConfigPath, banner, 'utf8');

console.log('Runtime configuration written to', path.relative(process.cwd(), runtimeConfigPath));
