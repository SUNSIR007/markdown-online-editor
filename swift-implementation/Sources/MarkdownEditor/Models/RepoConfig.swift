import Foundation

struct RepoConfig: Codable, Equatable {
    var token: String
    var owner: String
    var repo: String
    var branch: String
    
    static let empty = RepoConfig(token: "", owner: "", repo: "", branch: "main")
    
    var isValid: Bool {
        !token.isEmpty && !owner.isEmpty && !repo.isEmpty
    }
}
