//
//  AppConfig.swift
//  Swift_MarkdownEditor
//
//  Created by Ryuichi on 2025/12/26.
//

import Foundation

/// 应用配置，包含 GitHub Token 和仓库配置
/// 对应 PWA 中的 runtime-config.js
struct AppConfig {
    
    // MARK: - GitHub 配置（内容仓库）
    
    /// GitHub Personal Access Token
    /// TODO: 请替换为您的实际 Token
    static let githubToken = "YOUR_GITHUB_TOKEN_HERE"
    
    /// GitHub 用户名
    static let githubOwner = "YOUR_GITHUB_USERNAME"
    
    /// 内容仓库名称
    static let githubRepo = "YOUR_CONTENT_REPO"
    
    /// 分支名称
    static let githubBranch = "main"
    
    // MARK: - 图床配置（图片仓库）
    
    /// 图片仓库名称
    static let imageRepo = "YOUR_IMAGE_REPO"
    
    /// 图片分支
    static let imageBranch = "main"
    
    /// 图片存储路径前缀
    static let imagePath = "images"
    
    /// CDN 类型: "jsdelivr", "statically", "raw"
    static let cdnType = "jsdelivr"
    
    // MARK: - 图片压缩配置
    
    /// 最大图片宽度
    static let maxImageWidth: CGFloat = 1920
    
    /// 最大图片高度
    static let maxImageHeight: CGFloat = 1080
    
    /// 图片压缩质量 (0.0 - 1.0)
    static let imageQuality: CGFloat = 0.85
    
    /// 最大文件大小 (字节) - 5MB
    static let maxFileSize: Int = 5 * 1024 * 1024
    
    // MARK: - API 配置
    
    /// GitHub API 基础 URL
    static let githubAPIBaseURL = "https://api.github.com"
    
    // MARK: - 辅助方法
    
    /// 检查 GitHub 是否已配置
    static var isGitHubConfigured: Bool {
        !githubToken.isEmpty &&
        githubToken != "YOUR_GITHUB_TOKEN_HERE" &&
        !githubOwner.isEmpty &&
        githubOwner != "YOUR_GITHUB_USERNAME" &&
        !githubRepo.isEmpty &&
        githubRepo != "YOUR_CONTENT_REPO"
    }
    
    /// 检查图床是否已配置
    static var isImageServiceConfigured: Bool {
        isGitHubConfigured &&
        !imageRepo.isEmpty &&
        imageRepo != "YOUR_IMAGE_REPO"
    }
    
    /// 生成图片 CDN 链接
    static func generateImageCDNUrl(path: String) -> String {
        switch cdnType {
        case "jsdelivr":
            return "https://cdn.jsdelivr.net/gh/\(githubOwner)/\(imageRepo)@\(imageBranch)/\(path)"
        case "statically":
            return "https://cdn.statically.io/gh/\(githubOwner)/\(imageRepo)/\(imageBranch)/\(path)"
        default:
            return "https://raw.githubusercontent.com/\(githubOwner)/\(imageRepo)/\(imageBranch)/\(path)"
        }
    }
}
