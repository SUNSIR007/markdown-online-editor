import Foundation
import SwiftUI

@Observable
@MainActor
class EditorViewModel {
    var content: String = ""
    var isLoading: Bool = false
    var errorMessage: String?
    
    private let githubService: GitHubService
    private let imageService: ImageService
    private var currentFile: GitHubFile?
    
    init(githubService: GitHubService) {
        self.githubService = githubService
        self.imageService = ImageService(githubService: githubService)
    }
    
    func loadFile(_ file: GitHubFile) async {
        self.currentFile = file
        self.isLoading = true
        self.errorMessage = nil
        
        do {
            let fullFile = try await githubService.getFile(path: file.path)
            if let decoded = fullFile.decodedContent {
                self.content = decoded
            } else {
                self.errorMessage = "Failed to decode file content"
            }
        } catch {
            self.errorMessage = error.localizedDescription
        }
        
        self.isLoading = false
    }
    
    func save(content: String) async {
        guard let file = currentFile else { return }
        self.isLoading = true
        
        do {
            _ = try await githubService.createOrUpdateFile(
                path: file.path,
                content: content,
                message: "Update \(file.name)",
                sha: file.sha
            )
            // Update current file sha if needed, but for now just success
        } catch {
            self.errorMessage = "Save failed: \(error.localizedDescription)"
        }
        
        self.isLoading = false
    }
    
    func uploadImage(name: String, data: Data) async -> String? {
        do {
            let file = try await imageService.compressAndUpload(data: data, filename: name)
            // Return markdown format
            return "![\(name)](\(file.downloadUrl ?? file.url))"
        } catch {
            self.errorMessage = "Image upload failed: \(error.localizedDescription)"
            return nil
        }
    }
}
