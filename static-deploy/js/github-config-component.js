// GitHub配置组件 - GitHub Configuration Component

Vue.component('github-config', {
    props: ['visible'],
    data() {
        return {
            activeTab: 'github',
            githubConfig: {
                token: '',
                owner: '',
                repo: ''
            },
            imageConfig: {
                token: '',
                owner: '',
                repo: '',
                branch: 'main',
                imageDir: 'images'
            },
            linkRules: {
                github: 'GitHub原始链接',
                jsdelivr: 'jsDelivr CDN',
                statically: 'Statically CDN',
                'china-jsdelivr': '中国jsDelivr CDN'
            },
            selectedLinkRule: 'jsdelivr',
            githubTesting: false,
            githubTestResult: null,
            imageTesting: false,
            imageTestResult: null,
            isMobile: window.innerWidth <= 600
        };
    },
    watch: {
        visible(newVal) {
            if (newVal) {
                this.loadConfig();
            }
        }
    },
    mounted() {
        this.updateResponsiveState();
        window.addEventListener('resize', this.updateResponsiveState);
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.updateResponsiveState);
    },
    methods: {
        updateResponsiveState() {
            this.isMobile = window.innerWidth <= 600;
        },
        loadConfig() {
            const savedGithub = localStorage.getItem('github-config');
            if (savedGithub) {
                this.githubConfig = {
                    ...this.githubConfig,
                    ...JSON.parse(savedGithub)
                };
            }

            const savedImage = localStorage.getItem('image-service-config');
            if (savedImage) {
                const parsed = JSON.parse(savedImage);
                this.imageConfig = {
                    ...this.imageConfig,
                    ...parsed,
                    branch: (parsed.branch || '').trim() || 'main',
                    imageDir: (parsed.imageDir || '').trim() || 'images'
                };
            } else {
                this.imageConfig = {
                    ...this.imageConfig,
                    token: this.githubConfig.token || '',
                    owner: this.githubConfig.owner || '',
                    repo: this.githubConfig.repo || ''
                };
            }

            const savedRule = localStorage.getItem('image-service-link-rule');
            if (window.imageService && typeof window.imageService.getLinkRule === 'function') {
                const rule = window.imageService.getLinkRule();
                if (rule) {
                    this.selectedLinkRule = this.resolveRuleKey(rule) || 'jsdelivr';
                }
            } else if (savedRule) {
                this.selectedLinkRule = this.resolveRuleKey(savedRule) || 'jsdelivr';
            }

            this.githubTestResult = null;
            this.imageTestResult = null;
            this.githubTesting = false;
            this.imageTesting = false;
            this.activeTab = 'github';
        },
        async testGithubConnection() {
            if (!this.githubConfig.token || !this.githubConfig.owner || !this.githubConfig.repo) {
                this.$message.warning('请先填写完整的 GitHub 配置信息');
                this.activeTab = 'github';
                return;
            }

            this.githubTesting = true;
            this.githubTestResult = null;

            try {
                const tempService = new GitHubService();
                tempService.setConfig(this.githubConfig);

                const result = await tempService.testConnection();

                if (result.success) {
                    this.githubTestResult = {
                        success: true,
                        message: `连接成功！用户: ${result.user}，仓库: ${result.repo}，权限: ${result.permissions}`
                    };
                } else {
                    this.githubTestResult = {
                        success: false,
                        message: result.error
                    };
                }
            } catch (error) {
                this.githubTestResult = {
                    success: false,
                    message: `连接失败: ${error.message}`
                };
            } finally {
                this.githubTesting = false;
            }
        },
        async testImageConnection() {
            if (!this.imageConfig.token || !this.imageConfig.owner || !this.imageConfig.repo) {
                this.$message.warning('请先填写完整的图床配置信息');
                this.activeTab = 'image';
                return;
            }

            this.imageTesting = true;
            this.imageTestResult = null;

            try {
                const tempService = new ImageService();
                tempService.setConfig(this.imageConfig);

                const result = await tempService.testConnection();

                if (result.success) {
                    this.imageTestResult = {
                        success: true,
                        message: `连接成功！用户: ${result.user}，仓库: ${result.repo}，权限: ${result.permissions}`
                    };
                } else {
                    this.imageTestResult = {
                        success: false,
                        message: result.error
                    };
                }
            } catch (error) {
                this.imageTestResult = {
                    success: false,
                    message: `连接失败: ${error.message}`
                };
            } finally {
                this.imageTesting = false;
            }
        },
        resolveRuleKey(value) {
            if (value === undefined || value === null) {
                return null;
            }
            if (this.linkRules[value]) {
                return value;
            }
            const normalized = this.normalizeRuleKey(value);
            return Object.keys(this.linkRules).find(key => this.normalizeRuleKey(key) === normalized) || null;
        },
        normalizeRuleKey(value) {
            return String(value || '')
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '');
        },
        save() {
            if (!this.githubConfig.token || !this.githubConfig.owner || !this.githubConfig.repo) {
                this.$message.warning('请先填写完整的 GitHub 配置信息');
                this.activeTab = 'github';
                return;
            }

            if (!this.imageConfig.token || !this.imageConfig.owner || !this.imageConfig.repo) {
                this.$message.warning('请先填写完整的图床配置信息');
                this.activeTab = 'image';
                return;
            }

            const normalizedImageConfig = {
                ...this.imageConfig,
                branch: (this.imageConfig.branch || '').trim() || 'main',
                imageDir: (this.imageConfig.imageDir || '').trim() || 'images'
            };
            const matchedRule = this.resolveRuleKey(this.selectedLinkRule) || 'jsdelivr';

            localStorage.setItem('github-config', JSON.stringify(this.githubConfig));
            localStorage.setItem('image-service-config', JSON.stringify(normalizedImageConfig));
            localStorage.setItem('image-service-link-rule', matchedRule);

            if (window.imageService) {
                window.imageService.setConfig(normalizedImageConfig);
                if (typeof window.imageService.setLinkRule === 'function') {
                    window.imageService.setLinkRule(matchedRule);
                }
            }

            this.$emit('save', {
                github: { ...this.githubConfig },
                image: normalizedImageConfig,
                linkRule: matchedRule
            });
            this.close();
        },
        close() {
            this.$emit('close');
        }
    },
    template: `
        <el-dialog
            title="仓库与图床配置"
            :visible.sync="visible"
            :width="isMobile ? '96vw' : '640px'"
            @close="close"
            custom-class="github-config-dialog">
            <el-tabs v-model="activeTab" type="card">
                <el-tab-pane label="GitHub 仓库" name="github">
                    <el-form
                        :model="githubConfig"
                        :label-width="isMobile ? 'auto' : '140px'"
                        :label-position="isMobile ? 'top' : 'left'">
                        <el-form-item label="Personal Token">
                            <el-input
                                v-model="githubConfig.token"
                                type="password"
                                placeholder="Enter your GitHub Personal Access Token"
                                show-password>
                            </el-input>
                        </el-form-item>

                        <el-form-item label="Repository Owner">
                            <el-input
                                v-model="githubConfig.owner"
                                placeholder="Your GitHub username or organization">
                            </el-input>
                        </el-form-item>

                        <el-form-item label="Repository Name">
                            <el-input
                                v-model="githubConfig.repo"
                                placeholder="The name of the repository">
                            </el-input>
                        </el-form-item>
                    </el-form>

                    <div v-if="githubTestResult" :class="['test-result', githubTestResult.success ? 'success' : 'error']">
                        {{ githubTestResult.message }}
                    </div>
                </el-tab-pane>

                <el-tab-pane label="图床设置" name="image">
                    <el-form
                        :model="imageConfig"
                        :label-width="isMobile ? 'auto' : '140px'"
                        :label-position="isMobile ? 'top' : 'left'">
                        <el-form-item label="Personal Token">
                            <el-input
                                v-model="imageConfig.token"
                                type="password"
                                placeholder="请输入用于图床的 GitHub Token"
                                show-password>
                            </el-input>
                        </el-form-item>

                        <el-form-item label="Repository Owner">
                            <el-input
                                v-model="imageConfig.owner"
                                placeholder="GitHub 用户名或组织名">
                            </el-input>
                        </el-form-item>

                        <el-form-item label="Repository Name">
                            <el-input
                                v-model="imageConfig.repo"
                                placeholder="存放图片的仓库名">
                            </el-input>
                        </el-form-item>

                        <el-form-item label="Branch">
                            <el-input
                                v-model="imageConfig.branch"
                                placeholder="分支名称，如 main 或 master">
                            </el-input>
                        </el-form-item>

                        <el-form-item label="图片目录">
                            <el-input
                                v-model="imageConfig.imageDir"
                                placeholder="图片保存目录，如 images 或 uploads">
                            </el-input>
                        </el-form-item>

                        <el-form-item label="链接生成规则">
                            <el-select v-model="selectedLinkRule" placeholder="请选择">
                                <el-option
                                    v-for="(label, value) in linkRules"
                                    :key="value"
                                    :label="label"
                                    :value="value">
                                </el-option>
                            </el-select>
                        </el-form-item>
                    </el-form>

                    <div v-if="imageTestResult" :class="['test-result', imageTestResult.success ? 'success' : 'error']">
                        {{ imageTestResult.message }}
                    </div>
                </el-tab-pane>
            </el-tabs>

            <div slot="footer" :class="['dialog-footer', { 'is-mobile': isMobile }]">
                <el-button @click="testGithubConnection" :loading="githubTesting">测试 GitHub</el-button>
                <el-button @click="testImageConnection" :loading="imageTesting">测试图床</el-button>
                <el-button @click="close">取消</el-button>
                <el-button type="primary" @click="save" class="save-button">保存配置</el-button>
            </div>
        </el-dialog>
    `
});
