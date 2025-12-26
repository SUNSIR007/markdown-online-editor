//
//  MarkdownEditorView.swift
//  Swift_MarkdownEditor
//
//  Created by Ryuichi on 2025/12/26.
//

import SwiftUI

/// Markdown 编辑器视图
/// 实现实时 Markdown 渲染效果
struct MarkdownEditorView: View {
    @Binding var text: String
    @FocusState private var isFocused: Bool
    
    var body: some View {
        ZStack(alignment: .topLeading) {
            // 主编辑区域
            TextEditor(text: $text)
                .focused($isFocused)
                .font(.system(size: 16, design: .monospaced))
                .foregroundColor(.textMain)
                .scrollContentBackground(.hidden)
                .background(Color.clear)
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
            
            // 占位符
            if text.isEmpty {
                Text("开始编写 Markdown...")
                    .font(.system(size: 16))
                    .foregroundColor(.textMuted)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 20)
                    .allowsHitTesting(false)
            }
        }
        .background(Color.bgSurface)
        .clipShape(RoundedRectangle(cornerRadius: ThemeStyle.radiusLg))
        .overlay(
            RoundedRectangle(cornerRadius: ThemeStyle.radiusLg)
                .stroke(Color.white.opacity(0.05), lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.2), radius: 20, y: 8)
        .glassEffect()
        .onTapGesture {
            isFocused = true
        }
    }
}

/// 元数据编辑器（用于 Blog 类型）
struct MetadataEditorView: View {
    @ObservedObject var viewModel: EditorViewModel
    
    var body: some View {
        if shouldShowMetadata {
            VStack(spacing: 12) {
                // 标题输入
                if viewModel.currentType == .blog {
                    MetadataTextField(
                        text: $viewModel.metadata.title,
                        placeholder: "标题"
                    )
                    
                    MetadataTextField(
                        text: $viewModel.metadata.categories,
                        placeholder: "分类（逗号分隔）"
                    )
                }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 12)
            .background(Color.bgBody.opacity(0.95))
        }
    }
    
    private var shouldShowMetadata: Bool {
        viewModel.currentType == .blog
    }
}

/// 元数据文本输入框
struct MetadataTextField: View {
    @Binding var text: String
    let placeholder: String
    
    var body: some View {
        TextField(placeholder, text: $text)
            .font(.system(size: 15))
            .foregroundColor(.textMain)
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .background(Color.bgSurface)
            .clipShape(RoundedRectangle(cornerRadius: ThemeStyle.radiusMd))
            .overlay(
                RoundedRectangle(cornerRadius: ThemeStyle.radiusMd)
                    .stroke(Color.clear, lineWidth: 1)
            )
    }
}

#Preview {
    MarkdownEditorView(text: .constant("# Hello\n\nThis is **Markdown**"))
        .preferredColorScheme(.dark)
        .background(Color.bgBody)
        .padding()
}
