import Foundation
import SwiftUI

@Observable
@MainActor
class FileListViewModel {
    var files: [GitHubFile] = []
    var isLoading: Bool = false
    var errorMessage: String?
    
    private let githubService: GitHubService
    
    init(githubService: GitHubService) {
        self.githubService = githubService
    }
    
    func fetchFiles(path: String = "src/content/posts") async {
        self.isLoading = true
        self.errorMessage = nil
        
        do {
            self.files = try await githubService.listFiles(path: path)
        } catch {
            self.errorMessage = error.localizedDescription
        }
        
        self.isLoading = false
    }
}
