import SwiftUI
import WebKit

struct ContentView: View {
    var body: some View {
        Group {
            if let gameURL = Bundle.main.url(forResource: "index", withExtension: "html") {
                WebView(url: gameURL)
                    .webViewBackForwardNavigationGestures(.disabled)
                    .webViewLinkPreviews(.disabled)
                    .webViewMagnificationGestures(.disabled)
                    .webViewTextSelection(.disabled)
                    .webViewContentBackground(.hidden)
            } else {
                ContentUnavailableView(
                    "Game Unavailable",
                    systemImage: "exclamationmark.triangle",
                    description: Text("The bundled game could not be loaded.")
                )
                .foregroundStyle(.white)
            }
        }
        .background(.black)
        .ignoresSafeArea(edges: [.horizontal, .bottom])
    }
}

#Preview {
    ContentView()
}
