//
//  VditorWebView.swift
//  Swift_MarkdownEditor
//
//  Created by Ryuichi on 2025/12/26.
//

import SwiftUI
import WebKit

/// Vditor 编辑器 WebView 封装
struct VditorWebView: UIViewRepresentable {
    @Binding var content: String
    
    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        
        // 添加消息处理器
        configuration.userContentController.add(context.coordinator, name: "editorReady")
        configuration.userContentController.add(context.coordinator, name: "contentChanged")
        
        // 配置 WebView
        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.isOpaque = false
        webView.backgroundColor = UIColor(Color.bgSurface)
        webView.scrollView.backgroundColor = UIColor(Color.bgSurface)
        webView.navigationDelegate = context.coordinator
        
        // 加载 HTML
        if let htmlPath = Bundle.main.path(forResource: "editor", ofType: "html") {
            let htmlUrl = URL(fileURLWithPath: htmlPath)
            webView.loadFileURL(htmlUrl, allowingReadAccessTo: htmlUrl.deletingLastPathComponent())
        }
        
        context.coordinator.webView = webView
        VditorManager.shared.webView = webView
        VditorManager.shared.coordinator = context.coordinator
        
        return webView
    }
    
    func updateUIView(_ webView: WKWebView, context: Context) {
        // 内容同步由 JavaScript 回调处理
    }
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
        var parent: VditorWebView
        var webView: WKWebView?
        var isReady = false
        
        init(_ parent: VditorWebView) {
            self.parent = parent
        }
        
        // MARK: - WKScriptMessageHandler
        
        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            switch message.name {
            case "editorReady":
                isReady = true
                // 设置初始内容
                if !parent.content.isEmpty {
                    setContent(parent.content)
                }
                
            case "contentChanged":
                if let content = message.body as? String {
                    DispatchQueue.main.async {
                        self.parent.content = content
                    }
                }
                
            default:
                break
            }
        }
        
        // MARK: - 设置内容
        
        func setContent(_ content: String) {
            guard isReady else { return }
            let escaped = content
                .replacingOccurrences(of: "\\", with: "\\\\")
                .replacingOccurrences(of: "'", with: "\\'")
                .replacingOccurrences(of: "\n", with: "\\n")
                .replacingOccurrences(of: "\r", with: "")
            webView?.evaluateJavaScript("setContent('\(escaped)')") { _, _ in }
        }
        
        // MARK: - 插入图片
        
        func insertImage(url: String, alt: String = "image") {
            guard isReady else { return }
            let escaped = url.replacingOccurrences(of: "'", with: "\\'")
            webView?.evaluateJavaScript("insertImage('\(escaped)', '\(alt)')") { _, _ in }
        }
    }
}

/// 全局 Vditor 管理器
class VditorManager {
    static let shared = VditorManager()
    
    weak var webView: WKWebView?
    weak var coordinator: VditorWebView.Coordinator?
    
    private init() {}
    
    func insertImage(url: String) {
        coordinator?.insertImage(url: url)
    }
}
