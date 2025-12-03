import Foundation

@Observable
@MainActor
class GitHubService {
    var config: RepoConfig
    
    private let baseURL = "https://api.github.com"
    private let session = URLSession.shared
    
    init(config: RepoConfig = .empty) {
        self.config = config
    }
    
    // MARK: - API Request Helper
    
    private func request(_ endpoint: String, method: String = "GET", body: Data? = nil) async throws -> Data {
        guard config.isValid else {
            throw GitHubError.notConfigured
        }
        
        guard let url = URL(string: "\(baseURL)\(endpoint)") else {
            throw GitHubError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("token \(config.token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/vnd.github.v3+json", forHTTPHeaderField: "Accept")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let body = body {
            request.httpBody = body
        }
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw GitHubError.networkError
        }
        
        guard (200...299).contains(httpResponse.statusCode) else {
            // Try to parse error message
            if let errorResponse = try? JSONDecoder().decode(GitHubAPIError.self, from: data) {
                throw GitHubError.apiError(message: errorResponse.message)
            }
            throw GitHubError.httpError(statusCode: httpResponse.statusCode)
        }
        
        return data
    }
    
    // MARK: - File Operations
    
    func getFile(path: String) async throws -> GitHubFile {
        let endpoint = "/repos/\(config.owner)/\(config.repo)/contents/\(path)"
        let data = try await request(endpoint)
        return try JSONDecoder().decode(GitHubFile.self, from: data)
    }
    
    func listFiles(path: String) async throws -> [GitHubFile] {
        let endpoint = "/repos/\(config.owner)/\(config.repo)/contents/\(path)"
        let data = try await request(endpoint)
        return try JSONDecoder().decode([GitHubFile].self, from: data)
    }
    
    func createOrUpdateFile(path: String, content: String, message: String, sha: String? = nil) async throws -> GitHubFile {
        guard let contentData = content.data(using: .utf8) else {
            throw GitHubError.encodingError
        }
        return try await uploadFile(path: path, content: contentData, message: message, sha: sha)
    }

    func uploadFile(path: String, content: Data, message: String, sha: String? = nil) async throws -> GitHubFile {
        let endpoint = "/repos/\(config.owner)/\(config.repo)/contents/\(path)"
        let base64Content = content.base64EncodedString()
        
        var bodyDict: [String: Any] = [
            "message": message,
            "content": base64Content,
            "branch": config.branch
        ]
        
        if let sha = sha {
            bodyDict["sha"] = sha
        }
        
        let body = try JSONSerialization.data(withJSONObject: bodyDict)
        let data = try await request(endpoint, method: "PUT", body: body)
        
        struct FileResponse: Decodable {
            let content: GitHubFile
        }
        
        let response = try JSONDecoder().decode(FileResponse.self, from: data)
        return response.content
    }
    
    func getUser() async throws -> GitHubUser {
        let data = try await request("/user")
        return try JSONDecoder().decode(GitHubUser.self, from: data)
    }
}

// MARK: - Errors & Models

enum GitHubError: Error, LocalizedError {
    case notConfigured
    case invalidURL
    case networkError
    case httpError(statusCode: Int)
    case apiError(message: String)
    case encodingError
    
    var errorDescription: String? {
        switch self {
        case .notConfigured: return "GitHub configuration is missing"
        case .invalidURL: return "Invalid URL"
        case .networkError: return "Network error"
        case .httpError(let code): return "HTTP Error: \(code)"
        case .apiError(let msg): return "GitHub API Error: \(msg)"
        case .encodingError: return "Failed to encode content"
        }
    }
}

struct GitHubAPIError: Decodable {
    let message: String
}

struct GitHubUser: Decodable {
    let login: String
    let name: String?
    let avatarUrl: String?
    
    enum CodingKeys: String, CodingKey {
        case login, name
        case avatarUrl = "avatar_url"
    }
}
