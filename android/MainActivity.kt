package com.example.xnuke

import android.annotation.SuppressLint
import android.os.Bundle
import android.view.ViewGroup
import android.webkit.CookieManager
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            MaterialTheme(
                colorScheme = darkColorScheme(
                    primary = Color(0xFFDC2626),
                    surface = Color(0xFF0F172A),
                    background = Color(0xFF090D16)
                )
            ) {
                XNukeScreen(activity = this)
            }
        }
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun XNukeScreen(activity: ComponentActivity) {
    val context = LocalContext.current
    var webViewRef by remember { mutableStateOf<WebView?>(null) }

    val webView = remember {
        WebView(context).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )

            CookieManager.getInstance().apply {
                setAcceptCookie(true)
                setAcceptThirdPartyCookies(this@apply, true)
            }

            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                loadsImagesAutomatically = true
                mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
                cacheMode = WebSettings.LOAD_DEFAULT
                setSupportMultipleWindows(false)
                javaScriptCanOpenWindowsAutomatically = false
                // Standard mobile User-Agent so X.com serves the mobile web app cleanly
                userAgentString = settings.userAgentString.replace("; wv", "")
            }

            webChromeClient = WebChromeClient()

            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(
                    view: WebView?,
                    request: WebResourceRequest?
                ): Boolean {
                    // Allow all URL loading within this WebView instance
                    return false
                }
            }

            loadUrl("https://x.com/login")
        }
    }

    DisposableEffect(webView) {
        webViewRef = webView
        val backCallback = object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                val currentWebView = webViewRef
                if (currentWebView != null && currentWebView.canGoBack()) {
                    currentWebView.goBack()
                } else {
                    isEnabled = false
                    activity.onBackPressedDispatcher.onBackPressed()
                }
            }
        }
        activity.onBackPressedDispatcher.addCallback(backCallback)

        onDispose {
            backCallback.remove()
            webView.stopLoading()
            webView.destroy()
            webViewRef = null
        }
    }

    Scaffold(
        topBar = {
            Surface(
                color = Color(0xFF0F172A),
                tonalElevation = 4.dp
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 10.dp),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Button(
                        onClick = {
                            webViewRef?.evaluateJavascript(NUKE_ALL_TWEETS_JS, null)
                        },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFFDC2626),
                            contentColor = Color.White
                        )
                    ) {
                        Text(
                            text = "NUKE ALL TWEETS",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            AndroidView(
                factory = { webView },
                modifier = Modifier.fillMaxSize()
            )
        }
    }
}

private const val NUKE_ALL_TWEETS_JS = """
(function() {
    if (window.__xNukeActive) {
        console.log('X Nuke loop is already running.');
        return;
    }
    window.__xNukeActive = true;

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const randomDelay = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    async function processTweet(tweet) {
        // 1. Check if this tweet is a Retweet / Repost first (green repost button active)
        const unretweetBtn = tweet.querySelector('[data-testid="unretweet"]');
        if (unretweetBtn) {
            unretweetBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await sleep(randomDelay(800, 1200));
            unretweetBtn.click();
            await sleep(randomDelay(900, 1400));

            const confirmUnretweet = document.querySelector('[data-testid="unretweetConfirm"]');
            if (confirmUnretweet) {
                confirmUnretweet.click();
                await sleep(randomDelay(1000, 1600));
                return true;
            }

            // Fallback: check role="menuitem" for "Undo repost"
            const menuItems = Array.from(document.querySelectorAll('[role="menuitem"]'));
            const undoItem = menuItems.find((el) => {
                const text = (el.textContent || '').toLowerCase();
                return text.includes('undo repost') || text.includes('undo retweet');
            });
            if (undoItem) {
                undoItem.click();
                await sleep(randomDelay(1000, 1600));
                return true;
            }
        }

        // 2. Otherwise open the caret menu [data-testid="caret"] on the tweet
        const caret = tweet.querySelector('[data-testid="caret"]');
        if (!caret) {
            tweet.setAttribute('data-nuke-skipped', 'true');
            return false;
        }

        caret.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await sleep(randomDelay(800, 1200));
        caret.click();
        await sleep(randomDelay(900, 1500));

        // 3. Find either "Delete" or "Undo repost" in [role="menuitem"]
        const menuItems = Array.from(document.querySelectorAll('[role="menuitem"]'));
        const targetAction = menuItems.find((item) => {
            const text = (item.textContent || '').trim().toLowerCase();
            return text.includes('delete') || text.includes('undo repost') || text.includes('undo retweet');
        });

        if (!targetAction) {
            // Close open menu by pressing Escape or clicking body and mark tweet as skipped
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            document.body.click();
            tweet.setAttribute('data-nuke-skipped', 'true');
            await sleep(randomDelay(800, 1100));
            return false;
        }

        targetAction.click();
        await sleep(randomDelay(900, 1500));

        // 4. Click confirmation button [data-testid="confirmationSheetConfirm"] if shown
        const confirmBtn = document.querySelector('[data-testid="confirmationSheetConfirm"]');
        if (confirmBtn) {
            confirmBtn.click();
            await sleep(randomDelay(1100, 1800));
        } else {
            await sleep(randomDelay(900, 1400));
        }

        return true;
    }

    async function nukeLoop() {
        let emptyScrollAttempts = 0;

        while (window.__xNukeActive) {
            const allTweets = Array.from(document.querySelectorAll('[data-testid="tweet"]'));
            const actionableTweets = allTweets.filter((t) => !t.hasAttribute('data-nuke-skipped'));

            if (actionableTweets.length === 0) {
                window.scrollBy({ top: window.innerHeight * 0.85, behavior: 'smooth' });
                emptyScrollAttempts++;
                await sleep(randomDelay(1400, 2000));

                const afterScrollTweets = Array.from(
                    document.querySelectorAll('[data-testid="tweet"]:not([data-nuke-skipped])')
                );
                if (afterScrollTweets.length === 0 && emptyScrollAttempts >= 8) {
                    console.log('No more tweets found after multiple scroll attempts. Stopping.');
                    window.__xNukeActive = false;
                    break;
                }
                continue;
            }

            emptyScrollAttempts = 0;

            for (const tweet of actionableTweets) {
                if (!window.__xNukeActive) break;
                if (!document.body.contains(tweet)) continue;
                await processTweet(tweet);
            }

            // Scroll down after clearing visible batch to trigger infinite scroll
            window.scrollBy({ top: window.innerHeight * 0.85, behavior: 'smooth' });
            await sleep(randomDelay(1200, 1900));
        }
    }

    nukeLoop().catch((err) => {
        console.error('X Nuke loop error:', err);
        window.__xNukeActive = false;
    });
})();
"""
