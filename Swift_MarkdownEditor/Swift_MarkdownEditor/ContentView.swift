//
//  ContentView.swift
//  Swift_MarkdownEditor
//
//  Created by Ryuichi on 2025/12/26.
//

import SwiftUI
import PhotosUI

/// 主视图
/// 对应 PWA 中的 #app Vue 根组件
struct ContentView: View {
    @StateObject private var viewModel = EditorViewModel()
    @State private var showImagePicker = false
    @State private var selectedPhotoItem: PhotosPickerItem?
    
    var body: some View {
        ZStack {
            // 背景
            Color.bgBody
                .ignoresSafeArea()
            
            // 主内容
            VStack(spacing: 0) {
                // Header
                HeaderView(viewModel: viewModel) {
                    showImagePicker = true
                }
                
                // 元数据编辑器（仅 Blog 类型显示）
                MetadataEditorView(viewModel: viewModel)
                
                // 编辑器区域
                MarkdownEditorView(text: $viewModel.bodyContent)
                    .padding(.horizontal, 16)
                    .padding(.top, 16)
                    .padding(.bottom, 8)
            }
            
            // 上传 HUD
            if viewModel.showUploadHUD {
                Color.black.opacity(0.4)
                    .ignoresSafeArea()
                    .transition(.opacity)
                
                UploadHUDView(status: viewModel.uploadStatus)
            }
            
            // 成功反馈
            if viewModel.showSuccessFeedback {
                FeedbackOverlayView(isSuccess: true, isVisible: $viewModel.showSuccessFeedback)
            }
            
            // 失败反馈
            if viewModel.showErrorFeedback {
                FeedbackOverlayView(isSuccess: false, isVisible: $viewModel.showErrorFeedback)
            }
        }
        .preferredColorScheme(.dark)
        .photosPicker(
            isPresented: $showImagePicker,
            selection: $selectedPhotoItem,
            matching: .images
        )
        .onChange(of: selectedPhotoItem) { _, newItem in
            Task {
                await handleSelectedPhoto(newItem)
            }
        }
    }
    
    // MARK: - 图片处理
    
    private func handleSelectedPhoto(_ item: PhotosPickerItem?) async {
        guard let item = item else { return }
        
        do {
            if let data = try await item.loadTransferable(type: Data.self),
               let image = UIImage(data: data) {
                if let url = await viewModel.uploadImage(image) {
                    viewModel.insertImageMarkdown(url)
                }
            }
        } catch {
            print("加载图片失败: \(error)")
        }
        
        selectedPhotoItem = nil
    }
}

#Preview {
    ContentView()
}
