//
//  ContentView.swift
//  Swift_MarkdownEditor
//
//  Created by Ryuichi on 2025/12/26.
//

import SwiftUI
import PhotosUI

/// 主视图 - 匹配 PWA 布局
struct ContentView: View {
    @StateObject private var viewModel = EditorViewModel()
    @State private var showImagePicker = false
    @State private var selectedPhotoItems: [PhotosPickerItem] = []
    
    var body: some View {
        ZStack {
            // 深色背景 - 全屏统一颜色
            Color.bgBody
                .ignoresSafeArea()
            
            // 主内容
            VStack(spacing: 0) {
                // Header
                HeaderView(viewModel: viewModel) {
                    // 触觉反馈
                    HapticManager.impact(.light)
                    showImagePicker = true
                }
                
                // 分割线
                Rectangle()
                    .fill(Color.white.opacity(0.05))
                    .frame(height: 1)
                
                // Vditor 编辑器 - 保持圆角矩形风格
                VditorWebView(content: $viewModel.bodyContent)
                    .background(Color.bgSurface)
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(Color.white.opacity(0.05), lineWidth: 1)
                    )
                    .padding(.horizontal, 16)
                    .padding(.top, 16)
                    .padding(.bottom, 8)
                    .ignoresSafeArea(.keyboard)
            }
            
            // 上传 HUD
            if viewModel.showUploadHUD {
                Color.black.opacity(0.5)
                    .ignoresSafeArea()
                
                UploadHUDView(status: viewModel.uploadStatus)
            }
            
            // 成功/失败反馈
            if viewModel.showSuccessFeedback {
                FeedbackOverlayView(isSuccess: true, isVisible: $viewModel.showSuccessFeedback)
            }
            
            if viewModel.showErrorFeedback {
                FeedbackOverlayView(isSuccess: false, isVisible: $viewModel.showErrorFeedback)
            }
        }
        .preferredColorScheme(.dark)
        .photosPicker(
            isPresented: $showImagePicker,
            selection: $selectedPhotoItems,
            maxSelectionCount: 9,
            matching: .images
        )
        .onChange(of: selectedPhotoItems) { _, newItems in
            Task {
                await handleSelectedPhotos(newItems)
            }
        }
    }
    
    // MARK: - 多图片处理
    
    private func handleSelectedPhotos(_ items: [PhotosPickerItem]) async {
        guard !items.isEmpty else { return }
        
        for item in items {
            do {
                if let data = try await item.loadTransferable(type: Data.self),
                   let image = UIImage(data: data) {
                    if let url = await viewModel.uploadImage(image) {
                        // 通过 VditorManager 插入图片
                        VditorManager.shared.insertImage(url: url)
                        // 成功上传触觉反馈
                        HapticManager.notification(.success)
                    } else {
                        // 上传失败触觉反馈
                        HapticManager.notification(.error)
                    }
                }
            } catch {
                print("加载图片失败: \(error)")
                HapticManager.notification(.error)
            }
        }
        
        selectedPhotoItems = []
    }
}

#Preview {
    ContentView()
}
