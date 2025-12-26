//
//  UploadHUDView.swift
//  Swift_MarkdownEditor
//
//  Created by Ryuichi on 2025/12/26.
//

import SwiftUI

/// 上传进度 HUD - 只显示圆形，使用液态玻璃效果
struct UploadHUDView: View {
    let status: UploadStatus
    
    var body: some View {
        VStack(spacing: 12) {
            statusIcon
            statusText
        }
        .frame(width: 100, height: 100)
        .glassEffect()
    }
    
    // MARK: - 状态图标
    
    @ViewBuilder
    private var statusIcon: some View {
        switch status {
        case .idle:
            EmptyView()
            
        case .progress:
            SpinnerView()
                .frame(width: 44, height: 44)
            
        case .success:
            CheckmarkView()
                .frame(width: 40, height: 40)
            
        case .error:
            CrossmarkView()
                .frame(width: 40, height: 40)
        }
    }
    
    // MARK: - 状态文字
    
    private var statusText: some View {
        Text(statusLabel)
            .font(.system(size: 13, weight: .medium))
            .foregroundColor(.white)
    }
    
    private var statusLabel: String {
        switch status {
        case .idle: return ""
        case .progress: return "上传中"
        case .success: return "完成"
        case .error: return "失败"
        }
    }
}

// MARK: - Spinner 动画

struct SpinnerView: View {
    @State private var isAnimating = false
    
    var body: some View {
        Circle()
            .stroke(Color.primaryBlue.opacity(0.2), lineWidth: 3)
            .overlay(
                Circle()
                    .trim(from: 0, to: 0.3)
                    .stroke(Color.primaryBlue, style: StrokeStyle(lineWidth: 3, lineCap: .round))
                    .rotationEffect(.degrees(isAnimating ? 360 : 0))
            )
            .onAppear {
                withAnimation(.linear(duration: 0.8).repeatForever(autoreverses: false)) {
                    isAnimating = true
                }
            }
    }
}

// MARK: - 成功勾选动画

struct CheckmarkView: View {
    @State private var isAnimating = false
    
    var body: some View {
        ZStack {
            Path { path in
                path.move(to: CGPoint(x: 8, y: 20))
                path.addLine(to: CGPoint(x: 16, y: 28))
                path.addLine(to: CGPoint(x: 32, y: 12))
            }
            .trim(from: 0, to: isAnimating ? 1 : 0)
            .stroke(Color.successGreen, style: StrokeStyle(lineWidth: 3, lineCap: .round, lineJoin: .round))
        }
        .onAppear {
            withAnimation(.easeOut(duration: 0.4)) {
                isAnimating = true
            }
        }
    }
}

// MARK: - 失败叉号动画

struct CrossmarkView: View {
    @State private var isAnimating = false
    
    var body: some View {
        ZStack {
            Path { path in
                path.move(to: CGPoint(x: 10, y: 10))
                path.addLine(to: CGPoint(x: 30, y: 30))
            }
            .trim(from: 0, to: isAnimating ? 1 : 0)
            .stroke(Color.errorRed, style: StrokeStyle(lineWidth: 3, lineCap: .round))
            
            Path { path in
                path.move(to: CGPoint(x: 30, y: 10))
                path.addLine(to: CGPoint(x: 10, y: 30))
            }
            .trim(from: 0, to: isAnimating ? 1 : 0)
            .stroke(Color.errorRed, style: StrokeStyle(lineWidth: 3, lineCap: .round))
        }
        .onAppear {
            withAnimation(.easeOut(duration: 0.4)) {
                isAnimating = true
            }
        }
    }
}

// MARK: - 成功/失败全屏反馈

struct FeedbackOverlayView: View {
    let isSuccess: Bool
    @Binding var isVisible: Bool
    
    var body: some View {
        ZStack {
            Color.bgBody.opacity(0.95)
                .ignoresSafeArea()
            
            FeedbackIconView(isSuccess: isSuccess)
                .frame(width: 80, height: 80)
        }
        .opacity(isVisible ? 1 : 0)
        .animation(.easeInOut(duration: 0.3), value: isVisible)
    }
}

struct FeedbackIconView: View {
    let isSuccess: Bool
    @State private var circleProgress: CGFloat = 0
    @State private var pathProgress: CGFloat = 0
    
    var body: some View {
        ZStack {
            // 外圈
            Circle()
                .trim(from: 0, to: circleProgress)
                .stroke(
                    isSuccess ? Color.successGreen : Color.errorRed,
                    style: StrokeStyle(lineWidth: 2, lineCap: .round)
                )
            
            // 图标
            if isSuccess {
                Path { path in
                    path.move(to: CGPoint(x: 22, y: 42))
                    path.addLine(to: CGPoint(x: 35, y: 55))
                    path.addLine(to: CGPoint(x: 58, y: 30))
                }
                .trim(from: 0, to: pathProgress)
                .stroke(
                    Color.successGreen,
                    style: StrokeStyle(lineWidth: 2, lineCap: .round, lineJoin: .round)
                )
            } else {
                Path { path in
                    path.move(to: CGPoint(x: 25, y: 25))
                    path.addLine(to: CGPoint(x: 55, y: 55))
                }
                .trim(from: 0, to: pathProgress)
                .stroke(
                    Color.errorRed,
                    style: StrokeStyle(lineWidth: 2, lineCap: .round)
                )
                
                Path { path in
                    path.move(to: CGPoint(x: 55, y: 25))
                    path.addLine(to: CGPoint(x: 25, y: 55))
                }
                .trim(from: 0, to: pathProgress)
                .stroke(
                    Color.errorRed,
                    style: StrokeStyle(lineWidth: 2, lineCap: .round)
                )
            }
        }
        .onAppear {
            withAnimation(.easeOut(duration: 0.5)) {
                circleProgress = 1
            }
            withAnimation(.easeOut(duration: 0.3).delay(0.4)) {
                pathProgress = 1
            }
        }
    }
}

#Preview("Progress") {
    UploadHUDView(status: .progress)
        .preferredColorScheme(.dark)
        .background(Color.bgBody)
}

#Preview("Success") {
    UploadHUDView(status: .success)
        .preferredColorScheme(.dark)
        .background(Color.bgBody)
}
