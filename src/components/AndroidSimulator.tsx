import React, { useEffect, useRef, useState } from 'react';
import {
  INITIAL_SIMULATED_TWEETS,
  SimulatedTweet,
} from '../utils/androidCodeGenerator';
import {
  Lock,
  MoreHorizontal,
  Repeat2,
  Heart,
  MessageCircle,
  RotateCcw,
  Trash2,
  ArrowDown,
} from 'lucide-react';

interface AndroidSimulatorProps {
  minDelayMs: number;
  maxDelayMs: number;
  onTriggerFromHeader?: number;
}

type WebViewPage = 'login' | 'profile';

type ActiveAutomationStep =
  | 'idle'
  | 'query_tweet'
  | 'click_caret'
  | 'select_menuitem'
  | 'confirm_sheet'
  | 'scroll_by'
  | 'completed';

export const AndroidSimulator: React.FC<AndroidSimulatorProps> = ({
  minDelayMs,
  onTriggerFromHeader,
}) => {
  const [page, setPage] = useState<WebViewPage>('profile');
  const [usernameInput, setUsernameInput] = useState('@amercer_dev');
  const [passwordInput, setPasswordInput] = useState('••••••••••••');
  const [tweets, setTweets] = useState<SimulatedTweet[]>(INITIAL_SIMULATED_TWEETS);
  const [isNuking, setIsNuking] = useState(false);
  const [activeStep, setActiveStep] = useState<ActiveAutomationStep>('idle');
  const [activeTweetId, setActiveTweetId] = useState<string | null>(null);
  const [openCaretTweetId, setOpenCaretTweetId] = useState<string | null>(null);
  const [confirmDialogTweet, setConfirmDialogTweet] = useState<SimulatedTweet | null>(null);
  const [deletedCount, setDeletedCount] = useState(0);
  const [scrollCount, setScrollCount] = useState(0);

  const isNukingRef = useRef(false);
  const tweetsRef = useRef<SimulatedTweet[]>(tweets);
  tweetsRef.current = tweets;

  // Allow external trigger if user clicks a test action
  useEffect(() => {
    if (onTriggerFromHeader && onTriggerFromHeader > 0) {
      if (page !== 'profile') {
        setPage('profile');
      }
      startNukeLoop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onTriggerFromHeader]);

  useEffect(() => {
    return () => {
      isNukingRef.current = false;
    };
  }, []);

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const startNukeLoop = async () => {
    if (isNukingRef.current) return;
    if (page !== 'profile') {
      setPage('profile');
      await sleep(250);
    }

    isNukingRef.current = true;
    setIsNuking(true);

    // Use a fast-enough cadence in preview while mirroring the exact 5-step selector chain
    const stepWait = Math.max(260, Math.min(550, Math.round(minDelayMs * 0.45)));

    while (isNukingRef.current && tweetsRef.current.length > 0) {
      const currentTarget = tweetsRef.current[0];
      if (!currentTarget) break;

      // Step a: document.querySelectorAll('[data-testid="tweet"]')
      setActiveTweetId(currentTarget.id);
      setActiveStep('query_tweet');
      await sleep(stepWait);
      if (!isNukingRef.current) break;

      // Step b: Click [data-testid="caret"]
      setActiveStep('click_caret');
      setOpenCaretTweetId(currentTarget.id);
      await sleep(stepWait);
      if (!isNukingRef.current) break;

      // Step c: Find "Delete" or "Undo repost" in [role="menuitem"]
      setActiveStep('select_menuitem');
      await sleep(stepWait);
      if (!isNukingRef.current) break;

      // Step d: Click [data-testid="confirmationSheetConfirm"]
      setOpenCaretTweetId(null);
      setConfirmDialogTweet(currentTarget);
      setActiveStep('confirm_sheet');
      await sleep(stepWait);
      if (!isNukingRef.current) break;

      // Remove the tweet from DOM
      setConfirmDialogTweet(null);
      setTweets((prev) => prev.filter((t) => t.id !== currentTarget.id));
      setDeletedCount((c) => c + 1);

      // Step e: window.scrollBy to load more
      setActiveStep('scroll_by');
      setScrollCount((s) => s + 1);
      await sleep(Math.round(stepWait * 0.8));
    }

    setActiveTweetId(null);
    setOpenCaretTweetId(null);
    setConfirmDialogTweet(null);
    setIsNuking(false);
    isNukingRef.current = false;
    setActiveStep('completed');
  };

  const handleResetFeed = () => {
    isNukingRef.current = false;
    setIsNuking(false);
    setActiveTweetId(null);
    setOpenCaretTweetId(null);
    setConfirmDialogTweet(null);
    setTweets(INITIAL_SIMULATED_TWEETS);
    setDeletedCount(0);
    setScrollCount(0);
    setActiveStep('idle');
  };

  const currentUrl =
    page === 'login' ? 'https://x.com/login' : 'https://x.com/amercer_dev';

  return (
    <div className="flex flex-col border border-slate-800 bg-slate-900/70 rounded-xl p-5">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100">
            Interactive Android WebView Preview
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Test the Material 3 top bar button and live DOM selector sequence
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage(page === 'login' ? 'profile' : 'login')}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            {page === 'login' ? 'Switch to Profile View' : 'View Login Screen'}
          </button>
          <button
            type="button"
            onClick={handleResetFeed}
            aria-label="Reset simulated tweets"
            className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Feed
          </button>
        </div>
      </div>

      {/* Android Device Hardware Bezel */}
      <div className="mx-auto w-full max-w-[380px] rounded-[28px] border-4 border-slate-700 bg-[#090D16] overflow-hidden shadow-xl flex flex-col">
        {/* Android System Status Bar */}
        <div className="flex items-center justify-between px-5 py-2 bg-[#090D16] text-[11px] font-mono text-slate-400 select-none">
          <span>09:41</span>
          <span>5G · 100%</span>
        </div>

        {/* Material 3 Scaffold TopBar with Red "NUKE ALL TWEETS" Button */}
        <div className="px-4 py-2.5 bg-[#0F172A] border-b border-slate-800">
          <button
            type="button"
            onClick={startNukeLoop}
            disabled={isNuking}
            className="w-full py-2.5 px-4 rounded-full bg-red-600 hover:bg-red-500 active:bg-red-700 disabled:bg-red-800/80 text-white font-bold text-sm tracking-wide transition-colors cursor-pointer whitespace-nowrap"
          >
            {isNuking ? 'NUKING TWEETS...' : 'NUKE ALL TWEETS'}
          </button>
        </div>

        {/* In-App WebView Address & State Indicator */}
        <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-950 border-b border-slate-800/80 text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5 truncate">
            <Lock className="w-3 h-3 text-slate-500 shrink-0" />
            <span className="truncate">{currentUrl}</span>
          </div>
          <span className="text-slate-500 shrink-0 tabular-nums">
            Deleted: {deletedCount}
          </span>
        </div>

        {/* Active evaluateJavascript Selector Readout */}
        <div className="px-3.5 py-2 bg-slate-900/90 border-b border-slate-800 text-[11px] font-mono text-slate-300 flex items-center justify-between gap-2">
          <span className="truncate">
            {activeStep === 'idle' && 'Ready: evaluateJavascript standby'}
            {activeStep === 'query_tweet' &&
              '1. querySelectorAll(\'[data-testid="tweet"]\')'}
            {activeStep === 'click_caret' &&
              '2. caret.click() [data-testid="caret"]'}
            {activeStep === 'select_menuitem' &&
              '3. [role="menuitem"] -> Delete / Undo repost'}
            {activeStep === 'confirm_sheet' &&
              '4. click [data-testid="confirmationSheetConfirm"]'}
            {activeStep === 'scroll_by' &&
              '5. window.scrollBy({ top: innerHeight * 0.85 })'}
            {activeStep === 'completed' &&
              'Completed: 0 [data-testid="tweet"] nodes remaining'}
          </span>
          <span className="text-slate-400 shrink-0 tabular-nums">
            Scrolls: {scrollCount}
          </span>
        </div>

        {/* Simulated AndroidView(WebView) Viewport */}
        <div className="relative h-[430px] overflow-y-auto bg-black text-slate-100 select-none">
          {page === 'login' ? (
            <div className="p-6 flex flex-col justify-between h-full">
              <div>
                <div className="text-center font-bold text-2xl tracking-tight text-white mb-6">
                  X
                </div>
                <h3 className="text-lg font-bold text-white mb-4">
                  Sign in to X
                </h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setPage('profile');
                  }}
                  className="space-y-3.5"
                >
                  <div>
                    <label
                      htmlFor="sim-x-username"
                      className="block text-xs text-slate-400 mb-1"
                    >
                      Phone, email, or username
                    </label>
                    <input
                      id="sim-x-username"
                      type="text"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="sim-x-password"
                      className="block text-xs text-slate-400 mb-1"
                    >
                      Password
                    </label>
                    <input
                      id="sim-x-password"
                      type="password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-full bg-white text-black font-bold text-sm hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Log in and Open Profile
                  </button>
                </form>
              </div>
              <p className="text-[11px] text-slate-500 text-center">
                WebView loads https://x.com/login on launch with DOM Storage &
                Cookies enabled.
              </p>
            </div>
          ) : (
            <div>
              {/* Profile Header Banner */}
              <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white">Alex Mercer</div>
                  <div className="text-xs text-slate-400">
                    {usernameInput} · {tweets.length} posts remaining
                  </div>
                </div>
                <span className="text-xs font-mono text-slate-400 tabular-nums">
                  Posts &amp; Replies
                </span>
              </div>

              {/* Tweets List */}
              {tweets.length === 0 ? (
                <div className="p-8 text-center">
                  <Trash2 className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-white">
                    All Tweets &amp; Reposts Nuked
                  </p>
                  <p className="text-xs text-slate-400 mt-1 mb-4">
                    document.querySelectorAll(&apos;[data-testid=&quot;tweet&quot;]&apos;)
                    returned 0 nodes.
                  </p>
                  <button
                    type="button"
                    onClick={handleResetFeed}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors cursor-pointer"
                  >
                    Restore Sample Tweets
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {tweets.map((tweet) => {
                    const isHighlighted = activeTweetId === tweet.id;
                    const isMenuOpen = openCaretTweetId === tweet.id;

                    return (
                      <article
                        key={tweet.id}
                        data-testid="tweet"
                        className={`relative p-3.5 transition-colors ${
                          isHighlighted
                            ? 'bg-red-950/30 ring-1 ring-inset ring-red-500/50'
                            : 'hover:bg-slate-950'
                        }`}
                      >
                        {tweet.isRepost && (
                          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium mb-1">
                            <Repeat2 className="w-3.5 h-3.5" />
                            <span>You reposted</span>
                          </div>
                        )}

                        <div className="flex items-start justify-between gap-2">
                          <div className="text-xs">
                            <span className="font-bold text-white">
                              {tweet.authorName}
                            </span>{' '}
                            <span className="text-slate-400">
                              {tweet.authorHandle} · {tweet.timestamp}
                            </span>
                          </div>

                          <button
                            type="button"
                            data-testid="caret"
                            aria-label={`Tweet menu for ${tweet.id}`}
                            onClick={() =>
                              setOpenCaretTweetId(
                                isMenuOpen ? null : tweet.id
                              )
                            }
                            className={`p-1 rounded hover:bg-slate-800 text-slate-400 ${
                              isMenuOpen ? 'bg-slate-800 text-white' : ''
                            }`}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>

                        <p className="text-xs text-slate-200 mt-1.5 leading-relaxed">
                          {tweet.content}
                        </p>

                        <div className="flex items-center gap-6 mt-2.5 text-[11px] text-slate-500 font-mono tabular-nums">
                          <span className="inline-flex items-center gap-1">
                            <MessageCircle className="w-3.5 h-3.5" />
                            {tweet.replies}
                          </span>
                          <span
                            data-testid={tweet.isRepost ? 'unretweet' : 'retweet'}
                            className={`inline-flex items-center gap-1 ${
                              tweet.isRepost ? 'text-emerald-400 font-semibold' : ''
                            }`}
                          >
                            <Repeat2 className="w-3.5 h-3.5" />
                            {tweet.reposts}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5" />
                            {tweet.likes}
                          </span>
                        </div>

                        {/* Simulated [role="menuitem"] Popup */}
                        {isMenuOpen && (
                          <div
                            role="menu"
                            className="absolute right-3 top-9 z-20 w-44 rounded-lg border border-slate-700 bg-slate-900 shadow-xl py-1"
                          >
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setOpenCaretTweetId(null);
                                setConfirmDialogTweet(tweet);
                              }}
                              className="w-full px-3 py-2 text-left text-xs font-semibold text-red-400 hover:bg-slate-800 flex items-center justify-between"
                            >
                              <span>
                                {tweet.isRepost ? 'Undo repost' : 'Delete'}
                              </span>
                              <span className="font-mono text-[10px] text-slate-400">
                                [role=&quot;menuitem&quot;]
                              </span>
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}

              {/* Simulated Confirmation Sheet [data-testid="confirmationSheetConfirm"] */}
              {confirmDialogTweet && (
                <div className="absolute inset-0 z-30 bg-black/75 flex items-center justify-center p-5">
                  <div className="w-full max-w-[270px] rounded-2xl bg-slate-900 border border-slate-700 p-4 shadow-2xl">
                    <h4 className="text-sm font-bold text-white">
                      {confirmDialogTweet.isRepost
                        ? 'Undo repost?'
                        : 'Delete post?'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      This can’t be undone and it will be removed from your
                      profile and timeline.
                    </p>
                    <button
                      type="button"
                      data-testid="confirmationSheetConfirm"
                      onClick={() => {
                        const targetId = confirmDialogTweet.id;
                        setConfirmDialogTweet(null);
                        setTweets((prev) =>
                          prev.filter((t) => t.id !== targetId)
                        );
                        setDeletedCount((c) => c + 1);
                      }}
                      className="w-full mt-3 py-2 rounded-full bg-red-600 text-white font-bold text-xs"
                    >
                      {confirmDialogTweet.isRepost ? 'Undo repost' : 'Delete'}
                    </button>
                  </div>
                </div>
              )}

              {/* Scroll Indicator Toast */}
              {activeStep === 'scroll_by' && (
                <div className="sticky bottom-3 mx-auto w-fit px-3 py-1 rounded-full bg-slate-800 border border-slate-600 text-[11px] font-mono text-slate-200 flex items-center gap-1.5 shadow-lg">
                  <ArrowDown className="w-3 h-3 text-red-400" />
                  <span>window.scrollBy(0, innerHeight * 0.85)</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
