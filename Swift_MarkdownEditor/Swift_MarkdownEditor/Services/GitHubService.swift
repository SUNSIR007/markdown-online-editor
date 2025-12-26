//
//  GitHubService.swift
//  Swift_MarkdownEditor
//
//  Created by Ryuichi on 2025/12/26.
//

import Foundation

/// GitHub API 服务
/// 对应 PWA 中的 github-service.js
actor GitHubService {
    
    // MARK: - 单例
    
    static let shared = GitHubService()
    
    // MARK: - 属性
    
    private let baseURL = "https://api.github.com"
    
    // MARK: - 初始化
    
    private init() {}
    
    // MARK: - API 请求
    
    /// 发送 GitHub API 请求
    private func request<T: Decodable>(
        endpoint: String,
        method: String = "GET",
        body: Data? = nil
    ) async throws -> T {
        guard AppConfig.isGitHubConfigured else {
            throw GitHubError.notConfigured
        }
        
        guard let url = URL(string: "\(baseURL)\(endpoint)") else {
            throw GitHubError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("token \(AppConfig.githubToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/vnd.github.v3+json", forHTTPHeaderField: "Accept")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let body = body {
            request.httpBody = body
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw GitHubError.invalidResponse
        }
        
        guard (200...299).contains(httpResponse.statusCode) else {
            if let errorResponse = try? JSONDecoder().decode(GitHubErrorResponse.self, from: data) {
                throw GitHubError.apiError(code: httpResponse.statusCode, message: errorResponse.message)
            }
            throw GitHubError.apiError(code: httpResponse.statusCode, message: "Unknown error")
        }
        
        return try JSONDecoder().decode(T.self, from: data)
    }
    
    // MARK: - 文件操作
    
    /// 获取文件内容
    func getFile(path: String) async throws -> FileContent? {
        do {
            let response: GitHubFileResponse = try await request(
                endpoint: "/repos/\(AppConfig.githubOwner)/\(AppConfig.githubRepo)/contents/\(path)"
            )
            
            // 解码 Base64 内容
            guard let contentData = Data(base64Encoded: response.content.replacingOccurrences(of: "\n", with: "")) else {
                throw GitHubError.invalidContent
            }
            
            guard let content = String(data: contentData, encoding: .utf8) else {
                throw GitHubError.invalidContent
            }
            
            return FileContent(content: content, sha: response.sha)
        } catch GitHubError.apiError(let code, _) where code == 404 {
            return nil // 文件不存在
        }
    }
    
    /// 创建或更新文件
    func createOrUpdateFile(
        path: String,
        content: String,
        message: String,
        sha: String? = nil
    ) async throws -> CreateFileResponse {
        guard let contentData = content.data(using: .utf8) else {
            throw GitHubError.invalidContent
        }
        
        let base64Content = contentData.base64EncodedString()
        
        var requestBody: [String: Any] = [
            "message": message,
            "content": base64Content
        ]
        
        if let sha = sha {
            requestBody["sha"] = sha
        }
        
        let bodyData = try JSONSerialization.data(withJSONObject: requestBody)
        
        return try await request(
            endpoint: "/repos/\(AppConfig.githubOwner)/\(AppConfig.githubRepo)/contents/\(path)",
            method: "PUT",
            body: bodyData
        )
    }
    
    // MARK: - 发布内容
    
    /// 发布内容到 GitHub
    func publishContent(
        type: ContentType,
        metadata: Metadata,
        content: String
    ) async throws -> PublishResult {
        // 生成文件路径
        let filePath = generateFilePath(type: type, metadata: metadata, content: content)
        
        // 检查文件是否已存在
        let existingFile = try await getFile(path: filePath)
        
        // 生成提交消息
        let action = existingFile != nil ? "Update" : "Add"
        let title = metadata.title.isEmpty ? "Untitled" : metadata.title
        let message = "\(action) \(type.rawValue): \(title)"
        
        // 创建或更新文件
        let result = try await createOrUpdateFile(
            path: filePath,
            content: content,
            message: message,
            sha: existingFile?.sha
        )
        
        return PublishResult(
            success: true,
            filePath: filePath,
            url: result.content.htmlUrl,
            action: action.lowercased()
        )
    }
    
    /// 生成文件路径
    func generateFilePath(type: ContentType, metadata: Metadata, content: String) -> String {
        let now = Date()
        let calendar = Calendar.current
        
        let year = calendar.component(.year, from: now)
        let month = String(format: "%02d", calendar.component(.month, from: now))
        let day = String(format: "%02d", calendar.component(.day, from: now))
        let hour = String(format: "%02d", calendar.component(.hour, from: now))
        let minute = String(format: "%02d", calendar.component(.minute, from: now))
        let second = String(format: "%02d", calendar.component(.second, from: now))
        
        let datePrefix = "\(year)-\(month)-\(day)"
        let timestamp = "\(hour)\(minute)\(second)"
        
        switch type {
        case .blog:
            let safeTitle = (metadata.title.isEmpty ? "untitled" : metadata.title)
                .replacingOccurrences(of: "[^\\w\\s\\u4e00-\\u9fa5-]", with: "", options: .regularExpression)
                .replacingOccurrences(of: "\\s+", with: "-", options: .regularExpression)
                .lowercased()
            return "src/content/posts/\(safeTitle)-\(timestamp).md"
            
        case .essay:
            // 提取内容前四个字符
            let plainText = content
                .replacingOccurrences(of: "^---[\\s\\S]*?---\\n*", with: "", options: .regularExpression)
                .replacingOccurrences(of: "!\\[.*?\\]\\(.*?\\)", with: "", options: .regularExpression)
                .replacingOccurrences(of: "\\[([^\\]]+)\\]\\([^\\)]+\\)", with: "$1", options: .regularExpression)
                .replacingOccurrences(of: "[#*`_~\\->|/]", with: "", options: .regularExpression)
                .replacingOccurrences(of: "\\s+", with: "", options: .regularExpression)
            
            var firstFourChars = ""
            var charCount = 0
            for char in plainText {
                if charCount >= 4 { break }
                let str = String(char)
                if str.range(of: "[\\u4e00-\\u9fa5a-zA-Z]", options: .regularExpression) != nil {
                    firstFourChars += str
                    charCount += 1
                }
            }
            
            if firstFourChars.isEmpty {
                return "src/content/essays/\(datePrefix)-\(timestamp).md"
            } else {
                return "src/content/essays/\(datePrefix)-\(firstFourChars)-\(timestamp).md"
            }
            
        case .gallery:
            return "src/content/photos/photo-\(datePrefix)-\(Date().timeIntervalSince1970).json"
        }
    }
    
    // MARK: - 图片上传
    
    /// 上传图片到图床仓库
    func uploadImage(
        imageData: Data,
        fileName: String
    ) async throws -> ImageUploadResult {
        let base64Content = imageData.base64EncodedString()
        
        let now = Date()
        let calendar = Calendar.current
        let year = calendar.component(.year, from: now)
        let month = String(format: "%02d", calendar.component(.month, from: now))
        
        let filePath = "\(AppConfig.imagePath)/\(year)/\(month)/\(fileName)"
        
        let requestBody: [String: Any] = [
            "message": "Upload image: \(fileName)",
            "content": base64Content,
            "branch": AppConfig.imageBranch
        ]
        
        let bodyData = try JSONSerialization.data(withJSONObject: requestBody)
        
        let response: CreateFileResponse = try await request(
            endpoint: "/repos/\(AppConfig.githubOwner)/\(AppConfig.imageRepo)/contents/\(filePath)",
            method: "PUT",
            body: bodyData
        )
        
        let cdnUrl = AppConfig.generateImageCDNUrl(path: filePath)
        
        return ImageUploadResult(
            success: true,
            path: filePath,
            url: cdnUrl,
            sha: response.content.sha
        )
    }
}

// MARK: - 错误类型

enum GitHubError: Error, LocalizedError {
    case notConfigured
    case invalidURL
    case invalidResponse
    case invalidContent
    case apiError(code: Int, message: String)
    
    var errorDescription: String? {
        switch self {
        case .notConfigured:
            return "GitHub 配置缺失"
        case .invalidURL:
            return "无效的 URL"
        case .invalidResponse:
            return "无效的响应"
        case .invalidContent:
            return "无效的内容"
        case .apiError(let code, let message):
            return "GitHub API 错误 (\(code)): \(message)"
        }
    }
}

// MARK: - 响应模型

struct GitHubErrorResponse: Decodable {
    let message: String
}

struct GitHubFileResponse: Decodable {
    let name: String
    let path: String
    let sha: String
    let content: String
    let encoding: String
    
    enum CodingKeys: String, CodingKey {
        case name, path, sha, content, encoding
    }
}

struct CreateFileResponse: Decodable {
    let content: FileInfo
    
    struct FileInfo: Decodable {
        let name: String
        let path: String
        let sha: String
        let htmlUrl: String
        
        enum CodingKeys: String, CodingKey {
            case name, path, sha
            case htmlUrl = "html_url"
        }
    }
}

struct FileContent {
    let content: String
    let sha: String
}

struct PublishResult {
    let success: Bool
    let filePath: String
    let url: String
    let action: String
}

struct ImageUploadResult {
    let success: Bool
    let path: String
    let url: String
    let sha: String
}
