// js/security.js - Military-Grade Cryptography, Anti-Brute-Force & Sanitization
(function(window) {
  'use strict';

  // Constant salt for tournament integrity (never expose raw PINs in Git/Client)
  const PIN_SALT = "ACC_AL_FAYYADH_2026_SECURE_SALT_";
  
  // SHA-256 pre-computed hash for default credential (one-way cryptographic hash)
  const DEFAULT_PIN_HASH = "327c1d9f696423bcbe8e2e2ea0dc0e84dc7762055f2ee8d4320e1ced37549348";

  const STORAGE_KEY_FAILURES = "acc_sec_attempts_v1";
  const STORAGE_KEY_LOCKOUT = "acc_sec_lockout_until_v1";

  // SHA-256 using Web Cryptography API
  async function computeSha256(message) {
    if (window.crypto && window.crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(message);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } else {
      // Fallback pseudo-hash for older engines (DJB2 with salt)
      let hash = 5381;
      for (let i = 0; i < message.length; i++) {
        hash = ((hash << 5) + hash) + message.charCodeAt(i);
      }
      return (hash >>> 0).toString(16);
    }
  }

  // Constant-time string comparison to prevent timing-attack exploits
  function timingSafeEqual(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    let mismatch = a.length === b.length ? 0 : 1;
    if (mismatch) return false;
    for (let i = 0; i < a.length; i++) {
      mismatch |= (a.charCodeAt(i) ^ b.charCodeAt(i));
    }
    return mismatch === 0;
  }

  // HTML Sanitization against Stored & Reflected XSS Attacks
  function sanitize(input) {
    if (typeof input !== 'string') return input;
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };
    return input.replace(/[&<>"'/]/g, (match) => map[match]);
  }

  const Security = {
    SALT: PIN_SALT,
    DEFAULT_HASH: DEFAULT_PIN_HASH,

    // Hash a given PIN with salt
    async hashPin(pin) {
      if (!pin) return "";
      return await computeSha256(PIN_SALT + pin.toString().trim());
    },

    // Verify raw input PIN against stored SHA-256 hash
    async verifyPin(inputPin, storedHash) {
      if (!inputPin) return false;
      const targetHash = storedHash || DEFAULT_PIN_HASH;
      const computed = await this.hashPin(inputPin);
      return timingSafeEqual(computed, targetHash);
    },

    // Check if client is locked out due to brute-force attempts
    checkLockout() {
      const now = Date.now();
      const lockUntil = parseInt(localStorage.getItem(STORAGE_KEY_LOCKOUT) || "0", 10);
      if (now < lockUntil) {
        const remainingSeconds = Math.ceil((lockUntil - now) / 1000);
        return { isLocked: true, remainingSeconds };
      }
      return { isLocked: false, remainingSeconds: 0 };
    },

    // Record failed login attempt and apply progressive lockout penalty
    recordFailedAttempt() {
      const current = parseInt(localStorage.getItem(STORAGE_KEY_FAILURES) || "0", 10) + 1;
      localStorage.setItem(STORAGE_KEY_FAILURES, current.toString());

      const now = Date.now();
      let penaltySeconds = 0;

      if (current >= 5) {
        // 5x Failed: 5-minute strict lockout
        penaltySeconds = 300;
      } else if (current >= 3) {
        // 3x Failed: 30-second throttle
        penaltySeconds = 30;
      }

      if (penaltySeconds > 0) {
        localStorage.setItem(STORAGE_KEY_LOCKOUT, (now + penaltySeconds * 1000).toString());
      }

      return { attempts: current, penaltySeconds };
    },

    // Reset attempt counter after successful authentication
    recordSuccess() {
      localStorage.removeItem(STORAGE_KEY_FAILURES);
      localStorage.removeItem(STORAGE_KEY_LOCKOUT);
    },

    sanitize: sanitize
  };

  window.Security = Security;
})(window);
