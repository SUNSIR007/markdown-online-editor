//
//  UploadHUDView.swift
//  Swift_MarkdownEditor
//
//  Created by Ryuichi on 2025/12/26.
//

import SwiftUI

/// 上传进度 HUD - 极简优雅风格
struct UploadHUDView: View {
    let status: UploadStatus
    @State private var appear = false
    
    var body: some View {
        VStack(spacing: 16) {
            statusIcon
                .frame(width: 48, height: 48)
        }
        .frame(width: 88, height: 88)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(.ultraThinMaterial)
                .shadow(color: .black.opacity(0.2), radius: 20, x: 0, y: 10)
        )
        .scaleEffect(appear ? 1 : 0.8)
        .opacity(appear ? 1 : 0)
        .onAppear {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                appear = true
            }
        }
    }
    
    // MARK: - 状态图标
    
    @ViewBuilder
    private var statusIcon: some View {
        switch status {
        case .idle:
            EmptyView()
            
        case .progress:
            ModernSpinnerView()
            
        case .success:
            ModernCheckmarkView()
            
        case .error:
            ModernCrossmarkView()
        }
    }
}

// MARK: - 现代风格 Spinner

struct ModernSpinnerView: View {
    @State private var rotation: Double = 0
    
    var body: some View {
        Circle()
            .stroke(Color.white.opacity(0.2), lineWidth: 3)
            .overlay(
                Circle()
                    .trim(from: 0, to: 0.25)
                    .stroke(
                        LinearGradient(
                            colors: [.white, .white.opacity(0.3)],
                            startPoint: .leading,
                            endPoint: .trailing
                        ),
                        style: StrokeStyle(lineWidth: 3, lineCap: .round)
                    )
                    .rotationEffect(.degrees(rotation))
            )
            .onAppear {
                withAnimation(.linear(duration: 0.8).repeatForever(autoreverses: false)) {
                    rotation = 360
                }
            }
    }
}

// MARK: - 现代风格勾选

struct ModernCheckmarkView: View {
    @State private var scale: CGFloat = 0
    @State private var pathProgress: CGFloat = 0
    
    var body: some View {
        ZStack {
            // 背景圆圈
            Circle()
                .fill(Color.successGreen.opacity(0.15))
                .scaleEffect(scale)
            
            // 勾选
            Path { path in
                path.move(to: CGPoint(x: 14, y: 24))
                path.addLine(to: CGPoint(x: 21, y: 31))
                path.addLine(to: CGPoint(x: 34, y: 18))
            }
            .trim(from: 0, to: pathProgress)
            .stroke(Color.successGreen, style: StrokeStyle(lineWidth: 3, lineCap: .round, lineJoin: .round))
        }
        .onAppear {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                scale = 1
            }
            withAnimation(.easeOut(duration: 0.25).delay(0.1)) {
                pathProgress = 1
            }
            // 触觉反馈
            HapticManager.notification(.success)
        }
    }
}

// MARK: - 现代风格叉号

struct ModernCrossmarkView: View {
    @State private var scale: CGFloat = 0
    @State private var pathProgress: CGFloat = 0
    
    var body: some View {
        ZStack {
            // 背景圆圈
            Circle()
                .fill(Color.errorRed.opacity(0.15))
                .scaleEffect(scale)
            
            // 叉号
            Path { path in
                path.move(to: CGPoint(x: 16, y: 16))
                path.addLine(to: CGPoint(x: 32, y: 32))
                path.move(to: CGPoint(x: 32, y: 16))
                path.addLine(to: CGPoint(x: 16, y: 32))
            }
            .trim(from: 0, to: pathProgress)
            .stroke(Color.errorRed, style: StrokeStyle(lineWidth: 3, lineCap: .round))
        }
        .onAppear {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                scale = 1
            }
            withAnimation(.easeOut(duration: 0.25).delay(0.1)) {
                pathProgress = 1
            }
            // 触觉反馈
            HapticManager.notification(.error)
        }
    }
}

// MARK: - 成功/失败全屏反馈

struct FeedbackOverlayView: View {
    let isSuccess: Bool
    @Binding var isVisible: Bool
    @State private var appear = false
    
    var body: some View {
        ZStack {
            // 半透明背景
            Color.black.opacity(0.4)
                .ignoresSafeArea()
            
            // 反馈图标
            VStack(spacing: 16) {
                if isSuccess {
                    ModernCheckmarkView()
                        .frame(width: 56, height: 56)
                } else {
                    ModernCrossmarkView()
                        .frame(width: 56, height: 56)
                }
            }
            .frame(width: 100, height: 100)
            .background(
                RoundedRectangle(cornerRadius: 24)
                    .fill(.ultraThinMaterial)
                    .shadow(color: .black.opacity(0.3), radius: 30, x: 0, y: 15)
            )
            .scaleEffect(appear ? 1 : 0.7)
            .opacity(appear ? 1 : 0)
        }
        .onAppear {
            withAnimation(.spring(response: 0.35, dampingFraction: 0.7)) {
                appear = true
            }
        }
    }
}

#Preview("Progress") {
    ZStack {
        Color.bgBody
        UploadHUDView(status: .progress)
    }
    .preferredColorScheme(.dark)
}

#Preview("Success") {
    ZStack {
        Color.bgBody
        UploadHUDView(status: .success)
    }
    .preferredColorScheme(.dark)
}

#Preview("Error") {
    ZStack {
        Color.bgBody
        UploadHUDView(status: .error)
    }
    .preferredColorScheme(.dark)
}
