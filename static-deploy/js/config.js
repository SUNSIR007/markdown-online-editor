// 配置常量 - Configuration Constants

// 内容类型定义
const contentTypes = {
    GENERAL: 'general',
    BLOG: 'blog',
    ESSAY: 'essay',
    GALLERY: 'gallery'
};

// 内容类型标签
const contentTypeLabels = {
    [contentTypes.BLOG]: 'Blogs',
    [contentTypes.ESSAY]: 'Essays',
    [contentTypes.GALLERY]: 'Gallery'
};

// 元数据字段配置
const metadataFields = {
    [contentTypes.BLOG]: [
        { key: 'title', label: '标题', type: 'text', required: true },
        { key: 'categories', label: '分类', type: 'tags' },
        { key: 'date', label: '发布日期', type: 'datetime' }
    ],
    [contentTypes.ESSAY]: [
        { key: 'pubDate', label: '发布日期', type: 'datetime' }
    ],
    [contentTypes.GALLERY]: [
        // Gallery模式不显示任何元数据字段，date在后台自动添加
    ]
};

// 模板生成函数
function generateContentWithMetadata(contentType, metadata, content) {
    if (contentType === contentTypes.GENERAL) {
        return content;
    }

    const frontmatter = Object.keys(metadata)
        .filter(key => metadata[key] !== undefined && metadata[key] !== '')
        .map(key => {
            let value = metadata[key];
            if (key === 'categories' && typeof value === 'string') {
                value = value.split(',').map(cat => cat.trim()).filter(cat => cat);
            }
            if (typeof value === 'string' && value.includes(':')) {
                value = `"${value}"`;
            }
            return `${key}: ${Array.isArray(value) ? JSON.stringify(value) : value}`;
        })
        .join('\n');

    return `---\n${frontmatter}\n---\n\n${content}`;
}

// 向后兼容 - 保留全局变量
if (typeof window !== 'undefined') {
    window.AppConfig = {
        contentTypes,
        contentTypeLabels,
        metadataFields
    };
    window.generateContentWithMetadata = generateContentWithMetadata;
}

// ES Module 导出
export {
    contentTypes,
    contentTypeLabels,
    metadataFields,
    generateContentWithMetadata
};
