/**
 * Behavior Monitoring Service for Proctor System
 * Monitors suspicious behaviors: tab switches, window blur, clipboard access, device changes, etc.
 * Logs all behaviors for proctor review
 */

export type BehaviorType =
  | 'tab_switch'
  | 'window_blur'
  | 'window_focus'
  | 'clipboard_access'
  | 'right_click'
  | 'developer_tools'
  | 'screenshot_attempt'
  | 'keyboard_shortcut'
  | 'unusual_typing'
  | 'mobile_detected'
  | 'device_change'
  | 'network_anomaly';

export interface BehaviorEvent {
  type: BehaviorType;
  severity: 'low' | 'medium' | 'high';
  details: Record<string, any>;
  timestamp: number;
  duration?: number; // ms for events with duration (e.g., window blur)
}

export interface BehaviorMonitorConfig {
  enableTabMonitoring?: boolean;
  enableClipboardMonitoring?: boolean;
  enableDevToolsDetection?: boolean;
  enableScreenshotDetection?: boolean;
  enableTypingAnalysis?: boolean;
  enableMobileDetection?: boolean;
  enableNetworkMonitoring?: boolean;
  focusLossThreshold?: number; // ms before flagging focus loss
  tabSwitchThreshold?: number; // ms before flagging
}

interface TypingPattern {
  lastKeystrokeTime: number;
  keystrokeIntervals: number[]; // recent intervals in ms
  pasteDetected: boolean;
  copyWasRecent: boolean;
}

class BehaviorMonitorService {
  private config: Required<BehaviorMonitorConfig>;
  private onBehaviorCallback: ((event: BehaviorEvent) => void) | null = null;
  private isMonitoring = false;

  // Tab monitoring
  private lastFocusTime = 0;
  private tabSwitchCount = 0;
  private windowBlurStart: number | null = null;

  // Clipboard monitoring
  private lastCopyTime = 0;
  private lastPasteTime = 0;

  // Typing analysis
  private typingPattern: TypingPattern = {
    lastKeystrokeTime: 0,
    keystrokeIntervals: [],
    pasteDetected: false,
    copyWasRecent: false,
  };

  // Device tracking
  private originalUserAgent = navigator.userAgent;
  private originalScreenResolution = { width: screen.width, height: screen.height };
  private originalTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  private originalLanguage = navigator.language;
  private deviceChangeDetected = false;

  // Network monitoring (simple)
  private connectionType: string | null = null;

  constructor(config: BehaviorMonitorConfig = {}) {
    this.config = {
      enableTabMonitoring: config.enableTabMonitoring ?? true,
      enableClipboardMonitoring: config.enableClipboardMonitoring ?? true,
      enableDevToolsDetection: config.enableDevToolsDetection ?? true,
      enableScreenshotDetection: config.enableScreenshotDetection ?? true,
      enableTypingAnalysis: config.enableTypingAnalysis ?? true,
      enableMobileDetection: config.enableMobileDetection ?? true,
      enableNetworkMonitoring: config.enableNetworkMonitoring ?? true,
      focusLossThreshold: config.focusLossThreshold ?? 5000, // 5 seconds
      tabSwitchThreshold: config.tabSwitchThreshold ?? 500, // 500ms
    };

    this.lastFocusTime = Date.now();
    this.detectConnectionType();
  }

  /**
   * Start behavior monitoring
   */
  startMonitoring(onBehavior: (event: BehaviorEvent) => void): void {
    if (this.isMonitoring) return;

    this.onBehaviorCallback = onBehavior;
    this.isMonitoring = true;

    // Suppress specific developer-friendly behaviors
    this.suppressDevTools();
    this.suppressRightClick();

    // Attach event listeners
    if (this.config.enableTabMonitoring) {
      window.addEventListener('blur', () => this.handleWindowBlur());
      window.addEventListener('focus', () => this.handleWindowFocus());
      document.addEventListener('visibilitychange', () =>
        this.handleVisibilityChange()
      );
    }

    if (this.config.enableClipboardMonitoring) {
      document.addEventListener('copy', () => this.handleCopy());
      document.addEventListener('paste', () => this.handlePaste());
    }

    if (this.config.enableScreenshotDetection) {
      document.addEventListener('keydown', (e) =>
        this.detectScreenshotKeystrokes(e)
      );
    }

    if (this.config.enableTypingAnalysis) {
      document.addEventListener('keydown', (e) => this.analyzeTyping('keydown', e));
      document.addEventListener('keyup', (e) => this.analyzeTyping('keyup', e));
    }

    if (this.config.enableMobileDetection) {
      window.addEventListener('orientationchange', () =>
        this.handleOrientationChange()
      );
      window.addEventListener('deviceorientationchange', () =>
        this.handleDeviceOrientationChange()
      );
    }

    // Periodic device checks
    setInterval(() => this.checkDeviceChanges(), 10000); // Every 10 seconds

    console.log('Behavior monitoring started');
  }

  /**
   * Stop behavior monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    this.onBehaviorCallback = null;
    console.log('Behavior monitoring stopped');
  }

  /**
   * Handle window blur (user switched tabs/windows)
   */
  private handleWindowBlur(): void {
    if (!this.isMonitoring) return;

    this.windowBlurStart = Date.now();

    this.emitEvent({
      type: 'window_blur',
      severity: 'low',
      details: {
        blurStartTime: this.windowBlurStart,
      },
      timestamp: this.windowBlurStart,
    });
  }

  /**
   * Handle window focus (user returned)
   */
  private handleWindowFocus(): void {
    if (!this.isMonitoring || !this.windowBlurStart) return;

    const duration = Date.now() - this.windowBlurStart;

    this.emitEvent({
      type: 'window_blur',
      severity: duration > this.config.focusLossThreshold ? 'medium' : 'low',
      details: {
        focusLossDuration: duration,
        threshold: this.config.focusLossThreshold,
      },
      timestamp: Date.now(),
      duration,
    });

    this.windowBlurStart = null;
  }

  /**
   * Handle document visibility change (tab switch)
   */
  private handleVisibilityChange(): void {
    if (!this.isMonitoring || !document.hidden) return;

    this.tabSwitchCount++;

    this.emitEvent({
      type: 'tab_switch',
      severity: this.tabSwitchCount > 3 ? 'medium' : 'low',
      details: {
        currentTabSwitches: this.tabSwitchCount,
        hidden: document.hidden,
        currentTab: document.title,
      },
      timestamp: Date.now(),
    });
  }

  /**
   * Handle copy event
   */
  private handleCopy(): void {
    if (!this.isMonitoring) return;

    this.lastCopyTime = Date.now();
    this.typingPattern.copyWasRecent = true;

    // Reset after delay
    setTimeout(() => {
      this.typingPattern.copyWasRecent = false;
    }, 2000);
  }

  /**
   * Handle paste event
   */
  private handlePaste(): void {
    if (!this.isMonitoring) return;

    this.lastPasteTime = Date.now();
    this.typingPattern.pasteDetected = true;

    // Check if paste is suspicious (copy was recent)
    const timeSinceCopy = this.lastPasteTime - this.lastCopyTime;
    const isSuspiciousPaste = timeSinceCopy < 2000;

    this.emitEvent({
      type: 'clipboard_access',
      severity: isSuspiciousPaste ? 'high' : 'medium',
      details: {
        pasteTime: this.lastPasteTime,
        timeSinceCopy: isSuspiciousPaste ? timeSinceCopy : null,
        suspicious: isSuspiciousPaste,
      },
      timestamp: Date.now(),
    });

    // Reset after delay
    setTimeout(() => {
      this.typingPattern.pasteDetected = false;
    }, 3000);
  }

  /**
   * Detect screenshot keystroke attempts
   * Common shortcuts: Ctrl+S, PrintScreen, Cmd+Shift+3/4 (Mac)
   */
  private detectScreenshotKeystrokes(event: KeyboardEvent): void {
    if (!this.isMonitoring) return;

    const isScreenshotAttempt =
      (event.ctrlKey || event.metaKey) && event.key === 's' // Ctrl/Cmd+S
      || event.key === 'PrintScreen'
      || (event.metaKey && event.shiftKey && (event.key === '3' || event.key === '4'))
      || (event.ctrlKey && event.shiftKey && event.key === 's');

    if (isScreenshotAttempt) {
      event.preventDefault();

      this.emitEvent({
        type: 'screenshot_attempt',
        severity: 'high',
        details: {
          shortcut: this.getKeyCombination(event),
          prevented: true,
        },
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Analyze typing patterns to detect copy-paste
   */
  private analyzeTyping(eventType: 'keydown' | 'keyup', event: KeyboardEvent): void {
    if (!this.isMonitoring || !this.config.enableTypingAnalysis) return;

    if (eventType === 'keydown') {
      const now = Date.now();
      const interval = now - this.typingPattern.lastKeystrokeTime;

      // Track keystroke intervals
      if (interval > 0 && interval < 2000) {
        this.typingPattern.keystrokeIntervals.push(interval);
        if (this.typingPattern.keystrokeIntervals.length > 50) {
          this.typingPattern.keystrokeIntervals.shift();
        }
      }

      this.typingPattern.lastKeystrokeTime = now;

      // Detect unusual patterns (extremely fast typing = likely copy-paste)
      if (interval < 50 && this.typingPattern.keystrokeIntervals.length > 5) {
        const avgInterval =
          this.typingPattern.keystrokeIntervals.reduce((a, b) => a + b, 0) /
          this.typingPattern.keystrokeIntervals.length;

        // Average interval < 100ms is suspicious (normal human typing is 100-200ms)
        if (avgInterval < 80) {
          this.emitEvent({
            type: 'unusual_typing',
            severity: 'medium',
            details: {
              averageKeystrokeInterval: Math.round(avgInterval),
              possiblePasteBehavior: true,
              recentIntervals: this.typingPattern.keystrokeIntervals.slice(-10),
            },
            timestamp: now,
          });

          // Reset pattern after reporting
          this.typingPattern.keystrokeIntervals = [];
        }
      }
    }
  }

  /**
   * Suppress developer tools (basic attempt)
   */
  private suppressDevTools(): void {
    // F12
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F12') {
        e.preventDefault();
        this.emitEvent({
          type: 'developer_tools',
          severity: 'high',
          details: { key: 'F12', prevented: true },
          timestamp: Date.now(),
        });
      }

      // Ctrl/Cmd + Shift + I
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'i') {
        e.preventDefault();
        this.emitEvent({
          type: 'developer_tools',
          severity: 'high',
          details: { key: 'Ctrl/Cmd+Shift+I', prevented: true },
          timestamp: Date.now(),
        });
      }

      // Ctrl/Cmd + Shift + C
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'c') {
        e.preventDefault();
        this.emitEvent({
          type: 'developer_tools',
          severity: 'high',
          details: { key: 'Ctrl/Cmd+Shift+C', prevented: true },
          timestamp: Date.now(),
        });
      }
    });
  }

  /**
   * Suppress right-click context menu
   */
  private suppressRightClick(): void {
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();

      this.emitEvent({
        type: 'right_click',
        severity: 'low',
        details: { prevented: true },
        timestamp: Date.now(),
      });
    });
  }

  /**
   * Check for device configuration changes
   */
  private checkDeviceChanges(): void {
    if (!this.isMonitoring || !this.config.enableMobileDetection) return;

    const changes: string[] = [];

    // Check screen resolution change
    if (
      screen.width !== this.originalScreenResolution.width ||
      screen.height !== this.originalScreenResolution.height
    ) {
      changes.push('screen_resolution_changed');
    }

    // Check language change
    if (navigator.language !== this.originalLanguage) {
      changes.push('language_changed');
    }

    // Check timezone change (indirect via system time)
    if (Intl.DateTimeFormat().resolvedOptions().timeZone !== this.originalTimezone) {
      changes.push('timezone_changed');
    }

    if (changes.length > 0) {
      this.emitEvent({
        type: 'device_change',
        severity: 'high',
        details: {
          changes,
          newScreenResolution: { width: screen.width, height: screen.height },
          newLanguage: navigator.language,
        },
        timestamp: Date.now(),
      });

      this.deviceChangeDetected = true;
    }
  }

  /**
   * Handle orientation change (mobile)
   */
  private handleOrientationChange(): void {
    if (!this.isMonitoring) return;

    this.emitEvent({
      type: 'mobile_detected',
      severity: 'medium',
      details: {
        orientation: window.orientation,
        isMobile: /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent),
      },
      timestamp: Date.now(),
    });
  }

  /**
   * Handle device orientation change
   */
  private handleDeviceOrientationChange(): void {
    if (!this.isMonitoring) return;

    this.emitEvent({
      type: 'mobile_detected',
      severity: 'medium',
      details: {
        hasDeviceOrientation:
          window.DeviceOrientationEvent && typeof window.DeviceOrientationEvent ===
          'function',
      },
      timestamp: Date.now(),
    });
  }

  /**
   * Detect network connection type
   */
  private detectConnectionType(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
        || (navigator as any).mozConnection
        || (navigator as any).webkitConnection;

      if (connection) {
        this.connectionType = connection.effectiveType; // 4g, 3g, 2g, slow-2g
      }
    }
  }

  /**
   * Helper: Convert key event to readable combination
   */
  private getKeyCombination(event: KeyboardEvent): string {
    const keys = [];
    if (event.ctrlKey) keys.push('Ctrl');
    if (event.altKey) keys.push('Alt');
    if (event.shiftKey) keys.push('Shift');
    if (event.metaKey) keys.push('Meta');
    keys.push(event.key);
    return keys.join('+');
  }

  /**
   * Emit behavior event
   */
  private emitEvent(event: BehaviorEvent): void {
    this.onBehaviorCallback?.(event);
  }

  /**
   * Get monitoring status
   */
  getStatus(): {
    isMonitoring: boolean;
    tabSwitchCount: number;
    deviceChangeDetected: boolean;
  } {
    return {
      isMonitoring: this.isMonitoring,
      tabSwitchCount: this.tabSwitchCount,
      deviceChangeDetected: this.deviceChangeDetected,
    };
  }

  /**
   * Reset monitoring state
   */
  reset(): void {
    this.tabSwitchCount = 0;
    this.deviceChangeDetected = false;
    this.typingPattern = {
      lastKeystrokeTime: 0,
      keystrokeIntervals: [],
      pasteDetected: false,
      copyWasRecent: false,
    };
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopMonitoring();
  }
}

// Export singleton instance
export const behaviorMonitorService = new BehaviorMonitorService();
export default behaviorMonitorService;
