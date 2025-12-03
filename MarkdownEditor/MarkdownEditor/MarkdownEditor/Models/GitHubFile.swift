import Foundation

struct GitHubFile: Codable, Identifiable, Hashable {
    var id: String { sha }
    let name: String
    let path: String
    let sha: String
    let size: Int
    let url: String
    let htmlUrl: String
    let gitUrl: String
    let downloadUrl: String?
    let type: String
    let content: String?
    let encoding: String?
    
    enum CodingKeys: String, CodingKey {
        case name, path, sha, size, url, type, content, encoding
        case htmlUrl = "html_url"
        case gitUrl = "git_url"
        case downloadUrl = "download_url"
    }
    
    var decodedContent: String? {
        guard let content = content, let encoding = encoding, encoding == "base64" else {
            return nil
        }
        // GitHub API returns content with newlines, need to remove them
        let cleanContent = content.replacingOccurrences(of: "\n", with: "")
        guard let data = Data(base64Encoded: cleanContent) else {
            return nil
        }
        return String(data: data, encoding: .utf8)
    }
}
