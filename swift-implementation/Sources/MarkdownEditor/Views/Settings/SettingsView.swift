import SwiftUI

struct SettingsView: View {
    @Environment(\.dismiss) var dismiss
    @State private var token: String = ""
    @State private var owner: String = ""
    @State private var repo: String = ""
    @State private var branch: String = "main"
    
    var onSave: (RepoConfig) -> Void
    
    var body: some View {
        Form {
            Section("GitHub Authentication") {
                SecureField("Personal Access Token", text: $token)
                Text("Token requires 'repo' scope")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            
            Section("Repository") {
                TextField("Owner", text: $owner)
                TextField("Repository Name", text: $repo)
                TextField("Branch", text: $branch)
            }
            
            Button("Save Configuration") {
                let config = RepoConfig(token: token, owner: owner, repo: repo, branch: branch)
                onSave(config)
                dismiss()
            }
            .disabled(token.isEmpty || owner.isEmpty || repo.isEmpty)
        }
        .padding()
        .frame(width: 400, height: 300)
    }
}
