import SwiftUI

struct EditorView: View {
    @State private var viewModel: EditorViewModel
    let file: GitHubFile
    
    init(file: GitHubFile, githubService: GitHubService) {
        self.file = file
        _viewModel = State(initialValue: EditorViewModel(githubService: githubService))
    }
    
    var body: some View {
        ZStack {
            if let url = Bundle.module.url(forResource: "index", withExtension: "html", subdirectory: "vditor") {
                WebView(
                    url: url,
                    content: $viewModel.content,
                    onSave: { content in
                        Task {
                            await viewModel.save(content: content)
                        }
                    },
                    onUploadImage: { name, data in
                        Task {
                            if let _ = await viewModel.uploadImage(name: name, data: data) {
                                // Insert back to editor?
                                // WebView needs a way to insert text.
                                // For now, we rely on the JS bridge to handle insertion if we return success?
                                // Actually, the WebView coordinator should handle insertion.
                                // We need to pass the result back to WebView.
                                // This requires a bi-directional flow or a callback in WebView.
                                // Let's assume WebView handles insertion via a method we call on it?
                                // Or we update content? No, updating content reloads editor.
                                // We need to send a message to JS.
                            }
                        }
                    },
                    onReady: {
                        // Load content when editor is ready
                        // We might need to inject content here if it wasn't loaded yet
                    }
                )
            } else {
                Text("Error: Editor resources not found")
            }
            
            if viewModel.isLoading {
                ProgressView()
                    .background(.ultraThinMaterial)
                    .cornerRadius(8)
            }
        }
        .task {
            await viewModel.loadFile(file)
        }
        .alert("Error", isPresented: Binding(get: { viewModel.errorMessage != nil }, set: { _ in viewModel.errorMessage = nil })) {
            Text(viewModel.errorMessage ?? "")
        }
    }
}
