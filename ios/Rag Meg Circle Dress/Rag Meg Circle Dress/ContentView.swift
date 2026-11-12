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
    }
}

private struct GameWebView: View {
    let url: URL

    @Environment(\.scenePhase) private var scenePhase

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
            .onChange(of: scenePhase, initial: true) { _, newPhase in
                Task {
                    await updateAudio(for: newPhase)
                }
            }
    }

    @MainActor
    private func updateAudio(for phase: ScenePhase) async {
        switch phase {
        case .active:
            do {
                await page.setAllMediaPlaybackSuspended(false)
                try await page.callJavaScript(
                    "if (window.appDidBecomeActive) { await window.appDidBecomeActive(); }"
                )
            } catch {
                // The page may still be loading; its own focus handler remains a fallback.
            }
        case .background:
            _ = try? await page.callJavaScript(
                "if (window.appDidEnterBackground) { await window.appDidEnterBackground(); }"
            )
            await page.setAllMediaPlaybackSuspended(true)
        case .inactive:
            break
        @unknown default:
            break
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
