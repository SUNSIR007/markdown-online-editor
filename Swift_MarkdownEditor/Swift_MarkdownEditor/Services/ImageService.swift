//
//  ImageService.swift
//  Swift_MarkdownEditor
//
//  Created by Ryuichi on 2025/12/26.
//

import Foundation
import UIKit
import SwiftUI

/// 图片服务
/// 对应 PWA 中的 image-service.js
actor ImageService {
    
    // MARK: - 单例
    
    static let shared = ImageService()
    
    // MARK: - 初始化
    
    private init() {}
    
    // MARK: - 图片压缩
    
    /// 压缩图片
    /// - Parameters:
    ///   - image: 原始图片
    ///   - maxWidth: 最大宽度
    ///   - maxHeight: 最大高度
    ///   - quality: 压缩质量 (0.0 - 1.0)
    /// - Returns: 压缩后的图片数据
    func compressImage(
        _ image: UIImage,
        maxWidth: CGFloat = AppConfig.maxImageWidth,
        maxHeight: CGFloat = AppConfig.maxImageHeight,
        quality: CGFloat = AppConfig.imageQuality
    ) -> Data? {
        // 计算缩放比例
        var newWidth = image.size.width
        var newHeight = image.size.height
        
        if newWidth > maxWidth {
            let ratio = maxWidth / newWidth
            newWidth = maxWidth
            newHeight = newHeight * ratio
        }
        
        if newHeight > maxHeight {
            let ratio = maxHeight / newHeight
            newHeight = maxHeight
            newWidth = newWidth * ratio
        }
        
        // 如果尺寸没有变化且在限制内，尝试直接压缩
        if newWidth == image.size.width && newHeight == image.size.height {
            return image.jpegData(compressionQuality: quality)
        }
        
        // 缩放图片
        let newSize = CGSize(width: newWidth, height: newHeight)
        UIGraphicsBeginImageContextWithOptions(newSize, false, 1.0)
        image.draw(in: CGRect(origin: .zero, size: newSize))
        let resizedImage = UIGraphicsGetImageFromCurrentImageContext()
        UIGraphicsEndImageContext()
        
        return resizedImage?.jpegData(compressionQuality: quality)
    }
    
    /// 智能压缩图片（自动调整质量以达到目标大小）
    func smartCompress(
        _ image: UIImage,
        targetSize: Int = AppConfig.maxFileSize
    ) -> Data? {
        // 先按最大尺寸缩放
        var quality: CGFloat = AppConfig.imageQuality
        var imageData = compressImage(image, quality: quality)
        
        // 如果仍然太大，降低质量
        while let data = imageData, data.count > targetSize, quality > 0.1 {
            quality -= 0.1
            imageData = compressImage(image, quality: quality)
        }
        
        return imageData
    }
    
    // MARK: - 图片上传
    
    /// 上传图片
    /// - Parameters:
    ///   - image: 要上传的图片
    ///   - fileName: 文件名（可选，自动生成）
    /// - Returns: 上传结果，包含 CDN URL
    func uploadImage(
        _ image: UIImage,
        fileName: String? = nil
    ) async throws -> ImageUploadResult {
        guard AppConfig.isImageServiceConfigured else {
            throw ImageServiceError.notConfigured
        }
        
        // 压缩图片
        guard let imageData = smartCompress(image) else {
            throw ImageServiceError.compressionFailed
        }
        
        // 生成文件名
        let finalFileName = fileName ?? generateFileName()
        
        // 上传到 GitHub
        return try await GitHubService.shared.uploadImage(
            imageData: imageData,
            fileName: finalFileName
        )
    }
    
    /// 从 Data 上传图片
    func uploadImageData(
        _ data: Data,
        fileName: String? = nil
    ) async throws -> ImageUploadResult {
        guard let image = UIImage(data: data) else {
            throw ImageServiceError.invalidImage
        }
        
        return try await uploadImage(image, fileName: fileName)
    }
    
    // MARK: - 辅助方法
    
    /// 生成唯一文件名
    private func generateFileName() -> String {
        let timestamp = Int(Date().timeIntervalSince1970 * 1000)
        let random = Int.random(in: 1000...9999)
        return "img-\(timestamp)-\(random).jpg"
    }
    
    /// 验证图片文件类型
    func validateImageType(_ data: Data) -> Bool {
        guard data.count >= 8 else { return false }
        
        let bytes = [UInt8](data.prefix(8))
        
        // JPEG: FF D8 FF
        if bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF {
            return true
        }
        
        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if bytes[0] == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47 {
            return true
        }
        
        // GIF: 47 49 46 38
        if bytes[0] == 0x47 && bytes[1] == 0x49 && bytes[2] == 0x46 && bytes[3] == 0x38 {
            return true
        }
        
        // WebP: RIFF....WEBP
        if bytes[0] == 0x52 && bytes[1] == 0x49 && bytes[2] == 0x46 && bytes[3] == 0x46 {
            return true
        }
        
        return false
    }
    
    /// 获取图片文件扩展名
    func getImageExtension(_ data: Data) -> String {
        guard data.count >= 8 else { return "jpg" }
        
        let bytes = [UInt8](data.prefix(8))
        
        if bytes[0] == 0x89 && bytes[1] == 0x50 {
            return "png"
        }
        
        if bytes[0] == 0x47 && bytes[1] == 0x49 {
            return "gif"
        }
        
        if bytes[0] == 0x52 && bytes[1] == 0x49 {
            return "webp"
        }
        
        return "jpg"
    }
}

// MARK: - 错误类型

enum ImageServiceError: Error, LocalizedError {
    case notConfigured
    case invalidImage
    case compressionFailed
    case uploadFailed(String)
    case fileTooLarge
    
    var errorDescription: String? {
        switch self {
        case .notConfigured:
            return "图床配置缺失"
        case .invalidImage:
            return "无效的图片"
        case .compressionFailed:
            return "图片压缩失败"
        case .uploadFailed(let message):
            return "上传失败: \(message)"
        case .fileTooLarge:
            return "文件过大"
        }
    }
}
