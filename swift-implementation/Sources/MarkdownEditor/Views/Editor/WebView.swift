import SwiftUI
import WebKit

#if os(macOS)
typealias ViewRepresentable = NSViewRepresentable
#else
typealias ViewRepresentable = UIViewRepresentable
#endif

struct WebView: ViewRepresentable {
    let url: URL
    @Binding var content: String
    var onSave: (String) -> Void
    var onUploadImage: (String, Data) -> Void
    var onReady: () -> Void
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    #if os(macOS)
    func makeNSView(context: Context) -> WKWebView {
        createWebView(context: context)
    }
    
    func updateNSView(_ nsView: WKWebView, context: Context) {
        // Handle updates if needed, e.g. pushing content to JS
    }
    #else
    func makeUIView(context: Context) -> WKWebView {
        createWebView(context: context)
    }
    
    func updateUIView(_ uiView: WKWebView, context: Context) {
    }
    #endif
    
    private func createWebView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        let userContentController = WKUserContentController()
        
        // Add script message handlers
        userContentController.add(context.coordinator, name: "save")
        userContentController.add(context.coordinator, name: "uploadImage")
        userContentController.add(context.coordinator, name: "ready")
        
        config.userContentController = userContentController
        
        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        
        // Load local file
        if url.isFileURL {
            webView.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
        } else {
            webView.load(URLRequest(url: url))
        }
        
        context.coordinator.webView = webView
        return webView
    }
    
    class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
        var parent: WebView
        weak var webView: WKWebView?
        
        init(_ parent: WebView) {
            self.parent = parent
        }
        
        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            switch message.name {
            case "save":
                if let content = message.body as? String {
                    parent.onSave(content)
                }
            case "ready":
                parent.onReady()
            case "uploadImage":
                if let dict = message.body as? [String: Any],
                   let name = dict["name"] as? String,
                   let base64 = dict["data"] as? String,
                   let data = Data(base64Encoded: base64) {
                    parent.onUploadImage(name, data)
                }
            default:
                break
            }
        }
        
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            // Initial content load
            // We wait for 'ready' message from Vditor to ensure it's initialized
        }
        
        func updateContent(_ content: String) {
            let js = "updateContent(`\(content.replacingOccurrences(of: "`", with: "\\`"))`);"
            webView?.evaluateJavaScript(js)
        }
        
        func insertImage(url: String, alt: String) {
            let js = "insertImage('\(url)', '\(alt)');"
            webView?.evaluateJavaScript(js)
        }
    }
}
