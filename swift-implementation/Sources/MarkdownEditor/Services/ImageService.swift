import Foundation
#if canImport(UIKit)
import UIKit
#elseif canImport(AppKit)
import AppKit
#endif

@MainActor
class ImageService {
    private let githubService: GitHubService
    
    init(githubService: GitHubService) {
        self.githubService = githubService
    }
    
    func compressAndUpload(data: Data, filename: String) async throws -> GitHubFile {
        // 1. Compress
        guard let compressedData = compress(data: data) else {
            throw ImageError.compressionFailed
        }
        
        // 2. Generate Path
        let date = Date()
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy/MM/dd"
        let datePath = formatter.string(from: date)
        let path = "src/assets/images/\(datePath)/\(filename)"
        
        // 3. Upload
        return try await githubService.uploadFile(
            path: path,
            content: compressedData,
            message: "Upload image: \(filename)"
        )
    }
    
    private func compress(data: Data) -> Data? {
        // Simple compression logic
        // In a real app, use ImageIO to resize/compress without fully decoding if possible,
        // or use UIImage/NSImage to resize.
        
        #if canImport(UIKit)
        guard let image = UIImage(data: data) else { return nil }
        // Compress to 0.7 quality JPEG
        return image.jpegData(compressionQuality: 0.7)
        #elseif canImport(AppKit)
        guard let image = NSImage(data: data) else { return nil }
        guard let tiff = image.tiffRepresentation,
              let bitmap = NSBitmapImageRep(data: tiff) else { return nil }
        return bitmap.representation(using: .jpeg, properties: [.compressionFactor: 0.7])
        #else
        return data
        #endif
    }
}

enum ImageError: Error {
    case compressionFailed
}
