//
//  HeaderView.swift
//  Swift_MarkdownEditor
//
//  Created by Ryuichi on 2025/12/26.
//

import SwiftUI

/// Header 组件 - 匹配 PWA 简洁布局
/// 仅显示上传按钮和 Post 按钮，均带液态玻璃效果
struct HeaderView: View {
    @ObservedObject var viewModel: EditorViewModel
    var onImageUpload: () -> Void
    
    var body: some View {
        HStack {
            // 左侧：图片上传按钮 (带液态玻璃效果)
            uploadButton
            
            Spacer()
            
            // 右侧：发布按钮 (带液态玻璃效果)
            publishButton
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 16)
    }
    
    // MARK: - 上传按钮 (匹配 PWA upload-icon.png 样式)
    
    private var uploadButton: some View {
        Button {
            HapticManager.impact(.medium)
            onImageUpload()
        } label: {
            Image(systemName: "photo.on.rectangle.angled")
                .font(.system(size: 20, weight: .regular))
                .foregroundColor(.textSecondary)
                .frame(width: 44, height: 44)
        }
        .buttonStyle(HighlightButtonStyle())
        .glassEffect()
    }
    
    // MARK: - 发布按钮 (带液态玻璃效果)
    
    private var publishButton: some View {
        Button {
            HapticManager.impact(.medium)
            Task {
                await viewModel.publish()
            }
        } label: {
            Group {
                if viewModel.isPublishing {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .textMain))
                        .scaleEffect(0.8)
                } else {
                    Text("Post")
                        .font(.system(size: 15, weight: .semibold))
                }
            }
            .frame(minWidth: 70)
            .padding(.horizontal, 20)
            .padding(.vertical, 10)
            .foregroundColor(.textMain)
        }
        .buttonStyle(.plain)
        .glassEffect()
        .disabled(!viewModel.isGitHubConfigured || viewModel.isPublishing)
        .opacity(viewModel.isGitHubConfigured ? 1 : 0.6)
    }
}

// MARK: - 系统风格高亮按钮样式

/// 类似系统按钮的高亮效果：按下时变暗，松开时恢复
struct HighlightButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .opacity(configuration.isPressed ? 0.5 : 1.0)
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}

#Preview {
    HeaderView(viewModel: EditorViewModel()) {
        print("Upload image tapped")
    }
    .preferredColorScheme(.dark)
    .background(Color.bgBody)
}
