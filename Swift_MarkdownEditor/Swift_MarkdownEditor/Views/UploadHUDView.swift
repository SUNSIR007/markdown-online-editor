//
//  UploadHUDView.swift
//  Swift_MarkdownEditor
//
//  Created by Ryuichi on 2025/12/26.
//

import SwiftUI

/// 上传进度 HUD - 精致设计风格
struct UploadHUDView: View {
    let status: UploadStatus
    @State private var appear = false
    
    var body: some View {
        VStack(spacing: 16) {
            // 图标区域
            ZStack {
                // 背景光晕
                Circle()
                    .fill(statusColor.opacity(0.15))
                    .frame(width: 72, height: 72)
                    .blur(radius: 10)
                
                // 图标容器
                Circle()
                    .fill(Color.white.opacity(0.1))
                    .frame(width: 56, height: 56)
                
                // 状态图标
                statusIcon
                    .frame(width: 28, height: 28)
            }
            .frame(height: 72)
            
            // 状态文字
            VStack(spacing: 4) {
                Text(statusTitle)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(.white)
                
                Text(statusSubtitle)
                    .font(.system(size: 11, weight: .regular))
                    .foregroundColor(.white.opacity(0.6))
                    .multilineTextAlignment(.center)
            }
            .frame(height: 36)
        }
        .frame(width: 160)
        .padding(.vertical, 24)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color(red: 0.12, green: 0.14, blue: 0.18).opacity(0.95))
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(Color.white.opacity(0.08), lineWidth: 1)
                )
                .shadow(color: .black.opacity(0.4), radius: 30, x: 0, y: 15)
        )
        .scaleEffect(appear ? 1 : 0.85)
        .opacity(appear ? 1 : 0)
        .onAppear {
            withAnimation(.spring(response: 0.4, dampingFraction: 0.75)) {
                appear = true
            }
        }
    }
    
    // MARK: - 状态颜色
    
    private var statusColor: Color {
        switch status {
        case .idle: return .clear
        case .progress: return .primaryBlue
        case .success: return .successGreen
        case .error: return .errorRed
        }
    }
    
    // MARK: - 状态标题
    
    private var statusTitle: String {
        switch status {
        case .idle: return ""
        case .progress: return "正在上传"
        case .success: return "上传成功"
        case .error: return "上传失败"
        }
    }
    
    // MARK: - 状态副标题
    
    private var statusSubtitle: String {
        switch status {
        case .idle: return ""
        case .progress: return "请稍候..."
        case .success: return "图片已添加到编辑器"
        case .error: return "请检查网络后重试"
        }
    }
    
    // MARK: - 状态图标
    
    @ViewBuilder
    private var statusIcon: some View {
        switch status {
        case .idle:
            EmptyView()
            
        case .progress:
            PulsingSpinnerView()
            
        case .success:
            AnimatedCheckmarkView()
            
        case .error:
            AnimatedCrossmarkView()
        }
    }
}

// MARK: - 脉冲 Spinner

struct PulsingSpinnerView: View {
    @State private var rotation: Double = 0
    @State private var pulse = false
    
    var body: some View {
        ZStack {
            // 脉冲光环
            Circle()
                .stroke(Color.primaryBlue.opacity(0.3), lineWidth: 2)
                .scaleEffect(pulse ? 1.3 : 1)
                .opacity(pulse ? 0 : 0.5)
            
            // 外圈背景
            Circle()
                .stroke(Color.white.opacity(0.15), lineWidth: 3)
            
            // 旋转进度
            Circle()
                .trim(from: 0, to: 0.3)
                .stroke(
                    LinearGradient(
                        colors: [.primaryBlue, .primaryBlue.opacity(0.2)],
                        startPoint: .leading,
                        endPoint: .trailing
                    ),
                    style: StrokeStyle(lineWidth: 3, lineCap: .round)
                )
                .rotationEffect(.degrees(rotation))
        }
        .onAppear {
            withAnimation(.linear(duration: 1).repeatForever(autoreverses: false)) {
                rotation = 360
            }
            withAnimation(.easeInOut(duration: 1.2).repeatForever(autoreverses: false)) {
                pulse = true
            }
        }
    }
}

// MARK: - 动画勾选

struct AnimatedCheckmarkView: View {
    @State private var circleScale: CGFloat = 0
    @State private var pathProgress: CGFloat = 0
    
    var body: some View {
        ZStack {
            // 成功背景圆
            Circle()
                .fill(Color.successGreen.opacity(0.2))
                .scaleEffect(circleScale)
            
            // 勾选路径
            Path { path in
                path.move(to: CGPoint(x: 9, y: 16))
                path.addLine(to: CGPoint(x: 14, y: 21))
                path.addLine(to: CGPoint(x: 23, y: 11))
            }
            .trim(from: 0, to: pathProgress)
            .stroke(Color.successGreen, style: StrokeStyle(lineWidth: 3, lineCap: .round, lineJoin: .round))
        }
        .onAppear {
            withAnimation(.spring(response: 0.35, dampingFraction: 0.6)) {
                circleScale = 1
            }
            withAnimation(.easeOut(duration: 0.3).delay(0.15)) {
                pathProgress = 1
            }
            HapticManager.notification(.success)
        }
    }
}

// MARK: - 动画叉号

struct AnimatedCrossmarkView: View {
    @State private var circleScale: CGFloat = 0
    @State private var pathProgress: CGFloat = 0
    
    var body: some View {
        ZStack {
            // 失败背景圆
            Circle()
                .fill(Color.errorRed.opacity(0.2))
                .scaleEffect(circleScale)
            
            // 叉号路径
            Group {
                Path { path in
                    path.move(to: CGPoint(x: 10, y: 10))
                    path.addLine(to: CGPoint(x: 22, y: 22))
                }
                .trim(from: 0, to: pathProgress)
                .stroke(Color.errorRed, style: StrokeStyle(lineWidth: 3, lineCap: .round))
                
                Path { path in
                    path.move(to: CGPoint(x: 22, y: 10))
                    path.addLine(to: CGPoint(x: 10, y: 22))
                }
                .trim(from: 0, to: pathProgress)
                .stroke(Color.errorRed, style: StrokeStyle(lineWidth: 3, lineCap: .round))
            }
        }
        .onAppear {
            withAnimation(.spring(response: 0.35, dampingFraction: 0.6)) {
                circleScale = 1
            }
            withAnimation(.easeOut(duration: 0.3).delay(0.15)) {
                pathProgress = 1
            }
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
            Color.black.opacity(0.5)
                .ignoresSafeArea()
            
            // 反馈卡片
            VStack(spacing: 20) {
                ZStack {
                    Circle()
                        .fill((isSuccess ? Color.successGreen : Color.errorRed).opacity(0.15))
                        .frame(width: 80, height: 80)
                        .blur(radius: 10)
                    
                    Circle()
                        .fill(Color.white.opacity(0.1))
                        .frame(width: 64, height: 64)
                    
                    if isSuccess {
                        AnimatedCheckmarkView()
                            .frame(width: 36, height: 36)
                    } else {
                        AnimatedCrossmarkView()
                            .frame(width: 36, height: 36)
                    }
                }
                
                Text(isSuccess ? "发布成功" : "发布失败")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(.white)
            }
            .padding(.horizontal, 40)
            .padding(.vertical, 32)
            .background(
                RoundedRectangle(cornerRadius: 28)
                    .fill(Color(red: 0.12, green: 0.14, blue: 0.18).opacity(0.95))
                    .overlay(
                        RoundedRectangle(cornerRadius: 28)
                            .stroke(Color.white.opacity(0.08), lineWidth: 1)
                    )
                    .shadow(color: .black.opacity(0.5), radius: 40, x: 0, y: 20)
            )
            .scaleEffect(appear ? 1 : 0.8)
            .opacity(appear ? 1 : 0)
        }
        .onAppear {
            withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) {
                appear = true
            }
        }
    }
}

#Preview("Progress") {
    ZStack {
        Color.bgBody.ignoresSafeArea()
        UploadHUDView(status: .progress)
    }
    .preferredColorScheme(.dark)
}

#Preview("Success") {
    ZStack {
        Color.bgBody.ignoresSafeArea()
        UploadHUDView(status: .success)
    }
    .preferredColorScheme(.dark)
}

#Preview("Error") {
    ZStack {
        Color.bgBody.ignoresSafeArea()
        UploadHUDView(status: .error)
    }
    .preferredColorScheme(.dark)
}

#Preview("Feedback Success") {
    FeedbackOverlayView(isSuccess: true, isVisible: .constant(true))
        .preferredColorScheme(.dark)
}
