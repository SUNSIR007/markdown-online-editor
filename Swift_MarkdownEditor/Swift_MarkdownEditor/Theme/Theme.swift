//
//  Theme.swift
//  Swift_MarkdownEditor
//
//  Created by Ryuichi on 2025/12/26.
//

import SwiftUI

/// 主题配置，复刻 PWA 深色主题色彩系统
/// 对应 PWA 中 index.html 和 components.css 的 CSS 变量
extension Color {
    
    // MARK: - 背景色
    
    /// 主背景色 --bg-body: #0f172a
    static let bgBody = Color(hex: "#0f172a")
    
    /// 表面背景色 --bg-surface: #1e293b
    static let bgSurface = Color(hex: "#1e293b")
    
    /// 悬停表面背景色 --bg-surface-hover: #334155
    static let bgSurfaceHover = Color(hex: "#334155")
    
    // MARK: - 文字颜色
    
    /// 主文字颜色 --text-main: #f1f5f9
    static let textMain = Color(hex: "#f1f5f9")
    
    /// 次要文字颜色 --text-secondary: #94a3b8
    static let textSecondary = Color(hex: "#94a3b8")
    
    /// 弱化文字颜色 --text-muted: #64748b
    static let textMuted = Color(hex: "#64748b")
    
    // MARK: - 主题色
    
    /// 主题色 --primary-color: #3b82f6
    static let primaryBlue = Color(hex: "#3b82f6")
    
    /// 渐变起始色 --primary-gradient-start: #3b82f6
    static let primaryGradientStart = Color(hex: "#3b82f6")
    
    /// 渐变结束色 --primary-gradient-end: #2563eb
    static let primaryGradientEnd = Color(hex: "#2563eb")
    
    // MARK: - 边框颜色
    
    /// 边框颜色 --border-color: #334155
    static let borderColor = Color(hex: "#334155")
    
    /// 浅边框颜色 --border-color-light: #475569
    static let borderColorLight = Color(hex: "#475569")
    
    // MARK: - 状态颜色
    
    /// 成功色
    static let successGreen = Color(hex: "#10b981")
    
    /// 警告色
    static let warningOrange = Color(hex: "#f59e0b")
    
    /// 错误色
    static let errorRed = Color(hex: "#ef4444")
    
    // MARK: - 初始化方法
    
    /// 从十六进制字符串创建颜色
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

// MARK: - 主题样式常量

struct ThemeStyle {
    
    // MARK: - 圆角
    
    /// 小圆角 --radius-sm: 6px
    static let radiusSm: CGFloat = 6
    
    /// 中圆角 --radius-md: 12px
    static let radiusMd: CGFloat = 12
    
    /// 大圆角 --radius-lg: 16px
    static let radiusLg: CGFloat = 16
    
    /// 全圆角 --radius-full: 9999px
    static let radiusFull: CGFloat = 9999
    
    // MARK: - 间距
    
    /// 小间距
    static let spacingSm: CGFloat = 8
    
    /// 中间距
    static let spacingMd: CGFloat = 16
    
    /// 大间距
    static let spacingLg: CGFloat = 24
    
    // MARK: - 动画
    
    /// 标准动画时长
    static let animationDuration: Double = 0.3
    
    /// 弹性动画
    static let springAnimation = Animation.spring(response: 0.3, dampingFraction: 0.7)
}

// MARK: - 渐变

extension LinearGradient {
    /// 主题渐变
    static let primaryGradient = LinearGradient(
        gradient: Gradient(colors: [Color.primaryGradientStart, Color.primaryGradientEnd]),
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
}
