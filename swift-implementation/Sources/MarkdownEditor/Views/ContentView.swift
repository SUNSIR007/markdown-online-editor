import SwiftUI

import SwiftUI

struct ContentView: View {
    @State private var githubService = GitHubService()
    @State private var fileListViewModel: FileListViewModel
    @State private var showSettings = false
    @State private var selectedFile: GitHubFile?
    
    init() {
        let service = GitHubService()
        // Load from Keychain if available
        if let token = KeychainService.shared.load() {
            // We need to store other config in UserDefaults or Keychain too.
            // For simplicity, let's assume we just need to re-enter config if not in memory,
            // or we store the whole config in UserDefaults except token.
            // Let's just use a simple approach: If token exists in Keychain, we assume we are partially configured.
            // But we need Owner/Repo.
            // Let's use UserDefaults for Owner/Repo.
            let owner = UserDefaults.standard.string(forKey: "github_owner") ?? ""
            let repo = UserDefaults.standard.string(forKey: "github_repo") ?? ""
            let branch = UserDefaults.standard.string(forKey: "github_branch") ?? "main"
            
            if !owner.isEmpty && !repo.isEmpty {
                service.config = RepoConfig(token: token, owner: owner, repo: repo, branch: branch)
            }
        }
        
        _githubService = State(initialValue: service)
        _fileListViewModel = State(initialValue: FileListViewModel(githubService: service))
    }
    
    var body: some View {
        NavigationSplitView {
            List(selection: $selectedFile) {
                if fileListViewModel.isLoading {
                    ProgressView()
                } else if let error = fileListViewModel.errorMessage {
                    Text("Error: \(error)")
                        .foregroundStyle(.red)
                    Button("Retry") {
                        Task {
                            await fileListViewModel.fetchFiles()
                        }
                    }
                } else {
                    ForEach(fileListViewModel.files) { file in
                        NavigationLink(value: file) {
                            HStack {
                                Image(systemName: "doc.text")
                                Text(file.name)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Files")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button(action: {
                        Task {
                            await fileListViewModel.fetchFiles()
                        }
                    }) {
                        Image(systemName: "arrow.clockwise")
                    }
                }
                
                ToolbarItem(placement: .automatic) {
                    Button(action: { showSettings = true }) {
                        Image(systemName: "gear")
                    }
                }
            }
        } detail: {
            if let file = selectedFile {
                EditorView(file: file, githubService: githubService)
            } else {
                VStack {
                    Text("Select a file to edit")
                        .font(.largeTitle)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .sheet(isPresented: $showSettings) {
            SettingsView { config in
                // Save to Keychain/UserDefaults
                KeychainService.shared.save(token: config.token)
                UserDefaults.standard.set(config.owner, forKey: "github_owner")
                UserDefaults.standard.set(config.repo, forKey: "github_repo")
                UserDefaults.standard.set(config.branch, forKey: "github_branch")
                
                githubService.config = config
                
                // Refresh list
                Task {
                    await fileListViewModel.fetchFiles()
                }
            }
        }
        .task {
            if githubService.config.isValid {
                await fileListViewModel.fetchFiles()
            } else {
                showSettings = true
            }
        }
    }
}

#Preview {
    ContentView()
}
