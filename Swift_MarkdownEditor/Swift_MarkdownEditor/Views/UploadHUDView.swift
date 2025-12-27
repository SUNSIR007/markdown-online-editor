//
//  UploadHUDView.swift
//  Swift_MarkdownEditor
//
//  Created by Ryuichi on 2025/12/26.
//

import SwiftUI

// MARK: - 统一反馈视图样式

/// 反馈类型
enum FeedbackType {
    case uploading
    case uploadSuccess
    case uploadError
    case publishing
    case publishSuccess
    case publishError
    
    var icon: String {
        switch self {
        case .uploading, .publishing:
            return "arrow.up.circle"
        case .uploadSuccess, .publishSuccess:
            return "checkmark.circle"
        case .uploadError, .publishError:
            return "xmark.circle"
        }
    }
    
    var title: String {
        switch self {
        case .uploading:
            return "正在上传"
        case .uploadSuccess:
            return "上传成功"
        case .uploadError:
            return "上传失败"
        case .publishing:
            return "正在发布"
        case .publishSuccess:
            return "发布成功"
        case .publishError:
            return "发布失败"
        }
    }
    
    var subtitle: String {
        switch self {
        case .uploading:
            return "图片处理中..."
        case .uploadSuccess:
            return "已添加到编辑器"
        case .uploadError:
            return "请检查网络连接"
        case .publishing:
            return "提交到 GitHub..."
        case .publishSuccess:
            return "内容已成功发布"
        case .publishError:
            return "请稍后重试"
        }
    }
    
    var accentColor: Color {
        switch self {
        case .uploading, .publishing:
            return .primaryBlue
        case .uploadSuccess, .publishSuccess:
            return .successGreen
        case .uploadError, .publishError:
            return .errorRed
        }
    }
    
    var isLoading: Bool {
        switch self {
        case .uploading, .publishing:
            return true
        default:
            return false
        }
    }
    
    var isSuccess: Bool {
        switch self {
        case .uploadSuccess, .publishSuccess:
            return true
        default:
            return false
        }
    }
    
    var isError: Bool {
        switch self {
        case .uploadError, .publishError:
            return true
        default:
            return false
        }
    }
}

// MARK: - 统一反馈 HUD

/// 统一风格的反馈提示视图 - 玻璃拟态设计
struct UnifiedFeedbackView: View {
    let type: FeedbackType
    @State private var appear = false
    @State private var iconScale: CGFloat = 0.5
    @State private var glowOpacity: Double = 0.3
    
    var body: some View {
        VStack(spacing: 20) {
            // 图标区域 - 多层光晕效果
            ZStack {
                // 最外层脉冲光晕
                Circle()
                    .fill(type.accentColor.opacity(0.08))
                    .frame(width: 100, height: 100)
                    .blur(radius: 20)
                    .scaleEffect(glowOpacity > 0.2 ? 1.2 : 1.0)
                
                // 中层光晕
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [
                                type.accentColor.opacity(0.25),
                                type.accentColor.opacity(0.05),
                                .clear
                            ],
                            center: .center,
                            startRadius: 0,
                            endRadius: 45
                        )
                    )
                    .frame(width: 90, height: 90)
                
                // 图标背景容器
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [
                                Color.white.opacity(0.15),
                                Color.white.opacity(0.05)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 64, height: 64)
                    .overlay(
                        Circle()
                            .stroke(
                                LinearGradient(
                                    colors: [
                                        Color.white.opacity(0.3),
                                        Color.white.opacity(0.05)
                                    ],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ),
                                lineWidth: 1
                            )
                    )
                    .shadow(color: type.accentColor.opacity(0.3), radius: 15, x: 0, y: 5)
                
                // 状态图标
                Group {
                    if type.isLoading {
                        ModernSpinner(color: type.accentColor)
                            .frame(width: 32, height: 32)
                    } else if type.isSuccess {
                        AnimatedSuccessIcon()
                            .frame(width: 32, height: 32)
                    } else {
                        AnimatedErrorIcon()
                            .frame(width: 32, height: 32)
                    }
                }
                .scaleEffect(iconScale)
            }
            .frame(height: 100)
            
            // 文字区域
            VStack(spacing: 6) {
                Text(type.title)
                    .font(.system(size: 17, weight: .semibold, design: .rounded))
                    .foregroundColor(.white)
                
                Text(type.subtitle)
                    .font(.system(size: 13, weight: .regular))
                    .foregroundColor(.white.opacity(0.55))
                    .multilineTextAlignment(.center)
            }
            .padding(.horizontal, 8)
        }
        .frame(width: 180)
        .padding(.vertical, 28)
        .padding(.horizontal, 16)
        .background(
            // 玻璃拟态背景
            ZStack {
                // 模糊背景层
                RoundedRectangle(cornerRadius: 24)
                    .fill(.ultraThinMaterial)
                
                // 深色叠加层
                RoundedRectangle(cornerRadius: 24)
                    .fill(
                        LinearGradient(
                            colors: [
                                Color(red: 0.12, green: 0.14, blue: 0.18).opacity(0.85),
                                Color(red: 0.08, green: 0.10, blue: 0.14).opacity(0.95)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                
                // 顶部高光
                RoundedRectangle(cornerRadius: 24)
                    .fill(
                        LinearGradient(
                            colors: [
                                Color.white.opacity(0.12),
                                Color.white.opacity(0.02),
                                .clear
                            ],
                            startPoint: .top,
                            endPoint: .center
                        )
                    )
                
                // 边框
                RoundedRectangle(cornerRadius: 24)
                    .stroke(
                        LinearGradient(
                            colors: [
                                Color.white.opacity(0.2),
                                Color.white.opacity(0.05),
                                Color.white.opacity(0.1)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        lineWidth: 0.5
                    )
            }
            .shadow(color: .black.opacity(0.35), radius: 40, x: 0, y: 20)
            .shadow(color: type.accentColor.opacity(0.15), radius: 30, x: 0, y: 10)
        )
        .scaleEffect(appear ? 1 : 0.8)
        .opacity(appear ? 1 : 0)
        .onAppear {
            withAnimation(.spring(response: 0.45, dampingFraction: 0.7)) {
                appear = true
                iconScale = 1.0
            }
            
            if type.isLoading {
                withAnimation(.easeInOut(duration: 1.5).repeatForever(autoreverses: true)) {
                    glowOpacity = 0.5
                }
            }
        }
    }
}

// MARK: - 现代 Spinner

struct ModernSpinner: View {
    let color: Color
    @State private var rotation: Double = 0
    @State private var trimEnd: CGFloat = 0.3
    
    var body: some View {
        ZStack {
            // 背景轨道
            Circle()
                .stroke(color.opacity(0.15), lineWidth: 3.5)
            
            // 旋转进度条
            Circle()
                .trim(from: 0, to: trimEnd)
                .stroke(
                    AngularGradient(
                        colors: [
                            color,
                            color.opacity(0.8),
                            color.opacity(0.3),
                            .clear
                        ],
                        center: .center,
                        startAngle: .degrees(0),
                        endAngle: .degrees(360)
                    ),
                    style: StrokeStyle(lineWidth: 3.5, lineCap: .round)
                )
                .rotationEffect(.degrees(rotation))
            
            // 头部小圆点
            Circle()
                .fill(color)
                .frame(width: 5, height: 5)
                .offset(y: -14)
                .rotationEffect(.degrees(rotation + trimEnd * 360))
        }
        .onAppear {
            withAnimation(.linear(duration: 1.2).repeatForever(autoreverses: false)) {
                rotation = 360
            }
            withAnimation(.easeInOut(duration: 0.8).repeatForever(autoreverses: true)) {
                trimEnd = 0.6
            }
        }
    }
}

// MARK: - 成功动画图标

struct AnimatedSuccessIcon: View {
    @State private var circleScale: CGFloat = 0
    @State private var checkProgress: CGFloat = 0
    @State private var shimmer: CGFloat = -1
    
    var body: some View {
        ZStack {
            // 背景圆环
            Circle()
                .stroke(Color.successGreen.opacity(0.3), lineWidth: 2.5)
                .scaleEffect(circleScale)
            
            // 闪光效果
            Circle()
                .fill(
                    LinearGradient(
                        colors: [
                            .clear,
                            Color.white.opacity(0.4),
                            .clear
                        ],
                        startPoint: UnitPoint(x: shimmer, y: shimmer),
                        endPoint: UnitPoint(x: shimmer + 0.5, y: shimmer + 0.5)
                    )
                )
                .scaleEffect(circleScale)
            
            // 勾选路径
            Path { path in
                let size: CGFloat = 32
                path.move(to: CGPoint(x: size * 0.25, y: size * 0.52))
                path.addLine(to: CGPoint(x: size * 0.42, y: size * 0.68))
                path.addLine(to: CGPoint(x: size * 0.75, y: size * 0.32))
            }
            .trim(from: 0, to: checkProgress)
            .stroke(
                Color.successGreen,
                style: StrokeStyle(lineWidth: 3, lineCap: .round, lineJoin: .round)
            )
        }
        .onAppear {
            withAnimation(.spring(response: 0.4, dampingFraction: 0.65)) {
                circleScale = 1
            }
            withAnimation(.easeOut(duration: 0.35).delay(0.2)) {
                checkProgress = 1
            }
            withAnimation(.easeInOut(duration: 0.6).delay(0.4)) {
                shimmer = 1.5
            }
            HapticManager.notification(.success)
        }
    }
}

// MARK: - 错误动画图标

struct AnimatedErrorIcon: View {
    @State private var circleScale: CGFloat = 0
    @State private var crossProgress: CGFloat = 0
    @State private var shake: CGFloat = 0
    
    var body: some View {
        ZStack {
            // 背景圆环
            Circle()
                .stroke(Color.errorRed.opacity(0.3), lineWidth: 2.5)
                .scaleEffect(circleScale)
            
            // 叉号路径
            Group {
                Path { path in
                    let size: CGFloat = 32
                    path.move(to: CGPoint(x: size * 0.3, y: size * 0.3))
                    path.addLine(to: CGPoint(x: size * 0.7, y: size * 0.7))
                }
                .trim(from: 0, to: crossProgress)
                .stroke(Color.errorRed, style: StrokeStyle(lineWidth: 3, lineCap: .round))
                
                Path { path in
                    let size: CGFloat = 32
                    path.move(to: CGPoint(x: size * 0.7, y: size * 0.3))
                    path.addLine(to: CGPoint(x: size * 0.3, y: size * 0.7))
                }
                .trim(from: 0, to: crossProgress)
                .stroke(Color.errorRed, style: StrokeStyle(lineWidth: 3, lineCap: .round))
            }
        }
        .offset(x: shake)
        .onAppear {
            withAnimation(.spring(response: 0.4, dampingFraction: 0.65)) {
                circleScale = 1
            }
            withAnimation(.easeOut(duration: 0.3).delay(0.15)) {
                crossProgress = 1
            }
            // 轻微抖动效果
            withAnimation(.easeInOut(duration: 0.08).repeatCount(3, autoreverses: true).delay(0.35)) {
                shake = 3
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
                shake = 0
            }
            HapticManager.notification(.error)
        }
    }
}

// MARK: - 上传进度 HUD（兼容现有接口）

struct UploadHUDView: View {
    let status: UploadStatus
    
    var body: some View {
        UnifiedFeedbackView(type: feedbackType)
    }
    
    private var feedbackType: FeedbackType {
        switch status {
        case .idle:
            return .uploading
        case .progress:
            return .uploading
        case .success:
            return .uploadSuccess
        case .error:
            return .uploadError
        }
    }
}

// MARK: - 全屏反馈覆盖层

struct FeedbackOverlayView: View {
    let isSuccess: Bool
    @Binding var isVisible: Bool
    @State private var appear = false
    @State private var backgroundOpacity: Double = 0
    
    var body: some View {
        ZStack {
            // 渐变背景遮罩
            Color.black.opacity(backgroundOpacity)
                .ignoresSafeArea()
                .onTapGesture {
                    // 点击背景可关闭
                }
            
            // 反馈卡片
            UnifiedFeedbackView(type: isSuccess ? .publishSuccess : .publishError)
                .scaleEffect(appear ? 1 : 0.9)
                .opacity(appear ? 1 : 0)
        }
        .onAppear {
            withAnimation(.easeOut(duration: 0.25)) {
                backgroundOpacity = 0.55
            }
            withAnimation(.spring(response: 0.4, dampingFraction: 0.75)) {
                appear = true
            }
        }
    }
}

// MARK: - 轻量 Toast 提示（可选使用）

struct ToastView: View {
    let message: String
    let type: ToastType
    @State private var appear = false
    
    enum ToastType {
        case info, success, error
        
        var color: Color {
            switch self {
            case .info: return .primaryBlue
            case .success: return .successGreen
            case .error: return .errorRed
            }
        }
        
        var icon: String {
            switch self {
            case .info: return "info.circle.fill"
            case .success: return "checkmark.circle.fill"
            case .error: return "xmark.circle.fill"
            }
        }
    }
    
    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: type.icon)
                .font(.system(size: 18, weight: .medium))
                .foregroundColor(type.color)
            
            Text(message)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(.white)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 14)
        .background(
            Capsule()
                .fill(.ultraThinMaterial)
                .overlay(
                    Capsule()
                        .fill(Color(red: 0.12, green: 0.14, blue: 0.18).opacity(0.8))
                )
                .overlay(
                    Capsule()
                        .stroke(Color.white.opacity(0.1), lineWidth: 0.5)
                )
                .shadow(color: .black.opacity(0.25), radius: 20, x: 0, y: 10)
        )
        .offset(y: appear ? 0 : -20)
        .opacity(appear ? 1 : 0)
        .onAppear {
            withAnimation(.spring(response: 0.35, dampingFraction: 0.8)) {
                appear = true
            }
        }
    }
}

// MARK: - Previews

#Preview("Uploading") {
    ZStack {
        Color.bgBody.ignoresSafeArea()
        UnifiedFeedbackView(type: .uploading)
    }
    .preferredColorScheme(.dark)
}

#Preview("Upload Success") {
    ZStack {
        Color.bgBody.ignoresSafeArea()
        UnifiedFeedbackView(type: .uploadSuccess)
    }
    .preferredColorScheme(.dark)
}

#Preview("Upload Error") {
    ZStack {
        Color.bgBody.ignoresSafeArea()
        UnifiedFeedbackView(type: .uploadError)
    }
    .preferredColorScheme(.dark)
}

#Preview("Publishing") {
    ZStack {
        Color.bgBody.ignoresSafeArea()
        UnifiedFeedbackView(type: .publishing)
    }
    .preferredColorScheme(.dark)
}

#Preview("Publish Success") {
    ZStack {
        Color.bgBody.ignoresSafeArea()
        UnifiedFeedbackView(type: .publishSuccess)
    }
    .preferredColorScheme(.dark)
}

#Preview("Publish Error") {
    ZStack {
        Color.bgBody.ignoresSafeArea()
        UnifiedFeedbackView(type: .publishError)
    }
    .preferredColorScheme(.dark)
}

#Preview("Feedback Overlay Success") {
    FeedbackOverlayView(isSuccess: true, isVisible: .constant(true))
        .preferredColorScheme(.dark)
}

#Preview("Feedback Overlay Error") {
    FeedbackOverlayView(isSuccess: false, isVisible: .constant(true))
        .preferredColorScheme(.dark)
}

#Preview("Toast") {
    ZStack {
        Color.bgBody.ignoresSafeArea()
        VStack(spacing: 20) {
            ToastView(message: "操作成功", type: .success)
            ToastView(message: "正在处理", type: .info)
            ToastView(message: "操作失败", type: .error)
        }
    }
    .preferredColorScheme(.dark)
}
