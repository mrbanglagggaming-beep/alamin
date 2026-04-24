/**
 * AutoScrip — Firebase Configuration & Security Module (CORRECT v3)
 */

'use strict';

// Firebase Config (সঠিক প্রকল্পের তথ্য)
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyCUuUgbSHG71emJIPLpcVi1GEWidDrV7w4",
  authDomain:        "alamin-18326.firebaseapp.com",
  projectId:         "alamin-18326",
  storageBucket:     "alamin-18326.firebasestorage.app",
  messagingSenderId: "20078453184",
  appId:             "1:20078453184:web:60f3bb407024c92e2b6825"
};

const MASTER_EMAIL = 'mrbanglagggaming@gmail.com';
const MASTER_UID   = '9doS49dpnZRzrOaOg25VH7bkDlf1'; // আপনার Firebase UID

const ADMIN_ROLES = new Set(['super_admin', 'admin', 'moderator', 'content_manager']);

let _app, _auth, _db;

function initFirebase() {
  if (_app) return { app: _app, auth: _auth, db: _db };
  try {
    _app  = firebase.apps.length ? firebase.app() : firebase.initializeApp(FIREBASE_CONFIG);
    _auth = firebase.auth();
    _db   = firebase.firestore();

    try {
      _db.settings({ experimentalForceLongPolling: true, merge: true });
    } catch (_) {}

    _db.enablePersistence({ synchronizeTabs: true })
      .catch(err => {
        if (err.code !== 'failed-precondition' && err.code !== 'unimplemented') {
          console.warn('[AutoScrip] Persistence error:', err.code);
        }
      });

    window._fbApp  = _app;
    window._fbAuth = _auth;
    window._fbDb   = _db;

    console.log('[AutoScrip] Firebase initialized ✓');
    return { app: _app, auth: _auth, db: _db };
  } catch (e) {
    console.error('[AutoScrip] Firebase init failed:', e.message);
    return null;
  }
}

// Admin Cache
const AdminCache = {
  _cache: new Map(),
  _TTL:   5 * 60 * 1000,

  async check(uid) {
    if (!uid) return false;
    if (uid === MASTER_UID) return true;
    const user = _auth?.currentUser;
    if (user?.email === MASTER_EMAIL) return true;

    const cached = this._cache.get(uid);
    if (cached && (Date.now() - cached.ts) < this._TTL) {
      return cached.isAdmin;
    }

    try {
      const doc = await _db.collection('autoscrip_admins').doc(uid).get();
      let result = false;
      if (doc.exists) {
        const data = doc.data();
        result = ADMIN_ROLES.has(data?.role) && data?.active !== false;
      }
      this._cache.set(uid, { isAdmin: result, ts: Date.now() });
      return result;
    } catch (e) {
      console.warn('[AdminCache] check failed:', e.message);
      const u = _auth?.currentUser;
      return u?.uid === MASTER_UID || u?.email === MASTER_EMAIL;
    }
  },

  invalidate(uid) { if (uid) this._cache.delete(uid); },
  clear() { this._cache.clear(); }
};

async function isAdmin() {
  const user = _auth?.currentUser;
  if (!user) return false;
  if (user.uid === MASTER_UID || user.email === MASTER_EMAIL) return true;
  return AdminCache.check(user.uid);
}

// Rest of the functions (Sanitizer, DOM, ToolModel, UserModel) remain the same...
// (আগের কোডের বাকি অংশ এখানে বসবে)

window.initFirebase  = initFirebase;
window.isAdmin       = isAdmin;
window.AdminCache    = AdminCache;
window.ADMIN_ROLES   = ADMIN_ROLES;
window.MASTER_UID    = MASTER_UID;
window.MASTER_EMAIL  = MASTER_EMAIL;
window.Sanitizer     = Sanitizer;
window.DOM           = DOM;
window.ToolModel     = ToolModel;
window.UserModel     = UserModel;
window.escHtml       = str => Sanitizer.text(str);
