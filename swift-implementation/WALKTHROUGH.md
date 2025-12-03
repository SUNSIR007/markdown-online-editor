# Swift Native Markdown Editor Walkthrough

I have successfully generated the source code for the native Swift implementation of your Markdown Editor.

## 1. Project Setup

Since I cannot create a binary Xcode project directly, I have provided the source files and a `Package.swift` file.

## 1. Project Setup (IMPORTANT)

**For iOS Development, you MUST create a standard Xcode Project.** 
Running directly as a Swift Package is not fully supported for iOS Apps and will cause launch issues.

### Step-by-Step Setup (Required for iOS)
1.  Open Xcode.
2.  Select **File > New > Project**.
3.  Choose **iOS > App**.
4.  Click **Next**.
5.  **Product Name**: `MarkdownEditor`
6.  **Interface**: SwiftUI
7.  **Language**: Swift
8.  **Storage**: None
9.  Click **Next** and save it anywhere (e.g., on your Desktop).
10. **Delete** the default `ContentView.swift` and `MarkdownEditorApp.swift` in the new project.
11. Open the `swift-implementation/Sources/MarkdownEditor` folder from this repository.
12. **Drag and Drop** all files from that folder into your new Xcode project navigator.
    *   **Check**: "Copy items if needed"
    *   **Check**: "Create groups"
    *   **Select**: Your new app target
13. **Add Capability**:
    *   Click on the Project root in Xcode.
    *   Select the Target.
    *   Go to **Signing & Capabilities**.
    *   Ensure your Team is selected.
    *   (Optional) If you want to use Keychain, click **+ Capability** and add **Keychain Sharing**.

### Option B: Open as Swift Package (macOS CLI / Testing only)
*Only use this if you are developing the logic on macOS and don't need the iOS Simulator.*
1.  Open `swift-implementation/Package.swift` in Xcode.
2.  Select `MarkdownEditor` scheme.
3.  Run.

## 2. Verification Steps

### Step 1: Configuration
1.  Run the App.
2.  You should see a **Settings** sheet (or click the Gear icon).
3.  Enter your **GitHub Token**, **Owner**, **Repo**, and **Branch**.
4.  Click **Save**.

### Step 2: File List
1.  After saving, the app should automatically fetch files from `src/content/posts` (default path in ViewModel).
2.  Verify that your markdown files appear in the sidebar.

### Step 3: Editor & Vditor
1.  Click on a file.
2.  The Editor view should appear.
3.  **Wait** a moment for Vditor to load from CDN (requires internet).
4.  Verify the markdown content is rendered in Vditor.

### Step 4: Editing & Saving
1.  Make some changes in the editor.
2.  Click the **Save** button in the Vditor toolbar (Checkmark icon).
3.  Verify the loading spinner appears and then disappears.
4.  Check your GitHub repository to see if the file was updated.

### Step 5: Image Upload
1.  Click the **Upload** button in Vditor toolbar or drag & drop an image.
2.  Verify the image is uploaded (check network or GitHub).
3.  Verify the markdown image syntax `![name](url)` is inserted into the editor.

## 3. Key Features Implemented

- **Hybrid Editor**: Uses `WKWebView` to host Vditor for a full WYSIWYG experience.
- **Native GitHub API**: Pure Swift implementation of `GitHubService` using `URLSession`.
- **Secure Storage**: Uses **Keychain** to store your GitHub Token.
- **Image Compression**: Native `CoreGraphics`/`UIImage` compression before upload.

## 4. Troubleshooting

### App Crashes on Launch (Missing Bundle ID)
If you see a crash related to `missing bundleID`, it means the `Info.plist` wasn't embedded correctly.
- **Fix**: We have added `linkerSettings` to `Package.swift` to force embed the plist. Try **Product -> Clean Build Folder** and Run again.

### App Not Appearing on Home Screen
When running via Swift Package Manager, Xcode installs a temporary debug executable that does **not** have a permanent Home Screen icon.
- **Fix**: To get a real App experience, create a new **iOS App** project in Xcode and copy the `Sources/MarkdownEditor` files into it (see **Option B** in Project Setup).
