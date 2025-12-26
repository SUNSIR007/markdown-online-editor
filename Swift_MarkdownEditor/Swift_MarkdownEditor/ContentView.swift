//
//  ContentView.swift
//  Swift_MarkdownEditor
//
//  Created by Ryuichi on 2025/12/26.
//

import SwiftUI
import PhotosUI

/// 主视图 - 匹配 PWA 简洁布局
struct ContentView: View {
    @StateObject private var viewModel = EditorViewModel()
    @State private var showImagePicker = false
    @State private var selectedPhotoItem: PhotosPickerItem?
    
    var body: some View {
        ZStack {
            // 深色背景
            Color.bgBody
                .ignoresSafeArea()
            
            // 主内容
            VStack(spacing: 0) {
                // Header（上传按钮 + Post 按钮）
                HeaderView(viewModel: viewModel) {
                    showImagePicker = true
                }
                
                // 分割线
                Rectangle()
                    .fill(Color.white.opacity(0.05))
                    .frame(height: 1)
                
                // 编辑器区域
                editorArea
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
            selection: $selectedPhotoItem,
            matching: .images
        )
        .onChange(of: selectedPhotoItem) { _, newItem in
            Task {
                await handleSelectedPhoto(newItem)
            }
        }
    }
    
    // MARK: - 编辑器区域 (匹配 PWA 样式)
    
    private var editorArea: some View {
        TextEditor(text: $viewModel.bodyContent)
            .font(.system(size: 16))
            .foregroundColor(.textMain)
            .scrollContentBackground(.hidden)
            .padding(.horizontal, 16)
            .padding(.vertical, 16)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color.bgSurface)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Color.white.opacity(0.05), lineWidth: 1)
            )
            .padding(.horizontal, 16)
            .padding(.top, 24)
            .padding(.bottom, 16)
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
