//
//  HeaderView.swift
//  Swift_MarkdownEditor
//
//  Created by Ryuichi on 2025/12/26.
//

import SwiftUI

/// Header 组件 - 匹配 PWA 简洁布局
/// 仅显示上传按钮和 Post 按钮
struct HeaderView: View {
    @ObservedObject var viewModel: EditorViewModel
    var onImageUpload: () -> Void
    
    var body: some View {
        HStack {
            // 左侧：图片上传按钮
            Button {
                onImageUpload()
            } label: {
                Image(systemName: "photo.badge.plus")
                    .font(.system(size: 22, weight: .regular))
                    .foregroundColor(.textSecondary)
            }
            .buttonStyle(.plain)
            
            Spacer()
            
            // 右侧：发布按钮
            publishButton
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 16)
    }
    
    // MARK: - 发布按钮 (匹配 PWA 样式)
    
    private var publishButton: some View {
        Button {
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
            .frame(minWidth: 80)
            .padding(.horizontal, 24)
            .padding(.vertical, 12)
            .foregroundColor(.textMain)
            .background(
                RoundedRectangle(cornerRadius: 24)
                    .fill(Color.bgSurface.opacity(0.7))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 24)
                    .stroke(Color.primaryBlue.opacity(0.4), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
        .disabled(!viewModel.isGitHubConfigured || viewModel.isPublishing)
        .opacity(viewModel.isGitHubConfigured ? 1 : 0.6)
    }
}

#Preview {
    HeaderView(viewModel: EditorViewModel()) {
        print("Upload image tapped")
    }
    .preferredColorScheme(.dark)
    .background(Color.bgBody)
}
