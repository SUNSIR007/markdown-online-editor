//
//  HeaderView.swift
//  Swift_MarkdownEditor
//
//  Created by Ryuichi on 2025/12/26.
//

import SwiftUI

/// Header 组件
/// 对应 PWA 中的 .header 和 .content-type-selector
struct HeaderView: View {
    @ObservedObject var viewModel: EditorViewModel
    var onImageUpload: () -> Void
    
    var body: some View {
        HStack(spacing: 16) {
            // 内容类型选择按钮组
            typeButtonsGroup
            
            Spacer()
            
            // 操作按钮
            actionButtons
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 12)
        .background(.ultraThinMaterial)
        .glassEffect()
    }
    
    // MARK: - 内容类型按钮组
    
    private var typeButtonsGroup: some View {
        HStack(spacing: 4) {
            ForEach(ContentType.allCases) { type in
                typeButton(for: type)
            }
        }
        .padding(4)
        .background(Color.bgSurface.opacity(0.6))
        .clipShape(RoundedRectangle(cornerRadius: ThemeStyle.radiusMd))
    }
    
    private func typeButton(for type: ContentType) -> some View {
        Button {
            withAnimation(ThemeStyle.springAnimation) {
                viewModel.selectType(type)
            }
        } label: {
            HStack(spacing: 6) {
                Image(systemName: type.iconName)
                    .font(.system(size: 14))
                Text(type.label)
                    .font(.system(size: 14, weight: .medium))
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .foregroundColor(viewModel.currentType == type ? .textMain : .textSecondary)
            .background(
                viewModel.currentType == type
                    ? Color.bgSurfaceHover
                    : Color.clear
            )
            .clipShape(RoundedRectangle(cornerRadius: ThemeStyle.radiusSm))
        }
        .buttonStyle(.plain)
    }
    
    // MARK: - 操作按钮
    
    private var actionButtons: some View {
        HStack(spacing: 12) {
            // 图片上传按钮
            Button {
                onImageUpload()
            } label: {
                Image(systemName: "photo.badge.plus")
                    .font(.system(size: 18))
                    .foregroundColor(.textSecondary)
                    .frame(width: 40, height: 40)
                    .background(Color.bgSurface)
                    .clipShape(RoundedRectangle(cornerRadius: ThemeStyle.radiusMd))
            }
            .buttonStyle(.plain)
            
            // 发布按钮
            publishButton
        }
    }
    
    private var publishButton: some View {
        Button {
            Task {
                await viewModel.publish()
            }
        } label: {
            Group {
                if viewModel.isPublishing {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        .scaleEffect(0.8)
                } else {
                    Text("Post")
                        .font(.system(size: 15, weight: .semibold))
                }
            }
            .frame(minWidth: 80)
            .padding(.horizontal, 20)
            .padding(.vertical, 10)
            .foregroundColor(.textMain)
            .background(
                viewModel.hasBodyContent || viewModel.isPublishing
                    ? Color.primaryBlue.opacity(0.3)
                    : Color.bgSurface.opacity(0.7)
            )
            .overlay(
                RoundedRectangle(cornerRadius: ThemeStyle.radiusFull)
                    .stroke(
                        viewModel.hasBodyContent || viewModel.isPublishing
                            ? Color.primaryBlue.opacity(0.6)
                            : Color.primaryBlue.opacity(0.4),
                        lineWidth: 1
                    )
            )
            .clipShape(RoundedRectangle(cornerRadius: ThemeStyle.radiusFull))
        }
        .buttonStyle(.plain)
        .disabled(!viewModel.isGitHubConfigured || viewModel.isPublishing)
        .opacity(viewModel.isGitHubConfigured ? 1 : 0.5)
        .animation(.easeInOut(duration: 0.2), value: viewModel.isPublishing)
        .animation(.easeInOut(duration: 0.2), value: viewModel.hasBodyContent)
    }
}

#Preview {
    HeaderView(viewModel: EditorViewModel()) {
        print("Upload image tapped")
    }
    .preferredColorScheme(.dark)
    .background(Color.bgBody)
}
