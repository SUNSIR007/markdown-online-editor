// swift-tools-version: 6.0
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "MarkdownEditor",
    platforms: [
        .macOS(.v14),
        .iOS(.v17)
    ],
    products: [
        .executable(name: "MarkdownEditor", targets: ["MarkdownEditor"])
    ],
    targets: [
        .executableTarget(
            name: "MarkdownEditor",
            resources: [
                .process("Resources")
            ],
            linkerSettings: [
                .unsafeFlags([
                    "-Xlinker", "-sectcreate",
                    "-Xlinker", "__TEXT",
                    "-Xlinker", "__info_plist",
                    "-Xlinker", "Sources/MarkdownEditor/Info.plist"
                ])
            ]
        )
    ]
)
