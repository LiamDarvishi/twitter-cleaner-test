export interface NukeScriptConfig {
  packageName: string;
  minDelayMs: number;
  maxDelayMs: number;
  scrollDistanceRatio: number;
}

export const DEFAULT_NUKE_CONFIG: NukeScriptConfig = {
  packageName: 'com.example.xnuke',
  minDelayMs: 850,
  maxDelayMs: 1650,
  scrollDistanceRatio: 0.85,
};

export interface SimulatedTweet {
  id: string;
  authorName: string;
  authorHandle: string;
  timestamp: string;
  content: string;
  isRepost: boolean;
  replies: number;
  reposts: number;
  likes: number;
}

export const INITIAL_SIMULATED_TWEETS: SimulatedTweet[] = [
  {
    id: 'tw-101',
    authorName: 'Alex Mercer',
    authorHandle: '@amercer_dev',
    timestamp: '2h',
    content: 'Shipping a brand new Jetpack Compose WebView automation utility today. Clean architecture, zero bloat.',
    isRepost: false,
    replies: 4,
    reposts: 12,
    likes: 89,
  },
  {
    id: 'tw-102',
    authorName: 'Kotlin Android Weekly',
    authorHandle: '@kotlin_weekly',
    timestamp: '9h',
    content: 'Tip: When hosting an AndroidView WebView inside Jetpack Compose, enable domStorageEnabled and CookieManager for modern SPA session persistence.',
    isRepost: true,
    replies: 18,
    reposts: 142,
    likes: 610,
  },
  {
    id: 'tw-103',
    authorName: 'Alex Mercer',
    authorHandle: '@amercer_dev',
    timestamp: 'Oct 14',
    content: 'Hot take: Sometimes a 90-line injected DOM script inside evaluateJavascript beats maintaining a full OAuth v2 API client.',
    isRepost: false,
    replies: 11,
    reposts: 7,
    likes: 64,
  },
  {
    id: 'tw-104',
    authorName: 'Android Studio Release',
    authorHandle: '@androidstudio',
    timestamp: 'Oct 02',
    content: 'Material 3 Expressive components and updated WebKit WebView APIs are now stable across API 26–35.',
    isRepost: true,
    replies: 31,
    reposts: 205,
    likes: 940,
  },
  {
    id: 'tw-105',
    authorName: 'Alex Mercer',
    authorHandle: '@amercer_dev',
    timestamp: 'Sep 19',
    content: 'Cleaning up my old archive from 2019–2025. Fresh slate incoming.',
    isRepost: false,
    replies: 2,
    reposts: 1,
    likes: 19,
  },
];

export function generateInjectedJs(config: NukeScriptConfig = DEFAULT_NUKE_CONFIG): string {
  const minDelay = Math.max(400, Math.min(config.minDelayMs, config.maxDelayMs));
  const maxDelay = Math.max(minDelay + 200, config.maxDelayMs);
  const scrollRatio = Number(config.scrollDistanceRatio.toFixed(2));

  return `(function() {
    if (window.__xNukeActive) {
        console.log('X Nuke loop is already running.');
        return;
    }
    window.__xNukeActive = true;

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const randomDelay = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    async function processTweet(tweet) {
        // 1. Check if this item has an active green repost button [data-testid="unretweet"]
        const unretweetBtn = tweet.querySelector('[data-testid="unretweet"]');
        if (unretweetBtn) {
            unretweetBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await sleep(randomDelay(${minDelay}, ${maxDelay}));
            unretweetBtn.click();
            await sleep(randomDelay(${minDelay}, ${maxDelay}));

            const confirmUnretweet = document.querySelector('[data-testid="unretweetConfirm"]');
            if (confirmUnretweet) {
                confirmUnretweet.click();
                await sleep(randomDelay(${minDelay + 150}, ${maxDelay + 250}));
                return true;
            }

            const menuItems = Array.from(document.querySelectorAll('[role="menuitem"]'));
            const undoItem = menuItems.find((el) => {
                const text = (el.textContent || '').toLowerCase();
                return text.includes('undo repost') || text.includes('undo retweet');
            });
            if (undoItem) {
                undoItem.click();
                await sleep(randomDelay(${minDelay + 150}, ${maxDelay + 250}));
                return true;
            }
        }

        // 2. Click the caret menu [data-testid="caret"]
        const caret = tweet.querySelector('[data-testid="caret"]');
        if (!caret) {
            tweet.setAttribute('data-nuke-skipped', 'true');
            return false;
        }

        caret.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await sleep(randomDelay(${minDelay}, ${maxDelay}));
        caret.click();
        await sleep(randomDelay(${minDelay}, ${maxDelay}));

        // 3. Find either "Delete" or "Undo repost" in the [role="menuitem"] list
        const menuItems = Array.from(document.querySelectorAll('[role="menuitem"]'));
        const targetAction = menuItems.find((item) => {
            const text = (item.textContent || '').trim().toLowerCase();
            return text.includes('delete') || text.includes('undo repost') || text.includes('undo retweet');
        });

        if (!targetAction) {
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            document.body.click();
            tweet.setAttribute('data-nuke-skipped', 'true');
            await sleep(randomDelay(${minDelay}, ${maxDelay}));
            return false;
        }

        targetAction.click();
        await sleep(randomDelay(${minDelay}, ${maxDelay}));

        // 4. Click confirmation button [data-testid="confirmationSheetConfirm"]
        const confirmBtn = document.querySelector('[data-testid="confirmationSheetConfirm"]');
        if (confirmBtn) {
            confirmBtn.click();
            await sleep(randomDelay(${minDelay + 200}, ${maxDelay + 300}));
        } else {
            await sleep(randomDelay(${minDelay}, ${maxDelay}));
        }

        return true;
    }

    async function nukeLoop() {
        let emptyScrollAttempts = 0;

        while (window.__xNukeActive) {
            const allTweets = Array.from(document.querySelectorAll('[data-testid="tweet"]'));
            const actionableTweets = allTweets.filter((t) => !t.hasAttribute('data-nuke-skipped'));

            if (actionableTweets.length === 0) {
                window.scrollBy({ top: window.innerHeight * ${scrollRatio}, behavior: 'smooth' });
                emptyScrollAttempts++;
                await sleep(randomDelay(1300, 1950));

                const afterScrollTweets = Array.from(
                    document.querySelectorAll('[data-testid="tweet"]:not([data-nuke-skipped])')
                );
                if (afterScrollTweets.length === 0 && emptyScrollAttempts >= 8) {
                    console.log('No more tweets found. Stopping nuke loop.');
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

            // Scroll down after clearing visible tweets to load more
            window.scrollBy({ top: window.innerHeight * ${scrollRatio}, behavior: 'smooth' });
            await sleep(randomDelay(1200, 1900));
        }
    }

    nukeLoop().catch((err) => {
        console.error('X Nuke loop error:', err);
        window.__xNukeActive = false;
    });
})();`;
}

export function generateAndroidManifestXml(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <!-- Required for loading https://x.com inside the in-app WebView -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:allowBackup="true"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:fullBackupContent="@xml/backup_rules"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.Material3.DayNight.NoActionBar"
        android:usesCleartextTraffic="false"
        tools:targetApi="34">

        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|screenSize|screenLayout|keyboardHidden"
            android:exported="true"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>`;
}

export function generateMainActivityKt(config: NukeScriptConfig = DEFAULT_NUKE_CONFIG): string {
  const pkg = config.packageName.trim() || DEFAULT_NUKE_CONFIG.packageName;
  const injectedJs = generateInjectedJs(config);

  return `package ${pkg}

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
                // Strip "; wv" marker so X.com serves the standard mobile web login flow
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
${injectedJs}
"""
`;
}

export function validateRequirements(
  manifestXml: string,
  mainActivityKt: string
): { id: string; label: string; passed: boolean; detail: string }[] {
  return [
    {
      id: 'manifest-internet',
      label: 'AndroidManifest.xml INTERNET Permission',
      passed: manifestXml.includes('android.permission.INTERNET'),
      detail: 'uses-permission android:name="android.permission.INTERNET"',
    },
    {
      id: 'compose-single-activity',
      label: 'Single Activity + Material 3 Red Button',
      passed:
        mainActivityKt.includes('class MainActivity : ComponentActivity()') &&
        mainActivityKt.includes('"NUKE ALL TWEETS"') &&
        mainActivityKt.includes('Color(0xFFDC2626)'),
      detail: 'Scaffold topBar with red NUKE ALL TWEETS button over AndroidView(WebView)',
    },
    {
      id: 'webview-config',
      label: 'WebView JS, DOM Storage & URL Loading',
      passed:
        mainActivityKt.includes('javaScriptEnabled = true') &&
        mainActivityKt.includes('domStorageEnabled = true') &&
        mainActivityKt.includes('loadUrl("https://x.com/login")') &&
        mainActivityKt.includes('shouldOverrideUrlLoading'),
      detail: 'javaScriptEnabled, domStorageEnabled, shouldOverrideUrlLoading = false, https://x.com/login',
    },
    {
      id: 'dom-selectors',
      label: 'X.com DOM Selectors & Scroll Loop',
      passed:
        mainActivityKt.includes('[data-testid="tweet"]') &&
        mainActivityKt.includes('[data-testid="caret"]') &&
        mainActivityKt.includes('[role="menuitem"]') &&
        mainActivityKt.includes('[data-testid="confirmationSheetConfirm"]') &&
        mainActivityKt.includes('window.scrollBy'),
      detail: 'Queries tweet, caret, role="menuitem" (Delete / Undo repost), confirmationSheetConfirm, window.scrollBy',
    },
  ];
}
