import SwiftUI
import UIKit
import WebKit

struct ContentView: View {
    var body: some View {
        ZStack {
            Color.black
                .ignoresSafeArea()

            if let gameURL = Bundle.main.url(forResource: "index", withExtension: "html") {
                GameWebView(url: gameURL)
            } else {
                ContentUnavailableView(
                    "Game Unavailable",
                    systemImage: "exclamationmark.triangle",
                    description: Text("The bundled game could not be loaded.")
                )
                .foregroundStyle(.white)
            }
        }
        .ignoresSafeArea(edges: [.horizontal, .bottom])
    }
}

private struct GameWebView: View {
    let url: URL

    @State private var page = WebPage(
        navigationDecider: ExternalLinkNavigationDecider()
    )

    var body: some View {
        WebView(page)
            .webViewBackForwardNavigationGestures(.disabled)
            .webViewLinkPreviews(.disabled)
            .webViewMagnificationGestures(.disabled)
            .webViewTextSelection(.disabled)
            .webViewContentBackground(.hidden)
            .task(id: url) {
                do {
                    for try await _ in page.load(url) {}
                } catch {
                    // The fallback remains visible if the bundled page cannot load.
                }
            }
    }
}

private struct ExternalLinkNavigationDecider: WebPage.NavigationDeciding {
    mutating func decidePolicy(
        for action: WebPage.NavigationAction,
        preferences: inout WebPage.NavigationPreferences
    ) async -> WKNavigationActionPolicy {
        guard let url = action.request.url,
              url.host() == "entervoidstar.com" else {
            return .allow
        }

        await UIApplication.shared.open(url)
        return .cancel
    }
}

#Preview {
    ContentView()
}
