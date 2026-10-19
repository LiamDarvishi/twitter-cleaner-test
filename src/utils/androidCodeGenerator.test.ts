import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_NUKE_CONFIG,
  generateAndroidManifestXml,
  generateInjectedJs,
  generateMainActivityKt,
  validateRequirements,
} from './androidCodeGenerator.ts';

test('generateAndroidManifestXml includes INTERNET permission and MainActivity declaration', () => {
  const xml = generateAndroidManifestXml();
  assert.ok(xml.includes('<uses-permission android:name="android.permission.INTERNET" />'));
  assert.ok(xml.includes('android:name=".MainActivity"'));
  assert.ok(xml.includes('android.intent.action.MAIN'));
});

test('generateInjectedJs includes all required X DOM selectors and scroll loop', () => {
  const js = generateInjectedJs(DEFAULT_NUKE_CONFIG);
  assert.ok(js.includes('document.querySelectorAll(\'[data-testid="tweet"]\')'));
  assert.ok(js.includes('tweet.querySelector(\'[data-testid="caret"]\')'));
  assert.ok(js.includes('document.querySelectorAll(\'[role="menuitem"]\')'));
  assert.ok(js.includes("text.includes('delete')"));
  assert.ok(js.includes("text.includes('undo repost')"));
  assert.ok(js.includes('document.querySelector(\'[data-testid="confirmationSheetConfirm"]\')'));
  assert.ok(js.includes('window.scrollBy'));
});

test('generateMainActivityKt produces null-safe Kotlin Compose code with WebView and red NUKE ALL TWEETS button', () => {
  const kt = generateMainActivityKt({
    packageName: 'com.dev.xcleaner',
    minDelayMs: 900,
    maxDelayMs: 1700,
    scrollDistanceRatio: 0.85,
  });

  assert.ok(kt.startsWith('package com.dev.xcleaner'));
  assert.ok(kt.includes('javaScriptEnabled = true'));
  assert.ok(kt.includes('domStorageEnabled = true'));
  assert.ok(kt.includes('loadUrl("https://x.com/login")'));
  assert.ok(kt.includes('text = "NUKE ALL TWEETS"'));
  assert.ok(kt.includes('webViewRef?.evaluateJavascript(NUKE_ALL_TWEETS_JS, null)'));
});

test('validateRequirements passes all strict checks on default generated files', () => {
  const xml = generateAndroidManifestXml();
  const kt = generateMainActivityKt(DEFAULT_NUKE_CONFIG);
  const results = validateRequirements(xml, kt);

  assert.equal(results.length, 4);
  for (const item of results) {
    assert.equal(item.passed, true, `Expected ${item.id} to pass`);
  }
});
