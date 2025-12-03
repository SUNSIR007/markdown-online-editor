# Swift Native Markdown Editor

This folder contains the source code for the native macOS/iOS version of the Markdown Online Editor.

## How to Run

Since this is a raw source folder (to avoid binary conflicts in git), you need to set it up in Xcode:

### Option 1: Open as Package (Simplest)
1. Open Xcode.
2. Select "Open Existing Project...".
3. Select the `swift-implementation` folder.
4. Xcode should recognize the `Package.swift` and load the project.
5. Note: You might need to configure the Run Scheme to executable if you want to run it directly, but usually for an App, Option 2 is better for full capabilities (Signing, Capabilities, etc.).

### Option 2: Create a New Xcode Project (Recommended for App)
1. Open Xcode -> Create a new Xcode Project.
2. Choose **App** (under macOS or iOS).
3. Product Name: `MarkdownEditor`.
4. Interface: **SwiftUI**.
5. Language: **Swift**.
6. Create the project in a temporary location.
7. **Copy** the contents of `Sources` from this folder into your new Xcode project's folder, replacing the default files.
8. Add the `Resources` folder to your project (drag and drop into Xcode navigator, select "Create folder references").

## Structure

- **App**: Entry point (`MarkdownEditorApp.swift`).
- **Models**: Data models (`GitHubFile`, etc.).
- **Services**: Business logic (`GitHubService`, `ImageService`).
- **ViewModels**: State management.
- **Views**: SwiftUI Views.
