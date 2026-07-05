import ai, { screen as oi, BrowserWindow as ii, globalShortcut as ci, ipcMain as xe, app as ut } from "electron";
import ke from "path";
import { fileURLToPath as li } from "url";
import wa from "util";
import on from "fs";
import ui from "crypto";
import fi from "assert";
import di from "events";
import hi from "os";
var kt = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function pi(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var xr = { exports: {} }, mi = (e) => {
  const t = typeof e;
  return e !== null && (t === "object" || t === "function");
};
const We = mi, yi = /* @__PURE__ */ new Set([
  "__proto__",
  "prototype",
  "constructor"
]), $i = (e) => !e.some((t) => yi.has(t));
function Lt(e) {
  const t = e.split("."), r = [];
  for (let n = 0; n < t.length; n++) {
    let s = t[n];
    for (; s[s.length - 1] === "\\" && t[n + 1] !== void 0; )
      s = s.slice(0, -1) + ".", s += t[++n];
    r.push(s);
  }
  return $i(r) ? r : [];
}
var _i = {
  get(e, t, r) {
    if (!We(e) || typeof t != "string")
      return r === void 0 ? e : r;
    const n = Lt(t);
    if (n.length !== 0) {
      for (let s = 0; s < n.length; s++)
        if (e = e[n[s]], e == null) {
          if (s !== n.length - 1)
            return r;
          break;
        }
      return e === void 0 ? r : e;
    }
  },
  set(e, t, r) {
    if (!We(e) || typeof t != "string")
      return e;
    const n = e, s = Lt(t);
    for (let a = 0; a < s.length; a++) {
      const o = s[a];
      We(e[o]) || (e[o] = {}), a === s.length - 1 && (e[o] = r), e = e[o];
    }
    return n;
  },
  delete(e, t) {
    if (!We(e) || typeof t != "string")
      return !1;
    const r = Lt(t);
    for (let n = 0; n < r.length; n++) {
      const s = r[n];
      if (n === r.length - 1)
        return delete e[s], !0;
      if (e = e[s], !We(e))
        return !1;
    }
  },
  has(e, t) {
    if (!We(e) || typeof t != "string")
      return !1;
    const r = Lt(t);
    if (r.length === 0)
      return !1;
    for (let n = 0; n < r.length; n++)
      if (We(e)) {
        if (!(r[n] in e))
          return !1;
        e = e[r[n]];
      } else
        return !1;
    return !0;
  }
}, cn = { exports: {} }, ln = { exports: {} }, un = { exports: {} }, fn = { exports: {} };
const Sa = on;
fn.exports = (e) => new Promise((t) => {
  Sa.access(e, (r) => {
    t(!r);
  });
});
fn.exports.sync = (e) => {
  try {
    return Sa.accessSync(e), !0;
  } catch {
    return !1;
  }
};
var gi = fn.exports, dn = { exports: {} }, hn = { exports: {} };
const ba = (e, ...t) => new Promise((r) => {
  r(e(...t));
});
hn.exports = ba;
hn.exports.default = ba;
var vi = hn.exports;
const Ei = vi, Pa = (e) => {
  if (!((Number.isInteger(e) || e === 1 / 0) && e > 0))
    return Promise.reject(new TypeError("Expected `concurrency` to be a number from 1 and up"));
  const t = [];
  let r = 0;
  const n = () => {
    r--, t.length > 0 && t.shift()();
  }, s = (l, i, ...f) => {
    r++;
    const c = Ei(l, ...f);
    i(c), c.then(n, n);
  }, a = (l, i, ...f) => {
    r < e ? s(l, i, ...f) : t.push(s.bind(null, l, i, ...f));
  }, o = (l, ...i) => new Promise((f) => a(l, f, ...i));
  return Object.defineProperties(o, {
    activeCount: {
      get: () => r
    },
    pendingCount: {
      get: () => t.length
    },
    clearQueue: {
      value: () => {
        t.length = 0;
      }
    }
  }), o;
};
dn.exports = Pa;
dn.exports.default = Pa;
var wi = dn.exports;
const Ss = wi;
class Ra extends Error {
  constructor(t) {
    super(), this.value = t;
  }
}
const Si = (e, t) => Promise.resolve(e).then(t), bi = (e) => Promise.all(e).then((t) => t[1] === !0 && Promise.reject(new Ra(t[0])));
var Pi = (e, t, r) => {
  r = Object.assign({
    concurrency: 1 / 0,
    preserveOrder: !0
  }, r);
  const n = Ss(r.concurrency), s = [...e].map((o) => [o, n(Si, o, t)]), a = Ss(r.preserveOrder ? 1 : 1 / 0);
  return Promise.all(s.map((o) => a(bi, o))).then(() => {
  }).catch((o) => o instanceof Ra ? o.value : Promise.reject(o));
};
const Oa = ke, Ia = gi, Ri = Pi;
un.exports = (e, t) => (t = Object.assign({
  cwd: process.cwd()
}, t), Ri(e, (r) => Ia(Oa.resolve(t.cwd, r)), t));
un.exports.sync = (e, t) => {
  t = Object.assign({
    cwd: process.cwd()
  }, t);
  for (const r of e)
    if (Ia.sync(Oa.resolve(t.cwd, r)))
      return r;
};
var Oi = un.exports;
const qe = ke, Na = Oi;
ln.exports = (e, t = {}) => {
  const r = qe.resolve(t.cwd || ""), { root: n } = qe.parse(r), s = [].concat(e);
  return new Promise((a) => {
    (function o(l) {
      Na(s, { cwd: l }).then((i) => {
        i ? a(qe.join(l, i)) : l === n ? a(null) : o(qe.dirname(l));
      });
    })(r);
  });
};
ln.exports.sync = (e, t = {}) => {
  let r = qe.resolve(t.cwd || "");
  const { root: n } = qe.parse(r), s = [].concat(e);
  for (; ; ) {
    const a = Na.sync(s, { cwd: r });
    if (a)
      return qe.join(r, a);
    if (r === n)
      return null;
    r = qe.dirname(r);
  }
};
var Ii = ln.exports;
const Ta = Ii;
cn.exports = async ({ cwd: e } = {}) => Ta("package.json", { cwd: e });
cn.exports.sync = ({ cwd: e } = {}) => Ta.sync("package.json", { cwd: e });
var Ni = cn.exports, pn = { exports: {} };
const ee = ke, Aa = hi, Ve = Aa.homedir(), mn = Aa.tmpdir(), { env: ot } = process, Ti = (e) => {
  const t = ee.join(Ve, "Library");
  return {
    data: ee.join(t, "Application Support", e),
    config: ee.join(t, "Preferences", e),
    cache: ee.join(t, "Caches", e),
    log: ee.join(t, "Logs", e),
    temp: ee.join(mn, e)
  };
}, Ai = (e) => {
  const t = ot.APPDATA || ee.join(Ve, "AppData", "Roaming"), r = ot.LOCALAPPDATA || ee.join(Ve, "AppData", "Local");
  return {
    // Data/config/cache/log are invented by me as Windows isn't opinionated about this
    data: ee.join(r, e, "Data"),
    config: ee.join(t, e, "Config"),
    cache: ee.join(r, e, "Cache"),
    log: ee.join(r, e, "Log"),
    temp: ee.join(mn, e)
  };
}, ji = (e) => {
  const t = ee.basename(Ve);
  return {
    data: ee.join(ot.XDG_DATA_HOME || ee.join(Ve, ".local", "share"), e),
    config: ee.join(ot.XDG_CONFIG_HOME || ee.join(Ve, ".config"), e),
    cache: ee.join(ot.XDG_CACHE_HOME || ee.join(Ve, ".cache"), e),
    // https://wiki.debian.org/XDGBaseDirectorySpecification#state
    log: ee.join(ot.XDG_STATE_HOME || ee.join(Ve, ".local", "state"), e),
    temp: ee.join(mn, t, e)
  };
}, ja = (e, t) => {
  if (typeof e != "string")
    throw new TypeError(`Expected string, got ${typeof e}`);
  return t = Object.assign({ suffix: "nodejs" }, t), t.suffix && (e += `-${t.suffix}`), process.platform === "darwin" ? Ti(e) : process.platform === "win32" ? Ai(e) : ji(e);
};
pn.exports = ja;
pn.exports.default = ja;
var Ci = pn.exports, Ce = {}, X = {};
Object.defineProperty(X, "__esModule", { value: !0 });
X.NOOP = X.LIMIT_FILES_DESCRIPTORS = X.LIMIT_BASENAME_LENGTH = X.IS_USER_ROOT = X.IS_POSIX = X.DEFAULT_TIMEOUT_SYNC = X.DEFAULT_TIMEOUT_ASYNC = X.DEFAULT_WRITE_OPTIONS = X.DEFAULT_READ_OPTIONS = X.DEFAULT_FOLDER_MODE = X.DEFAULT_FILE_MODE = X.DEFAULT_ENCODING = void 0;
const Di = "utf8";
X.DEFAULT_ENCODING = Di;
const ki = 438;
X.DEFAULT_FILE_MODE = ki;
const Li = 511;
X.DEFAULT_FOLDER_MODE = Li;
const Mi = {};
X.DEFAULT_READ_OPTIONS = Mi;
const Fi = {};
X.DEFAULT_WRITE_OPTIONS = Fi;
const Ui = 5e3;
X.DEFAULT_TIMEOUT_ASYNC = Ui;
const zi = 100;
X.DEFAULT_TIMEOUT_SYNC = zi;
const Vi = !!process.getuid;
X.IS_POSIX = Vi;
const qi = process.getuid ? !process.getuid() : !1;
X.IS_USER_ROOT = qi;
const Gi = 128;
X.LIMIT_BASENAME_LENGTH = Gi;
const Hi = 1e4;
X.LIMIT_FILES_DESCRIPTORS = Hi;
const Ki = () => {
};
X.NOOP = Ki;
var ir = {}, ft = {};
Object.defineProperty(ft, "__esModule", { value: !0 });
ft.attemptifySync = ft.attemptifyAsync = void 0;
const Ca = X, xi = (e, t = Ca.NOOP) => function() {
  return e.apply(void 0, arguments).catch(t);
};
ft.attemptifyAsync = xi;
const Wi = (e, t = Ca.NOOP) => function() {
  try {
    return e.apply(void 0, arguments);
  } catch (r) {
    return t(r);
  }
};
ft.attemptifySync = Wi;
var yn = {};
Object.defineProperty(yn, "__esModule", { value: !0 });
const Xi = X, Da = {
  isChangeErrorOk: (e) => {
    const { code: t } = e;
    return t === "ENOSYS" || !Xi.IS_USER_ROOT && (t === "EINVAL" || t === "EPERM");
  },
  isRetriableError: (e) => {
    const { code: t } = e;
    return t === "EMFILE" || t === "ENFILE" || t === "EAGAIN" || t === "EBUSY" || t === "EACCESS" || t === "EACCS" || t === "EPERM";
  },
  onChangeError: (e) => {
    if (!Da.isChangeErrorOk(e))
      throw e;
  }
};
yn.default = Da;
var dt = {}, $n = {};
Object.defineProperty($n, "__esModule", { value: !0 });
const Bi = X, J = {
  interval: 25,
  intervalId: void 0,
  limit: Bi.LIMIT_FILES_DESCRIPTORS,
  queueActive: /* @__PURE__ */ new Set(),
  queueWaiting: /* @__PURE__ */ new Set(),
  init: () => {
    J.intervalId || (J.intervalId = setInterval(J.tick, J.interval));
  },
  reset: () => {
    J.intervalId && (clearInterval(J.intervalId), delete J.intervalId);
  },
  add: (e) => {
    J.queueWaiting.add(e), J.queueActive.size < J.limit / 2 ? J.tick() : J.init();
  },
  remove: (e) => {
    J.queueWaiting.delete(e), J.queueActive.delete(e);
  },
  schedule: () => new Promise((e) => {
    const t = () => J.remove(r), r = () => e(t);
    J.add(r);
  }),
  tick: () => {
    if (!(J.queueActive.size >= J.limit)) {
      if (!J.queueWaiting.size)
        return J.reset();
      for (const e of J.queueWaiting) {
        if (J.queueActive.size >= J.limit)
          break;
        J.queueWaiting.delete(e), J.queueActive.add(e), e();
      }
    }
  }
};
$n.default = J;
Object.defineProperty(dt, "__esModule", { value: !0 });
dt.retryifySync = dt.retryifyAsync = void 0;
const Yi = $n, Ji = (e, t) => function(r) {
  return function n() {
    return Yi.default.schedule().then((s) => e.apply(void 0, arguments).then((a) => (s(), a), (a) => {
      if (s(), Date.now() >= r)
        throw a;
      if (t(a)) {
        const o = Math.round(100 + 400 * Math.random());
        return new Promise((i) => setTimeout(i, o)).then(() => n.apply(void 0, arguments));
      }
      throw a;
    }));
  };
};
dt.retryifyAsync = Ji;
const Zi = (e, t) => function(r) {
  return function n() {
    try {
      return e.apply(void 0, arguments);
    } catch (s) {
      if (Date.now() > r)
        throw s;
      if (t(s))
        return n.apply(void 0, arguments);
      throw s;
    }
  };
};
dt.retryifySync = Zi;
Object.defineProperty(ir, "__esModule", { value: !0 });
const B = on, pe = wa, me = ft, oe = yn, $e = dt, Qi = {
  chmodAttempt: me.attemptifyAsync(pe.promisify(B.chmod), oe.default.onChangeError),
  chownAttempt: me.attemptifyAsync(pe.promisify(B.chown), oe.default.onChangeError),
  closeAttempt: me.attemptifyAsync(pe.promisify(B.close)),
  fsyncAttempt: me.attemptifyAsync(pe.promisify(B.fsync)),
  mkdirAttempt: me.attemptifyAsync(pe.promisify(B.mkdir)),
  realpathAttempt: me.attemptifyAsync(pe.promisify(B.realpath)),
  statAttempt: me.attemptifyAsync(pe.promisify(B.stat)),
  unlinkAttempt: me.attemptifyAsync(pe.promisify(B.unlink)),
  closeRetry: $e.retryifyAsync(pe.promisify(B.close), oe.default.isRetriableError),
  fsyncRetry: $e.retryifyAsync(pe.promisify(B.fsync), oe.default.isRetriableError),
  openRetry: $e.retryifyAsync(pe.promisify(B.open), oe.default.isRetriableError),
  readFileRetry: $e.retryifyAsync(pe.promisify(B.readFile), oe.default.isRetriableError),
  renameRetry: $e.retryifyAsync(pe.promisify(B.rename), oe.default.isRetriableError),
  statRetry: $e.retryifyAsync(pe.promisify(B.stat), oe.default.isRetriableError),
  writeRetry: $e.retryifyAsync(pe.promisify(B.write), oe.default.isRetriableError),
  chmodSyncAttempt: me.attemptifySync(B.chmodSync, oe.default.onChangeError),
  chownSyncAttempt: me.attemptifySync(B.chownSync, oe.default.onChangeError),
  closeSyncAttempt: me.attemptifySync(B.closeSync),
  mkdirSyncAttempt: me.attemptifySync(B.mkdirSync),
  realpathSyncAttempt: me.attemptifySync(B.realpathSync),
  statSyncAttempt: me.attemptifySync(B.statSync),
  unlinkSyncAttempt: me.attemptifySync(B.unlinkSync),
  closeSyncRetry: $e.retryifySync(B.closeSync, oe.default.isRetriableError),
  fsyncSyncRetry: $e.retryifySync(B.fsyncSync, oe.default.isRetriableError),
  openSyncRetry: $e.retryifySync(B.openSync, oe.default.isRetriableError),
  readFileSyncRetry: $e.retryifySync(B.readFileSync, oe.default.isRetriableError),
  renameSyncRetry: $e.retryifySync(B.renameSync, oe.default.isRetriableError),
  statSyncRetry: $e.retryifySync(B.statSync, oe.default.isRetriableError),
  writeSyncRetry: $e.retryifySync(B.writeSync, oe.default.isRetriableError)
};
ir.default = Qi;
var _n = {};
Object.defineProperty(_n, "__esModule", { value: !0 });
const ec = {
  isFunction: (e) => typeof e == "function",
  isString: (e) => typeof e == "string",
  isUndefined: (e) => typeof e > "u"
};
_n.default = ec;
var gn = {};
Object.defineProperty(gn, "__esModule", { value: !0 });
const Mt = {}, Wr = {
  next: (e) => {
    const t = Mt[e];
    if (!t)
      return;
    t.shift();
    const r = t[0];
    r ? r(() => Wr.next(e)) : delete Mt[e];
  },
  schedule: (e) => new Promise((t) => {
    let r = Mt[e];
    r || (r = Mt[e] = []), r.push(t), !(r.length > 1) && t(() => Wr.next(e));
  })
};
gn.default = Wr;
var vn = {};
Object.defineProperty(vn, "__esModule", { value: !0 });
const tc = ke, bs = X, Ps = ir, Ee = {
  store: {},
  create: (e) => {
    const t = `000000${Math.floor(Math.random() * 16777215).toString(16)}`.slice(-6), r = Date.now().toString().slice(-10), n = "tmp-", s = `.${n}${r}${t}`;
    return `${e}${s}`;
  },
  get: (e, t, r = !0) => {
    const n = Ee.truncate(t(e));
    return n in Ee.store ? Ee.get(e, t, r) : (Ee.store[n] = r, [n, () => delete Ee.store[n]]);
  },
  purge: (e) => {
    Ee.store[e] && (delete Ee.store[e], Ps.default.unlinkAttempt(e));
  },
  purgeSync: (e) => {
    Ee.store[e] && (delete Ee.store[e], Ps.default.unlinkSyncAttempt(e));
  },
  purgeSyncAll: () => {
    for (const e in Ee.store)
      Ee.purgeSync(e);
  },
  truncate: (e) => {
    const t = tc.basename(e);
    if (t.length <= bs.LIMIT_BASENAME_LENGTH)
      return e;
    const r = /^(\.?)(.*?)((?:\.[^.]+)?(?:\.tmp-\d{10}[a-f0-9]{6})?)$/.exec(t);
    if (!r)
      return e;
    const n = t.length - bs.LIMIT_BASENAME_LENGTH;
    return `${e.slice(0, -t.length)}${r[1]}${r[2].slice(0, -n)}${r[3]}`;
  }
};
process.on("exit", Ee.purgeSyncAll);
vn.default = Ee;
Object.defineProperty(Ce, "__esModule", { value: !0 });
Ce.writeFileSync = Ce.writeFile = Ce.readFileSync = Ce.readFile = void 0;
const ka = ke, ce = X, W = ir, we = _n, rc = gn, Ge = vn;
function La(e, t = ce.DEFAULT_READ_OPTIONS) {
  var r;
  if (we.default.isString(t))
    return La(e, { encoding: t });
  const n = Date.now() + ((r = t.timeout) !== null && r !== void 0 ? r : ce.DEFAULT_TIMEOUT_ASYNC);
  return W.default.readFileRetry(n)(e, t);
}
Ce.readFile = La;
function Ma(e, t = ce.DEFAULT_READ_OPTIONS) {
  var r;
  if (we.default.isString(t))
    return Ma(e, { encoding: t });
  const n = Date.now() + ((r = t.timeout) !== null && r !== void 0 ? r : ce.DEFAULT_TIMEOUT_SYNC);
  return W.default.readFileSyncRetry(n)(e, t);
}
Ce.readFileSync = Ma;
const Fa = (e, t, r, n) => {
  if (we.default.isFunction(r))
    return Fa(e, t, ce.DEFAULT_WRITE_OPTIONS, r);
  const s = Ua(e, t, r);
  return n && s.then(n, n), s;
};
Ce.writeFile = Fa;
const Ua = async (e, t, r = ce.DEFAULT_WRITE_OPTIONS) => {
  var n;
  if (we.default.isString(r))
    return Ua(e, t, { encoding: r });
  const s = Date.now() + ((n = r.timeout) !== null && n !== void 0 ? n : ce.DEFAULT_TIMEOUT_ASYNC);
  let a = null, o = null, l = null, i = null, f = null;
  try {
    r.schedule && (a = await r.schedule(e)), o = await rc.default.schedule(e), e = await W.default.realpathAttempt(e) || e, [i, l] = Ge.default.get(e, r.tmpCreate || Ge.default.create, r.tmpPurge !== !1);
    const c = ce.IS_POSIX && we.default.isUndefined(r.chown), h = we.default.isUndefined(r.mode);
    if (c || h) {
      const _ = await W.default.statAttempt(e);
      _ && (r = { ...r }, c && (r.chown = { uid: _.uid, gid: _.gid }), h && (r.mode = _.mode));
    }
    const P = ka.dirname(e);
    await W.default.mkdirAttempt(P, {
      mode: ce.DEFAULT_FOLDER_MODE,
      recursive: !0
    }), f = await W.default.openRetry(s)(i, "w", r.mode || ce.DEFAULT_FILE_MODE), r.tmpCreated && r.tmpCreated(i), we.default.isString(t) ? await W.default.writeRetry(s)(f, t, 0, r.encoding || ce.DEFAULT_ENCODING) : we.default.isUndefined(t) || await W.default.writeRetry(s)(f, t, 0, t.length, 0), r.fsync !== !1 && (r.fsyncWait !== !1 ? await W.default.fsyncRetry(s)(f) : W.default.fsyncAttempt(f)), await W.default.closeRetry(s)(f), f = null, r.chown && await W.default.chownAttempt(i, r.chown.uid, r.chown.gid), r.mode && await W.default.chmodAttempt(i, r.mode);
    try {
      await W.default.renameRetry(s)(i, e);
    } catch (_) {
      if (_.code !== "ENAMETOOLONG")
        throw _;
      await W.default.renameRetry(s)(i, Ge.default.truncate(e));
    }
    l(), i = null;
  } finally {
    f && await W.default.closeAttempt(f), i && Ge.default.purge(i), a && a(), o && o();
  }
}, za = (e, t, r = ce.DEFAULT_WRITE_OPTIONS) => {
  var n;
  if (we.default.isString(r))
    return za(e, t, { encoding: r });
  const s = Date.now() + ((n = r.timeout) !== null && n !== void 0 ? n : ce.DEFAULT_TIMEOUT_SYNC);
  let a = null, o = null, l = null;
  try {
    e = W.default.realpathSyncAttempt(e) || e, [o, a] = Ge.default.get(e, r.tmpCreate || Ge.default.create, r.tmpPurge !== !1);
    const i = ce.IS_POSIX && we.default.isUndefined(r.chown), f = we.default.isUndefined(r.mode);
    if (i || f) {
      const h = W.default.statSyncAttempt(e);
      h && (r = { ...r }, i && (r.chown = { uid: h.uid, gid: h.gid }), f && (r.mode = h.mode));
    }
    const c = ka.dirname(e);
    W.default.mkdirSyncAttempt(c, {
      mode: ce.DEFAULT_FOLDER_MODE,
      recursive: !0
    }), l = W.default.openSyncRetry(s)(o, "w", r.mode || ce.DEFAULT_FILE_MODE), r.tmpCreated && r.tmpCreated(o), we.default.isString(t) ? W.default.writeSyncRetry(s)(l, t, 0, r.encoding || ce.DEFAULT_ENCODING) : we.default.isUndefined(t) || W.default.writeSyncRetry(s)(l, t, 0, t.length, 0), r.fsync !== !1 && (r.fsyncWait !== !1 ? W.default.fsyncSyncRetry(s)(l) : W.default.fsyncAttempt(l)), W.default.closeSyncRetry(s)(l), l = null, r.chown && W.default.chownSyncAttempt(o, r.chown.uid, r.chown.gid), r.mode && W.default.chmodSyncAttempt(o, r.mode);
    try {
      W.default.renameSyncRetry(s)(o, e);
    } catch (h) {
      if (h.code !== "ENAMETOOLONG")
        throw h;
      W.default.renameSyncRetry(s)(o, Ge.default.truncate(e));
    }
    a(), o = null;
  } finally {
    l && W.default.closeSyncAttempt(l), o && Ge.default.purge(o);
  }
};
Ce.writeFileSync = za;
var Xr = { exports: {} }, Va = {}, Oe = {}, ht = {}, Tt = {}, z = {}, Nt = {};
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.regexpCode = e.getEsmExportName = e.getProperty = e.safeStringify = e.stringify = e.strConcat = e.addCodeArg = e.str = e._ = e.nil = e._Code = e.Name = e.IDENTIFIER = e._CodeOrName = void 0;
  class t {
  }
  e._CodeOrName = t, e.IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i;
  class r extends t {
    constructor(b) {
      if (super(), !e.IDENTIFIER.test(b))
        throw new Error("CodeGen: name must be a valid identifier");
      this.str = b;
    }
    toString() {
      return this.str;
    }
    emptyStr() {
      return !1;
    }
    get names() {
      return { [this.str]: 1 };
    }
  }
  e.Name = r;
  class n extends t {
    constructor(b) {
      super(), this._items = typeof b == "string" ? [b] : b;
    }
    toString() {
      return this.str;
    }
    emptyStr() {
      if (this._items.length > 1)
        return !1;
      const b = this._items[0];
      return b === "" || b === '""';
    }
    get str() {
      var b;
      return (b = this._str) !== null && b !== void 0 ? b : this._str = this._items.reduce((I, T) => `${I}${T}`, "");
    }
    get names() {
      var b;
      return (b = this._names) !== null && b !== void 0 ? b : this._names = this._items.reduce((I, T) => (T instanceof r && (I[T.str] = (I[T.str] || 0) + 1), I), {});
    }
  }
  e._Code = n, e.nil = new n("");
  function s(y, ...b) {
    const I = [y[0]];
    let T = 0;
    for (; T < b.length; )
      l(I, b[T]), I.push(y[++T]);
    return new n(I);
  }
  e._ = s;
  const a = new n("+");
  function o(y, ...b) {
    const I = [_(y[0])];
    let T = 0;
    for (; T < b.length; )
      I.push(a), l(I, b[T]), I.push(a, _(y[++T]));
    return i(I), new n(I);
  }
  e.str = o;
  function l(y, b) {
    b instanceof n ? y.push(...b._items) : b instanceof r ? y.push(b) : y.push(h(b));
  }
  e.addCodeArg = l;
  function i(y) {
    let b = 1;
    for (; b < y.length - 1; ) {
      if (y[b] === a) {
        const I = f(y[b - 1], y[b + 1]);
        if (I !== void 0) {
          y.splice(b - 1, 3, I);
          continue;
        }
        y[b++] = "+";
      }
      b++;
    }
  }
  function f(y, b) {
    if (b === '""')
      return y;
    if (y === '""')
      return b;
    if (typeof y == "string")
      return b instanceof r || y[y.length - 1] !== '"' ? void 0 : typeof b != "string" ? `${y.slice(0, -1)}${b}"` : b[0] === '"' ? y.slice(0, -1) + b.slice(1) : void 0;
    if (typeof b == "string" && b[0] === '"' && !(y instanceof r))
      return `"${y}${b.slice(1)}`;
  }
  function c(y, b) {
    return b.emptyStr() ? y : y.emptyStr() ? b : o`${y}${b}`;
  }
  e.strConcat = c;
  function h(y) {
    return typeof y == "number" || typeof y == "boolean" || y === null ? y : _(Array.isArray(y) ? y.join(",") : y);
  }
  function P(y) {
    return new n(_(y));
  }
  e.stringify = P;
  function _(y) {
    return JSON.stringify(y).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  }
  e.safeStringify = _;
  function R(y) {
    return typeof y == "string" && e.IDENTIFIER.test(y) ? new n(`.${y}`) : s`[${y}]`;
  }
  e.getProperty = R;
  function v(y) {
    if (typeof y == "string" && e.IDENTIFIER.test(y))
      return new n(`${y}`);
    throw new Error(`CodeGen: invalid export name: ${y}, use explicit $id name mapping`);
  }
  e.getEsmExportName = v;
  function w(y) {
    return new n(y.toString());
  }
  e.regexpCode = w;
})(Nt);
var Br = {};
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.ValueScope = e.ValueScopeName = e.Scope = e.varKinds = e.UsedValueState = void 0;
  const t = Nt;
  class r extends Error {
    constructor(f) {
      super(`CodeGen: "code" for ${f} not defined`), this.value = f.value;
    }
  }
  var n;
  (function(i) {
    i[i.Started = 0] = "Started", i[i.Completed = 1] = "Completed";
  })(n || (e.UsedValueState = n = {})), e.varKinds = {
    const: new t.Name("const"),
    let: new t.Name("let"),
    var: new t.Name("var")
  };
  class s {
    constructor({ prefixes: f, parent: c } = {}) {
      this._names = {}, this._prefixes = f, this._parent = c;
    }
    toName(f) {
      return f instanceof t.Name ? f : this.name(f);
    }
    name(f) {
      return new t.Name(this._newName(f));
    }
    _newName(f) {
      const c = this._names[f] || this._nameGroup(f);
      return `${f}${c.index++}`;
    }
    _nameGroup(f) {
      var c, h;
      if (!((h = (c = this._parent) === null || c === void 0 ? void 0 : c._prefixes) === null || h === void 0) && h.has(f) || this._prefixes && !this._prefixes.has(f))
        throw new Error(`CodeGen: prefix "${f}" is not allowed in this scope`);
      return this._names[f] = { prefix: f, index: 0 };
    }
  }
  e.Scope = s;
  class a extends t.Name {
    constructor(f, c) {
      super(c), this.prefix = f;
    }
    setValue(f, { property: c, itemIndex: h }) {
      this.value = f, this.scopePath = (0, t._)`.${new t.Name(c)}[${h}]`;
    }
  }
  e.ValueScopeName = a;
  const o = (0, t._)`\n`;
  class l extends s {
    constructor(f) {
      super(f), this._values = {}, this._scope = f.scope, this.opts = { ...f, _n: f.lines ? o : t.nil };
    }
    get() {
      return this._scope;
    }
    name(f) {
      return new a(f, this._newName(f));
    }
    value(f, c) {
      var h;
      if (c.ref === void 0)
        throw new Error("CodeGen: ref must be passed in value");
      const P = this.toName(f), { prefix: _ } = P, R = (h = c.key) !== null && h !== void 0 ? h : c.ref;
      let v = this._values[_];
      if (v) {
        const b = v.get(R);
        if (b)
          return b;
      } else
        v = this._values[_] = /* @__PURE__ */ new Map();
      v.set(R, P);
      const w = this._scope[_] || (this._scope[_] = []), y = w.length;
      return w[y] = c.ref, P.setValue(c, { property: _, itemIndex: y }), P;
    }
    getValue(f, c) {
      const h = this._values[f];
      if (h)
        return h.get(c);
    }
    scopeRefs(f, c = this._values) {
      return this._reduceValues(c, (h) => {
        if (h.scopePath === void 0)
          throw new Error(`CodeGen: name "${h}" has no value`);
        return (0, t._)`${f}${h.scopePath}`;
      });
    }
    scopeCode(f = this._values, c, h) {
      return this._reduceValues(f, (P) => {
        if (P.value === void 0)
          throw new Error(`CodeGen: name "${P}" has no value`);
        return P.value.code;
      }, c, h);
    }
    _reduceValues(f, c, h = {}, P) {
      let _ = t.nil;
      for (const R in f) {
        const v = f[R];
        if (!v)
          continue;
        const w = h[R] = h[R] || /* @__PURE__ */ new Map();
        v.forEach((y) => {
          if (w.has(y))
            return;
          w.set(y, n.Started);
          let b = c(y);
          if (b) {
            const I = this.opts.es5 ? e.varKinds.var : e.varKinds.const;
            _ = (0, t._)`${_}${I} ${y} = ${b};${this.opts._n}`;
          } else if (b = P == null ? void 0 : P(y))
            _ = (0, t._)`${_}${b}${this.opts._n}`;
          else
            throw new r(y);
          w.set(y, n.Completed);
        });
      }
      return _;
    }
  }
  e.ValueScope = l;
})(Br);
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.or = e.and = e.not = e.CodeGen = e.operators = e.varKinds = e.ValueScopeName = e.ValueScope = e.Scope = e.Name = e.regexpCode = e.stringify = e.getProperty = e.nil = e.strConcat = e.str = e._ = void 0;
  const t = Nt, r = Br;
  var n = Nt;
  Object.defineProperty(e, "_", { enumerable: !0, get: function() {
    return n._;
  } }), Object.defineProperty(e, "str", { enumerable: !0, get: function() {
    return n.str;
  } }), Object.defineProperty(e, "strConcat", { enumerable: !0, get: function() {
    return n.strConcat;
  } }), Object.defineProperty(e, "nil", { enumerable: !0, get: function() {
    return n.nil;
  } }), Object.defineProperty(e, "getProperty", { enumerable: !0, get: function() {
    return n.getProperty;
  } }), Object.defineProperty(e, "stringify", { enumerable: !0, get: function() {
    return n.stringify;
  } }), Object.defineProperty(e, "regexpCode", { enumerable: !0, get: function() {
    return n.regexpCode;
  } }), Object.defineProperty(e, "Name", { enumerable: !0, get: function() {
    return n.Name;
  } });
  var s = Br;
  Object.defineProperty(e, "Scope", { enumerable: !0, get: function() {
    return s.Scope;
  } }), Object.defineProperty(e, "ValueScope", { enumerable: !0, get: function() {
    return s.ValueScope;
  } }), Object.defineProperty(e, "ValueScopeName", { enumerable: !0, get: function() {
    return s.ValueScopeName;
  } }), Object.defineProperty(e, "varKinds", { enumerable: !0, get: function() {
    return s.varKinds;
  } }), e.operators = {
    GT: new t._Code(">"),
    GTE: new t._Code(">="),
    LT: new t._Code("<"),
    LTE: new t._Code("<="),
    EQ: new t._Code("==="),
    NEQ: new t._Code("!=="),
    NOT: new t._Code("!"),
    OR: new t._Code("||"),
    AND: new t._Code("&&"),
    ADD: new t._Code("+")
  };
  class a {
    optimizeNodes() {
      return this;
    }
    optimizeNames(u, d) {
      return this;
    }
  }
  class o extends a {
    constructor(u, d, S) {
      super(), this.varKind = u, this.name = d, this.rhs = S;
    }
    render({ es5: u, _n: d }) {
      const S = u ? r.varKinds.var : this.varKind, C = this.rhs === void 0 ? "" : ` = ${this.rhs}`;
      return `${S} ${this.name}${C};` + d;
    }
    optimizeNames(u, d) {
      if (u[this.name.str])
        return this.rhs && (this.rhs = re(this.rhs, u, d)), this;
    }
    get names() {
      return this.rhs instanceof t._CodeOrName ? this.rhs.names : {};
    }
  }
  class l extends a {
    constructor(u, d, S) {
      super(), this.lhs = u, this.rhs = d, this.sideEffects = S;
    }
    render({ _n: u }) {
      return `${this.lhs} = ${this.rhs};` + u;
    }
    optimizeNames(u, d) {
      if (!(this.lhs instanceof t.Name && !u[this.lhs.str] && !this.sideEffects))
        return this.rhs = re(this.rhs, u, d), this;
    }
    get names() {
      const u = this.lhs instanceof t.Name ? {} : { ...this.lhs.names };
      return se(u, this.rhs);
    }
  }
  class i extends l {
    constructor(u, d, S, C) {
      super(u, S, C), this.op = d;
    }
    render({ _n: u }) {
      return `${this.lhs} ${this.op}= ${this.rhs};` + u;
    }
  }
  class f extends a {
    constructor(u) {
      super(), this.label = u, this.names = {};
    }
    render({ _n: u }) {
      return `${this.label}:` + u;
    }
  }
  class c extends a {
    constructor(u) {
      super(), this.label = u, this.names = {};
    }
    render({ _n: u }) {
      return `break${this.label ? ` ${this.label}` : ""};` + u;
    }
  }
  class h extends a {
    constructor(u) {
      super(), this.error = u;
    }
    render({ _n: u }) {
      return `throw ${this.error};` + u;
    }
    get names() {
      return this.error.names;
    }
  }
  class P extends a {
    constructor(u) {
      super(), this.code = u;
    }
    render({ _n: u }) {
      return `${this.code};` + u;
    }
    optimizeNodes() {
      return `${this.code}` ? this : void 0;
    }
    optimizeNames(u, d) {
      return this.code = re(this.code, u, d), this;
    }
    get names() {
      return this.code instanceof t._CodeOrName ? this.code.names : {};
    }
  }
  class _ extends a {
    constructor(u = []) {
      super(), this.nodes = u;
    }
    render(u) {
      return this.nodes.reduce((d, S) => d + S.render(u), "");
    }
    optimizeNodes() {
      const { nodes: u } = this;
      let d = u.length;
      for (; d--; ) {
        const S = u[d].optimizeNodes();
        Array.isArray(S) ? u.splice(d, 1, ...S) : S ? u[d] = S : u.splice(d, 1);
      }
      return u.length > 0 ? this : void 0;
    }
    optimizeNames(u, d) {
      const { nodes: S } = this;
      let C = S.length;
      for (; C--; ) {
        const j = S[C];
        j.optimizeNames(u, d) || (ue(u, j.names), S.splice(C, 1));
      }
      return S.length > 0 ? this : void 0;
    }
    get names() {
      return this.nodes.reduce((u, d) => x(u, d.names), {});
    }
  }
  class R extends _ {
    render(u) {
      return "{" + u._n + super.render(u) + "}" + u._n;
    }
  }
  class v extends _ {
  }
  class w extends R {
  }
  w.kind = "else";
  class y extends R {
    constructor(u, d) {
      super(d), this.condition = u;
    }
    render(u) {
      let d = `if(${this.condition})` + super.render(u);
      return this.else && (d += "else " + this.else.render(u)), d;
    }
    optimizeNodes() {
      super.optimizeNodes();
      const u = this.condition;
      if (u === !0)
        return this.nodes;
      let d = this.else;
      if (d) {
        const S = d.optimizeNodes();
        d = this.else = Array.isArray(S) ? new w(S) : S;
      }
      if (d)
        return u === !1 ? d instanceof y ? d : d.nodes : this.nodes.length ? this : new y(Te(u), d instanceof y ? [d] : d.nodes);
      if (!(u === !1 || !this.nodes.length))
        return this;
    }
    optimizeNames(u, d) {
      var S;
      if (this.else = (S = this.else) === null || S === void 0 ? void 0 : S.optimizeNames(u, d), !!(super.optimizeNames(u, d) || this.else))
        return this.condition = re(this.condition, u, d), this;
    }
    get names() {
      const u = super.names;
      return se(u, this.condition), this.else && x(u, this.else.names), u;
    }
  }
  y.kind = "if";
  class b extends R {
  }
  b.kind = "for";
  class I extends b {
    constructor(u) {
      super(), this.iteration = u;
    }
    render(u) {
      return `for(${this.iteration})` + super.render(u);
    }
    optimizeNames(u, d) {
      if (super.optimizeNames(u, d))
        return this.iteration = re(this.iteration, u, d), this;
    }
    get names() {
      return x(super.names, this.iteration.names);
    }
  }
  class T extends b {
    constructor(u, d, S, C) {
      super(), this.varKind = u, this.name = d, this.from = S, this.to = C;
    }
    render(u) {
      const d = u.es5 ? r.varKinds.var : this.varKind, { name: S, from: C, to: j } = this;
      return `for(${d} ${S}=${C}; ${S}<${j}; ${S}++)` + super.render(u);
    }
    get names() {
      const u = se(super.names, this.from);
      return se(u, this.to);
    }
  }
  class A extends b {
    constructor(u, d, S, C) {
      super(), this.loop = u, this.varKind = d, this.name = S, this.iterable = C;
    }
    render(u) {
      return `for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})` + super.render(u);
    }
    optimizeNames(u, d) {
      if (super.optimizeNames(u, d))
        return this.iterable = re(this.iterable, u, d), this;
    }
    get names() {
      return x(super.names, this.iterable.names);
    }
  }
  class G extends R {
    constructor(u, d, S) {
      super(), this.name = u, this.args = d, this.async = S;
    }
    render(u) {
      return `${this.async ? "async " : ""}function ${this.name}(${this.args})` + super.render(u);
    }
  }
  G.kind = "func";
  class K extends _ {
    render(u) {
      return "return " + super.render(u);
    }
  }
  K.kind = "return";
  class he extends R {
    render(u) {
      let d = "try" + super.render(u);
      return this.catch && (d += this.catch.render(u)), this.finally && (d += this.finally.render(u)), d;
    }
    optimizeNodes() {
      var u, d;
      return super.optimizeNodes(), (u = this.catch) === null || u === void 0 || u.optimizeNodes(), (d = this.finally) === null || d === void 0 || d.optimizeNodes(), this;
    }
    optimizeNames(u, d) {
      var S, C;
      return super.optimizeNames(u, d), (S = this.catch) === null || S === void 0 || S.optimizeNames(u, d), (C = this.finally) === null || C === void 0 || C.optimizeNames(u, d), this;
    }
    get names() {
      const u = super.names;
      return this.catch && x(u, this.catch.names), this.finally && x(u, this.finally.names), u;
    }
  }
  class L extends R {
    constructor(u) {
      super(), this.error = u;
    }
    render(u) {
      return `catch(${this.error})` + super.render(u);
    }
  }
  L.kind = "catch";
  class F extends R {
    render(u) {
      return "finally" + super.render(u);
    }
  }
  F.kind = "finally";
  class Z {
    constructor(u, d = {}) {
      this._values = {}, this._blockStarts = [], this._constants = {}, this.opts = { ...d, _n: d.lines ? `
` : "" }, this._extScope = u, this._scope = new r.Scope({ parent: u }), this._nodes = [new v()];
    }
    toString() {
      return this._root.render(this.opts);
    }
    // returns unique name in the internal scope
    name(u) {
      return this._scope.name(u);
    }
    // reserves unique name in the external scope
    scopeName(u) {
      return this._extScope.name(u);
    }
    // reserves unique name in the external scope and assigns value to it
    scopeValue(u, d) {
      const S = this._extScope.value(u, d);
      return (this._values[S.prefix] || (this._values[S.prefix] = /* @__PURE__ */ new Set())).add(S), S;
    }
    getScopeValue(u, d) {
      return this._extScope.getValue(u, d);
    }
    // return code that assigns values in the external scope to the names that are used internally
    // (same names that were returned by gen.scopeName or gen.scopeValue)
    scopeRefs(u) {
      return this._extScope.scopeRefs(u, this._values);
    }
    scopeCode() {
      return this._extScope.scopeCode(this._values);
    }
    _def(u, d, S, C) {
      const j = this._scope.toName(d);
      return S !== void 0 && C && (this._constants[j.str] = S), this._leafNode(new o(u, j, S)), j;
    }
    // `const` declaration (`var` in es5 mode)
    const(u, d, S) {
      return this._def(r.varKinds.const, u, d, S);
    }
    // `let` declaration with optional assignment (`var` in es5 mode)
    let(u, d, S) {
      return this._def(r.varKinds.let, u, d, S);
    }
    // `var` declaration with optional assignment
    var(u, d, S) {
      return this._def(r.varKinds.var, u, d, S);
    }
    // assignment code
    assign(u, d, S) {
      return this._leafNode(new l(u, d, S));
    }
    // `+=` code
    add(u, d) {
      return this._leafNode(new i(u, e.operators.ADD, d));
    }
    // appends passed SafeExpr to code or executes Block
    code(u) {
      return typeof u == "function" ? u() : u !== t.nil && this._leafNode(new P(u)), this;
    }
    // returns code for object literal for the passed argument list of key-value pairs
    object(...u) {
      const d = ["{"];
      for (const [S, C] of u)
        d.length > 1 && d.push(","), d.push(S), (S !== C || this.opts.es5) && (d.push(":"), (0, t.addCodeArg)(d, C));
      return d.push("}"), new t._Code(d);
    }
    // `if` clause (or statement if `thenBody` and, optionally, `elseBody` are passed)
    if(u, d, S) {
      if (this._blockNode(new y(u)), d && S)
        this.code(d).else().code(S).endIf();
      else if (d)
        this.code(d).endIf();
      else if (S)
        throw new Error('CodeGen: "else" body without "then" body');
      return this;
    }
    // `else if` clause - invalid without `if` or after `else` clauses
    elseIf(u) {
      return this._elseNode(new y(u));
    }
    // `else` clause - only valid after `if` or `else if` clauses
    else() {
      return this._elseNode(new w());
    }
    // end `if` statement (needed if gen.if was used only with condition)
    endIf() {
      return this._endBlockNode(y, w);
    }
    _for(u, d) {
      return this._blockNode(u), d && this.code(d).endFor(), this;
    }
    // a generic `for` clause (or statement if `forBody` is passed)
    for(u, d) {
      return this._for(new I(u), d);
    }
    // `for` statement for a range of values
    forRange(u, d, S, C, j = this.opts.es5 ? r.varKinds.var : r.varKinds.let) {
      const q = this._scope.toName(u);
      return this._for(new T(j, q, d, S), () => C(q));
    }
    // `for-of` statement (in es5 mode replace with a normal for loop)
    forOf(u, d, S, C = r.varKinds.const) {
      const j = this._scope.toName(u);
      if (this.opts.es5) {
        const q = d instanceof t.Name ? d : this.var("_arr", d);
        return this.forRange("_i", 0, (0, t._)`${q}.length`, (H) => {
          this.var(j, (0, t._)`${q}[${H}]`), S(j);
        });
      }
      return this._for(new A("of", C, j, d), () => S(j));
    }
    // `for-in` statement.
    // With option `ownProperties` replaced with a `for-of` loop for object keys
    forIn(u, d, S, C = this.opts.es5 ? r.varKinds.var : r.varKinds.const) {
      if (this.opts.ownProperties)
        return this.forOf(u, (0, t._)`Object.keys(${d})`, S);
      const j = this._scope.toName(u);
      return this._for(new A("in", C, j, d), () => S(j));
    }
    // end `for` loop
    endFor() {
      return this._endBlockNode(b);
    }
    // `label` statement
    label(u) {
      return this._leafNode(new f(u));
    }
    // `break` statement
    break(u) {
      return this._leafNode(new c(u));
    }
    // `return` statement
    return(u) {
      const d = new K();
      if (this._blockNode(d), this.code(u), d.nodes.length !== 1)
        throw new Error('CodeGen: "return" should have one node');
      return this._endBlockNode(K);
    }
    // `try` statement
    try(u, d, S) {
      if (!d && !S)
        throw new Error('CodeGen: "try" without "catch" and "finally"');
      const C = new he();
      if (this._blockNode(C), this.code(u), d) {
        const j = this.name("e");
        this._currNode = C.catch = new L(j), d(j);
      }
      return S && (this._currNode = C.finally = new F(), this.code(S)), this._endBlockNode(L, F);
    }
    // `throw` statement
    throw(u) {
      return this._leafNode(new h(u));
    }
    // start self-balancing block
    block(u, d) {
      return this._blockStarts.push(this._nodes.length), u && this.code(u).endBlock(d), this;
    }
    // end the current self-balancing block
    endBlock(u) {
      const d = this._blockStarts.pop();
      if (d === void 0)
        throw new Error("CodeGen: not in self-balancing block");
      const S = this._nodes.length - d;
      if (S < 0 || u !== void 0 && S !== u)
        throw new Error(`CodeGen: wrong number of nodes: ${S} vs ${u} expected`);
      return this._nodes.length = d, this;
    }
    // `function` heading (or definition if funcBody is passed)
    func(u, d = t.nil, S, C) {
      return this._blockNode(new G(u, d, S)), C && this.code(C).endFunc(), this;
    }
    // end function definition
    endFunc() {
      return this._endBlockNode(G);
    }
    optimize(u = 1) {
      for (; u-- > 0; )
        this._root.optimizeNodes(), this._root.optimizeNames(this._root.names, this._constants);
    }
    _leafNode(u) {
      return this._currNode.nodes.push(u), this;
    }
    _blockNode(u) {
      this._currNode.nodes.push(u), this._nodes.push(u);
    }
    _endBlockNode(u, d) {
      const S = this._currNode;
      if (S instanceof u || d && S instanceof d)
        return this._nodes.pop(), this;
      throw new Error(`CodeGen: not in block "${d ? `${u.kind}/${d.kind}` : u.kind}"`);
    }
    _elseNode(u) {
      const d = this._currNode;
      if (!(d instanceof y))
        throw new Error('CodeGen: "else" without "if"');
      return this._currNode = d.else = u, this;
    }
    get _root() {
      return this._nodes[0];
    }
    get _currNode() {
      const u = this._nodes;
      return u[u.length - 1];
    }
    set _currNode(u) {
      const d = this._nodes;
      d[d.length - 1] = u;
    }
  }
  e.CodeGen = Z;
  function x($, u) {
    for (const d in u)
      $[d] = ($[d] || 0) + (u[d] || 0);
    return $;
  }
  function se($, u) {
    return u instanceof t._CodeOrName ? x($, u.names) : $;
  }
  function re($, u, d) {
    if ($ instanceof t.Name)
      return S($);
    if (!C($))
      return $;
    return new t._Code($._items.reduce((j, q) => (q instanceof t.Name && (q = S(q)), q instanceof t._Code ? j.push(...q._items) : j.push(q), j), []));
    function S(j) {
      const q = d[j.str];
      return q === void 0 || u[j.str] !== 1 ? j : (delete u[j.str], q);
    }
    function C(j) {
      return j instanceof t._Code && j._items.some((q) => q instanceof t.Name && u[q.str] === 1 && d[q.str] !== void 0);
    }
  }
  function ue($, u) {
    for (const d in u)
      $[d] = ($[d] || 0) - (u[d] || 0);
  }
  function Te($) {
    return typeof $ == "boolean" || typeof $ == "number" || $ === null ? !$ : (0, t._)`!${E($)}`;
  }
  e.not = Te;
  const N = p(e.operators.AND);
  function g(...$) {
    return $.reduce(N);
  }
  e.and = g;
  const O = p(e.operators.OR);
  function m(...$) {
    return $.reduce(O);
  }
  e.or = m;
  function p($) {
    return (u, d) => u === t.nil ? d : d === t.nil ? u : (0, t._)`${E(u)} ${$} ${E(d)}`;
  }
  function E($) {
    return $ instanceof t.Name ? $ : (0, t._)`(${$})`;
  }
})(z);
var D = {};
Object.defineProperty(D, "__esModule", { value: !0 });
D.checkStrictMode = D.getErrorPath = D.Type = D.useFunc = D.setEvaluated = D.evaluatedPropsToName = D.mergeEvaluated = D.eachItem = D.unescapeJsonPointer = D.escapeJsonPointer = D.escapeFragment = D.unescapeFragment = D.schemaRefOrVal = D.schemaHasRulesButRef = D.schemaHasRules = D.checkUnknownRules = D.alwaysValidSchema = D.toHash = void 0;
const Y = z, nc = Nt;
function sc(e) {
  const t = {};
  for (const r of e)
    t[r] = !0;
  return t;
}
D.toHash = sc;
function ac(e, t) {
  return typeof t == "boolean" ? t : Object.keys(t).length === 0 ? !0 : (qa(e, t), !Ga(t, e.self.RULES.all));
}
D.alwaysValidSchema = ac;
function qa(e, t = e.schema) {
  const { opts: r, self: n } = e;
  if (!r.strictSchema || typeof t == "boolean")
    return;
  const s = n.RULES.keywords;
  for (const a in t)
    s[a] || xa(e, `unknown keyword: "${a}"`);
}
D.checkUnknownRules = qa;
function Ga(e, t) {
  if (typeof e == "boolean")
    return !e;
  for (const r in e)
    if (t[r])
      return !0;
  return !1;
}
D.schemaHasRules = Ga;
function oc(e, t) {
  if (typeof e == "boolean")
    return !e;
  for (const r in e)
    if (r !== "$ref" && t.all[r])
      return !0;
  return !1;
}
D.schemaHasRulesButRef = oc;
function ic({ topSchemaRef: e, schemaPath: t }, r, n, s) {
  if (!s) {
    if (typeof r == "number" || typeof r == "boolean")
      return r;
    if (typeof r == "string")
      return (0, Y._)`${r}`;
  }
  return (0, Y._)`${e}${t}${(0, Y.getProperty)(n)}`;
}
D.schemaRefOrVal = ic;
function cc(e) {
  return Ha(decodeURIComponent(e));
}
D.unescapeFragment = cc;
function lc(e) {
  return encodeURIComponent(En(e));
}
D.escapeFragment = lc;
function En(e) {
  return typeof e == "number" ? `${e}` : e.replace(/~/g, "~0").replace(/\//g, "~1");
}
D.escapeJsonPointer = En;
function Ha(e) {
  return e.replace(/~1/g, "/").replace(/~0/g, "~");
}
D.unescapeJsonPointer = Ha;
function uc(e, t) {
  if (Array.isArray(e))
    for (const r of e)
      t(r);
  else
    t(e);
}
D.eachItem = uc;
function Rs({ mergeNames: e, mergeToName: t, mergeValues: r, resultToName: n }) {
  return (s, a, o, l) => {
    const i = o === void 0 ? a : o instanceof Y.Name ? (a instanceof Y.Name ? e(s, a, o) : t(s, a, o), o) : a instanceof Y.Name ? (t(s, o, a), a) : r(a, o);
    return l === Y.Name && !(i instanceof Y.Name) ? n(s, i) : i;
  };
}
D.mergeEvaluated = {
  props: Rs({
    mergeNames: (e, t, r) => e.if((0, Y._)`${r} !== true && ${t} !== undefined`, () => {
      e.if((0, Y._)`${t} === true`, () => e.assign(r, !0), () => e.assign(r, (0, Y._)`${r} || {}`).code((0, Y._)`Object.assign(${r}, ${t})`));
    }),
    mergeToName: (e, t, r) => e.if((0, Y._)`${r} !== true`, () => {
      t === !0 ? e.assign(r, !0) : (e.assign(r, (0, Y._)`${r} || {}`), wn(e, r, t));
    }),
    mergeValues: (e, t) => e === !0 ? !0 : { ...e, ...t },
    resultToName: Ka
  }),
  items: Rs({
    mergeNames: (e, t, r) => e.if((0, Y._)`${r} !== true && ${t} !== undefined`, () => e.assign(r, (0, Y._)`${t} === true ? true : ${r} > ${t} ? ${r} : ${t}`)),
    mergeToName: (e, t, r) => e.if((0, Y._)`${r} !== true`, () => e.assign(r, t === !0 ? !0 : (0, Y._)`${r} > ${t} ? ${r} : ${t}`)),
    mergeValues: (e, t) => e === !0 ? !0 : Math.max(e, t),
    resultToName: (e, t) => e.var("items", t)
  })
};
function Ka(e, t) {
  if (t === !0)
    return e.var("props", !0);
  const r = e.var("props", (0, Y._)`{}`);
  return t !== void 0 && wn(e, r, t), r;
}
D.evaluatedPropsToName = Ka;
function wn(e, t, r) {
  Object.keys(r).forEach((n) => e.assign((0, Y._)`${t}${(0, Y.getProperty)(n)}`, !0));
}
D.setEvaluated = wn;
const Os = {};
function fc(e, t) {
  return e.scopeValue("func", {
    ref: t,
    code: Os[t.code] || (Os[t.code] = new nc._Code(t.code))
  });
}
D.useFunc = fc;
var Yr;
(function(e) {
  e[e.Num = 0] = "Num", e[e.Str = 1] = "Str";
})(Yr || (D.Type = Yr = {}));
function dc(e, t, r) {
  if (e instanceof Y.Name) {
    const n = t === Yr.Num;
    return r ? n ? (0, Y._)`"[" + ${e} + "]"` : (0, Y._)`"['" + ${e} + "']"` : n ? (0, Y._)`"/" + ${e}` : (0, Y._)`"/" + ${e}.replace(/~/g, "~0").replace(/\\//g, "~1")`;
  }
  return r ? (0, Y.getProperty)(e).toString() : "/" + En(e);
}
D.getErrorPath = dc;
function xa(e, t, r = e.opts.strictSchema) {
  if (r) {
    if (t = `strict mode: ${t}`, r === !0)
      throw new Error(t);
    e.self.logger.warn(t);
  }
}
D.checkStrictMode = xa;
var Le = {};
Object.defineProperty(Le, "__esModule", { value: !0 });
const fe = z, hc = {
  // validation function arguments
  data: new fe.Name("data"),
  // data passed to validation function
  // args passed from referencing schema
  valCxt: new fe.Name("valCxt"),
  // validation/data context - should not be used directly, it is destructured to the names below
  instancePath: new fe.Name("instancePath"),
  parentData: new fe.Name("parentData"),
  parentDataProperty: new fe.Name("parentDataProperty"),
  rootData: new fe.Name("rootData"),
  // root data - same as the data passed to the first/top validation function
  dynamicAnchors: new fe.Name("dynamicAnchors"),
  // used to support recursiveRef and dynamicRef
  // function scoped variables
  vErrors: new fe.Name("vErrors"),
  // null or array of validation errors
  errors: new fe.Name("errors"),
  // counter of validation errors
  this: new fe.Name("this"),
  // "globals"
  self: new fe.Name("self"),
  scope: new fe.Name("scope"),
  // JTD serialize/parse name for JSON string and position
  json: new fe.Name("json"),
  jsonPos: new fe.Name("jsonPos"),
  jsonLen: new fe.Name("jsonLen"),
  jsonPart: new fe.Name("jsonPart")
};
Le.default = hc;
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.extendErrors = e.resetErrorsCount = e.reportExtraError = e.reportError = e.keyword$DataError = e.keywordError = void 0;
  const t = z, r = D, n = Le;
  e.keywordError = {
    message: ({ keyword: w }) => (0, t.str)`must pass "${w}" keyword validation`
  }, e.keyword$DataError = {
    message: ({ keyword: w, schemaType: y }) => y ? (0, t.str)`"${w}" keyword must be ${y} ($data)` : (0, t.str)`"${w}" keyword is invalid ($data)`
  };
  function s(w, y = e.keywordError, b, I) {
    const { it: T } = w, { gen: A, compositeRule: G, allErrors: K } = T, he = h(w, y, b);
    I ?? (G || K) ? i(A, he) : f(T, (0, t._)`[${he}]`);
  }
  e.reportError = s;
  function a(w, y = e.keywordError, b) {
    const { it: I } = w, { gen: T, compositeRule: A, allErrors: G } = I, K = h(w, y, b);
    i(T, K), A || G || f(I, n.default.vErrors);
  }
  e.reportExtraError = a;
  function o(w, y) {
    w.assign(n.default.errors, y), w.if((0, t._)`${n.default.vErrors} !== null`, () => w.if(y, () => w.assign((0, t._)`${n.default.vErrors}.length`, y), () => w.assign(n.default.vErrors, null)));
  }
  e.resetErrorsCount = o;
  function l({ gen: w, keyword: y, schemaValue: b, data: I, errsCount: T, it: A }) {
    if (T === void 0)
      throw new Error("ajv implementation error");
    const G = w.name("err");
    w.forRange("i", T, n.default.errors, (K) => {
      w.const(G, (0, t._)`${n.default.vErrors}[${K}]`), w.if((0, t._)`${G}.instancePath === undefined`, () => w.assign((0, t._)`${G}.instancePath`, (0, t.strConcat)(n.default.instancePath, A.errorPath))), w.assign((0, t._)`${G}.schemaPath`, (0, t.str)`${A.errSchemaPath}/${y}`), A.opts.verbose && (w.assign((0, t._)`${G}.schema`, b), w.assign((0, t._)`${G}.data`, I));
    });
  }
  e.extendErrors = l;
  function i(w, y) {
    const b = w.const("err", y);
    w.if((0, t._)`${n.default.vErrors} === null`, () => w.assign(n.default.vErrors, (0, t._)`[${b}]`), (0, t._)`${n.default.vErrors}.push(${b})`), w.code((0, t._)`${n.default.errors}++`);
  }
  function f(w, y) {
    const { gen: b, validateName: I, schemaEnv: T } = w;
    T.$async ? b.throw((0, t._)`new ${w.ValidationError}(${y})`) : (b.assign((0, t._)`${I}.errors`, y), b.return(!1));
  }
  const c = {
    keyword: new t.Name("keyword"),
    schemaPath: new t.Name("schemaPath"),
    // also used in JTD errors
    params: new t.Name("params"),
    propertyName: new t.Name("propertyName"),
    message: new t.Name("message"),
    schema: new t.Name("schema"),
    parentSchema: new t.Name("parentSchema")
  };
  function h(w, y, b) {
    const { createErrors: I } = w.it;
    return I === !1 ? (0, t._)`{}` : P(w, y, b);
  }
  function P(w, y, b = {}) {
    const { gen: I, it: T } = w, A = [
      _(T, b),
      R(w, b)
    ];
    return v(w, y, A), I.object(...A);
  }
  function _({ errorPath: w }, { instancePath: y }) {
    const b = y ? (0, t.str)`${w}${(0, r.getErrorPath)(y, r.Type.Str)}` : w;
    return [n.default.instancePath, (0, t.strConcat)(n.default.instancePath, b)];
  }
  function R({ keyword: w, it: { errSchemaPath: y } }, { schemaPath: b, parentSchema: I }) {
    let T = I ? y : (0, t.str)`${y}/${w}`;
    return b && (T = (0, t.str)`${T}${(0, r.getErrorPath)(b, r.Type.Str)}`), [c.schemaPath, T];
  }
  function v(w, { params: y, message: b }, I) {
    const { keyword: T, data: A, schemaValue: G, it: K } = w, { opts: he, propertyName: L, topSchemaRef: F, schemaPath: Z } = K;
    I.push([c.keyword, T], [c.params, typeof y == "function" ? y(w) : y || (0, t._)`{}`]), he.messages && I.push([c.message, typeof b == "function" ? b(w) : b]), he.verbose && I.push([c.schema, G], [c.parentSchema, (0, t._)`${F}${Z}`], [n.default.data, A]), L && I.push([c.propertyName, L]);
  }
})(Tt);
Object.defineProperty(ht, "__esModule", { value: !0 });
ht.boolOrEmptySchema = ht.topBoolOrEmptySchema = void 0;
const pc = Tt, mc = z, yc = Le, $c = {
  message: "boolean schema is false"
};
function _c(e) {
  const { gen: t, schema: r, validateName: n } = e;
  r === !1 ? Wa(e, !1) : typeof r == "object" && r.$async === !0 ? t.return(yc.default.data) : (t.assign((0, mc._)`${n}.errors`, null), t.return(!0));
}
ht.topBoolOrEmptySchema = _c;
function gc(e, t) {
  const { gen: r, schema: n } = e;
  n === !1 ? (r.var(t, !1), Wa(e)) : r.var(t, !0);
}
ht.boolOrEmptySchema = gc;
function Wa(e, t) {
  const { gen: r, data: n } = e, s = {
    gen: r,
    keyword: "false schema",
    data: n,
    schema: !1,
    schemaCode: !1,
    schemaValue: !1,
    params: {},
    it: e
  };
  (0, pc.reportError)(s, $c, void 0, t);
}
var ne = {}, Ze = {};
Object.defineProperty(Ze, "__esModule", { value: !0 });
Ze.getRules = Ze.isJSONType = void 0;
const vc = ["string", "number", "integer", "boolean", "null", "object", "array"], Ec = new Set(vc);
function wc(e) {
  return typeof e == "string" && Ec.has(e);
}
Ze.isJSONType = wc;
function Sc() {
  const e = {
    number: { type: "number", rules: [] },
    string: { type: "string", rules: [] },
    array: { type: "array", rules: [] },
    object: { type: "object", rules: [] }
  };
  return {
    types: { ...e, integer: !0, boolean: !0, null: !0 },
    rules: [{ rules: [] }, e.number, e.string, e.array, e.object],
    post: { rules: [] },
    all: {},
    keywords: {}
  };
}
Ze.getRules = Sc;
var Me = {};
Object.defineProperty(Me, "__esModule", { value: !0 });
Me.shouldUseRule = Me.shouldUseGroup = Me.schemaHasRulesForType = void 0;
function bc({ schema: e, self: t }, r) {
  const n = t.RULES.types[r];
  return n && n !== !0 && Xa(e, n);
}
Me.schemaHasRulesForType = bc;
function Xa(e, t) {
  return t.rules.some((r) => Ba(e, r));
}
Me.shouldUseGroup = Xa;
function Ba(e, t) {
  var r;
  return e[t.keyword] !== void 0 || ((r = t.definition.implements) === null || r === void 0 ? void 0 : r.some((n) => e[n] !== void 0));
}
Me.shouldUseRule = Ba;
Object.defineProperty(ne, "__esModule", { value: !0 });
ne.reportTypeError = ne.checkDataTypes = ne.checkDataType = ne.coerceAndCheckDataType = ne.getJSONTypes = ne.getSchemaTypes = ne.DataType = void 0;
const Pc = Ze, Rc = Me, Oc = Tt, U = z, Ya = D;
var ct;
(function(e) {
  e[e.Correct = 0] = "Correct", e[e.Wrong = 1] = "Wrong";
})(ct || (ne.DataType = ct = {}));
function Ic(e) {
  const t = Ja(e.type);
  if (t.includes("null")) {
    if (e.nullable === !1)
      throw new Error("type: null contradicts nullable: false");
  } else {
    if (!t.length && e.nullable !== void 0)
      throw new Error('"nullable" cannot be used without "type"');
    e.nullable === !0 && t.push("null");
  }
  return t;
}
ne.getSchemaTypes = Ic;
function Ja(e) {
  const t = Array.isArray(e) ? e : e ? [e] : [];
  if (t.every(Pc.isJSONType))
    return t;
  throw new Error("type must be JSONType or JSONType[]: " + t.join(","));
}
ne.getJSONTypes = Ja;
function Nc(e, t) {
  const { gen: r, data: n, opts: s } = e, a = Tc(t, s.coerceTypes), o = t.length > 0 && !(a.length === 0 && t.length === 1 && (0, Rc.schemaHasRulesForType)(e, t[0]));
  if (o) {
    const l = Sn(t, n, s.strictNumbers, ct.Wrong);
    r.if(l, () => {
      a.length ? Ac(e, t, a) : bn(e);
    });
  }
  return o;
}
ne.coerceAndCheckDataType = Nc;
const Za = /* @__PURE__ */ new Set(["string", "number", "integer", "boolean", "null"]);
function Tc(e, t) {
  return t ? e.filter((r) => Za.has(r) || t === "array" && r === "array") : [];
}
function Ac(e, t, r) {
  const { gen: n, data: s, opts: a } = e, o = n.let("dataType", (0, U._)`typeof ${s}`), l = n.let("coerced", (0, U._)`undefined`);
  a.coerceTypes === "array" && n.if((0, U._)`${o} == 'object' && Array.isArray(${s}) && ${s}.length == 1`, () => n.assign(s, (0, U._)`${s}[0]`).assign(o, (0, U._)`typeof ${s}`).if(Sn(t, s, a.strictNumbers), () => n.assign(l, s))), n.if((0, U._)`${l} !== undefined`);
  for (const f of r)
    (Za.has(f) || f === "array" && a.coerceTypes === "array") && i(f);
  n.else(), bn(e), n.endIf(), n.if((0, U._)`${l} !== undefined`, () => {
    n.assign(s, l), jc(e, l);
  });
  function i(f) {
    switch (f) {
      case "string":
        n.elseIf((0, U._)`${o} == "number" || ${o} == "boolean"`).assign(l, (0, U._)`"" + ${s}`).elseIf((0, U._)`${s} === null`).assign(l, (0, U._)`""`);
        return;
      case "number":
        n.elseIf((0, U._)`${o} == "boolean" || ${s} === null
              || (${o} == "string" && ${s} && ${s} == +${s})`).assign(l, (0, U._)`+${s}`);
        return;
      case "integer":
        n.elseIf((0, U._)`${o} === "boolean" || ${s} === null
              || (${o} === "string" && ${s} && ${s} == +${s} && !(${s} % 1))`).assign(l, (0, U._)`+${s}`);
        return;
      case "boolean":
        n.elseIf((0, U._)`${s} === "false" || ${s} === 0 || ${s} === null`).assign(l, !1).elseIf((0, U._)`${s} === "true" || ${s} === 1`).assign(l, !0);
        return;
      case "null":
        n.elseIf((0, U._)`${s} === "" || ${s} === 0 || ${s} === false`), n.assign(l, null);
        return;
      case "array":
        n.elseIf((0, U._)`${o} === "string" || ${o} === "number"
              || ${o} === "boolean" || ${s} === null`).assign(l, (0, U._)`[${s}]`);
    }
  }
}
function jc({ gen: e, parentData: t, parentDataProperty: r }, n) {
  e.if((0, U._)`${t} !== undefined`, () => e.assign((0, U._)`${t}[${r}]`, n));
}
function Jr(e, t, r, n = ct.Correct) {
  const s = n === ct.Correct ? U.operators.EQ : U.operators.NEQ;
  let a;
  switch (e) {
    case "null":
      return (0, U._)`${t} ${s} null`;
    case "array":
      a = (0, U._)`Array.isArray(${t})`;
      break;
    case "object":
      a = (0, U._)`${t} && typeof ${t} == "object" && !Array.isArray(${t})`;
      break;
    case "integer":
      a = o((0, U._)`!(${t} % 1) && !isNaN(${t})`);
      break;
    case "number":
      a = o();
      break;
    default:
      return (0, U._)`typeof ${t} ${s} ${e}`;
  }
  return n === ct.Correct ? a : (0, U.not)(a);
  function o(l = U.nil) {
    return (0, U.and)((0, U._)`typeof ${t} == "number"`, l, r ? (0, U._)`isFinite(${t})` : U.nil);
  }
}
ne.checkDataType = Jr;
function Sn(e, t, r, n) {
  if (e.length === 1)
    return Jr(e[0], t, r, n);
  let s;
  const a = (0, Ya.toHash)(e);
  if (a.array && a.object) {
    const o = (0, U._)`typeof ${t} != "object"`;
    s = a.null ? o : (0, U._)`!${t} || ${o}`, delete a.null, delete a.array, delete a.object;
  } else
    s = U.nil;
  a.number && delete a.integer;
  for (const o in a)
    s = (0, U.and)(s, Jr(o, t, r, n));
  return s;
}
ne.checkDataTypes = Sn;
const Cc = {
  message: ({ schema: e }) => `must be ${e}`,
  params: ({ schema: e, schemaValue: t }) => typeof e == "string" ? (0, U._)`{type: ${e}}` : (0, U._)`{type: ${t}}`
};
function bn(e) {
  const t = Dc(e);
  (0, Oc.reportError)(t, Cc);
}
ne.reportTypeError = bn;
function Dc(e) {
  const { gen: t, data: r, schema: n } = e, s = (0, Ya.schemaRefOrVal)(e, n, "type");
  return {
    gen: t,
    keyword: "type",
    data: r,
    schema: n.type,
    schemaCode: s,
    schemaValue: s,
    parentSchema: n,
    params: {},
    it: e
  };
}
var cr = {};
Object.defineProperty(cr, "__esModule", { value: !0 });
cr.assignDefaults = void 0;
const nt = z, kc = D;
function Lc(e, t) {
  const { properties: r, items: n } = e.schema;
  if (t === "object" && r)
    for (const s in r)
      Is(e, s, r[s].default);
  else t === "array" && Array.isArray(n) && n.forEach((s, a) => Is(e, a, s.default));
}
cr.assignDefaults = Lc;
function Is(e, t, r) {
  const { gen: n, compositeRule: s, data: a, opts: o } = e;
  if (r === void 0)
    return;
  const l = (0, nt._)`${a}${(0, nt.getProperty)(t)}`;
  if (s) {
    (0, kc.checkStrictMode)(e, `default is ignored for: ${l}`);
    return;
  }
  let i = (0, nt._)`${l} === undefined`;
  o.useDefaults === "empty" && (i = (0, nt._)`${i} || ${l} === null || ${l} === ""`), n.if(i, (0, nt._)`${l} = ${(0, nt.stringify)(r)}`);
}
var De = {}, V = {};
Object.defineProperty(V, "__esModule", { value: !0 });
V.validateUnion = V.validateArray = V.usePattern = V.callValidateCode = V.schemaProperties = V.allSchemaProperties = V.noPropertyInData = V.propertyInData = V.isOwnProperty = V.hasPropFunc = V.reportMissingProp = V.checkMissingProp = V.checkReportMissingProp = void 0;
const Q = z, Pn = D, Ue = Le, Mc = D;
function Fc(e, t) {
  const { gen: r, data: n, it: s } = e;
  r.if(On(r, n, t, s.opts.ownProperties), () => {
    e.setParams({ missingProperty: (0, Q._)`${t}` }, !0), e.error();
  });
}
V.checkReportMissingProp = Fc;
function Uc({ gen: e, data: t, it: { opts: r } }, n, s) {
  return (0, Q.or)(...n.map((a) => (0, Q.and)(On(e, t, a, r.ownProperties), (0, Q._)`${s} = ${a}`)));
}
V.checkMissingProp = Uc;
function zc(e, t) {
  e.setParams({ missingProperty: t }, !0), e.error();
}
V.reportMissingProp = zc;
function Qa(e) {
  return e.scopeValue("func", {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    ref: Object.prototype.hasOwnProperty,
    code: (0, Q._)`Object.prototype.hasOwnProperty`
  });
}
V.hasPropFunc = Qa;
function Rn(e, t, r) {
  return (0, Q._)`${Qa(e)}.call(${t}, ${r})`;
}
V.isOwnProperty = Rn;
function Vc(e, t, r, n) {
  const s = (0, Q._)`${t}${(0, Q.getProperty)(r)} !== undefined`;
  return n ? (0, Q._)`${s} && ${Rn(e, t, r)}` : s;
}
V.propertyInData = Vc;
function On(e, t, r, n) {
  const s = (0, Q._)`${t}${(0, Q.getProperty)(r)} === undefined`;
  return n ? (0, Q.or)(s, (0, Q.not)(Rn(e, t, r))) : s;
}
V.noPropertyInData = On;
function eo(e) {
  return e ? Object.keys(e).filter((t) => t !== "__proto__") : [];
}
V.allSchemaProperties = eo;
function qc(e, t) {
  return eo(t).filter((r) => !(0, Pn.alwaysValidSchema)(e, t[r]));
}
V.schemaProperties = qc;
function Gc({ schemaCode: e, data: t, it: { gen: r, topSchemaRef: n, schemaPath: s, errorPath: a }, it: o }, l, i, f) {
  const c = f ? (0, Q._)`${e}, ${t}, ${n}${s}` : t, h = [
    [Ue.default.instancePath, (0, Q.strConcat)(Ue.default.instancePath, a)],
    [Ue.default.parentData, o.parentData],
    [Ue.default.parentDataProperty, o.parentDataProperty],
    [Ue.default.rootData, Ue.default.rootData]
  ];
  o.opts.dynamicRef && h.push([Ue.default.dynamicAnchors, Ue.default.dynamicAnchors]);
  const P = (0, Q._)`${c}, ${r.object(...h)}`;
  return i !== Q.nil ? (0, Q._)`${l}.call(${i}, ${P})` : (0, Q._)`${l}(${P})`;
}
V.callValidateCode = Gc;
const Hc = (0, Q._)`new RegExp`;
function Kc({ gen: e, it: { opts: t } }, r) {
  const n = t.unicodeRegExp ? "u" : "", { regExp: s } = t.code, a = s(r, n);
  return e.scopeValue("pattern", {
    key: a.toString(),
    ref: a,
    code: (0, Q._)`${s.code === "new RegExp" ? Hc : (0, Mc.useFunc)(e, s)}(${r}, ${n})`
  });
}
V.usePattern = Kc;
function xc(e) {
  const { gen: t, data: r, keyword: n, it: s } = e, a = t.name("valid");
  if (s.allErrors) {
    const l = t.let("valid", !0);
    return o(() => t.assign(l, !1)), l;
  }
  return t.var(a, !0), o(() => t.break()), a;
  function o(l) {
    const i = t.const("len", (0, Q._)`${r}.length`);
    t.forRange("i", 0, i, (f) => {
      e.subschema({
        keyword: n,
        dataProp: f,
        dataPropType: Pn.Type.Num
      }, a), t.if((0, Q.not)(a), l);
    });
  }
}
V.validateArray = xc;
function Wc(e) {
  const { gen: t, schema: r, keyword: n, it: s } = e;
  if (!Array.isArray(r))
    throw new Error("ajv implementation error");
  if (r.some((i) => (0, Pn.alwaysValidSchema)(s, i)) && !s.opts.unevaluated)
    return;
  const o = t.let("valid", !1), l = t.name("_valid");
  t.block(() => r.forEach((i, f) => {
    const c = e.subschema({
      keyword: n,
      schemaProp: f,
      compositeRule: !0
    }, l);
    t.assign(o, (0, Q._)`${o} || ${l}`), e.mergeValidEvaluated(c, l) || t.if((0, Q.not)(o));
  })), e.result(o, () => e.reset(), () => e.error(!0));
}
V.validateUnion = Wc;
Object.defineProperty(De, "__esModule", { value: !0 });
De.validateKeywordUsage = De.validSchemaType = De.funcKeywordCode = De.macroKeywordCode = void 0;
const ye = z, Be = Le, Xc = V, Bc = Tt;
function Yc(e, t) {
  const { gen: r, keyword: n, schema: s, parentSchema: a, it: o } = e, l = t.macro.call(o.self, s, a, o), i = to(r, n, l);
  o.opts.validateSchema !== !1 && o.self.validateSchema(l, !0);
  const f = r.name("valid");
  e.subschema({
    schema: l,
    schemaPath: ye.nil,
    errSchemaPath: `${o.errSchemaPath}/${n}`,
    topSchemaRef: i,
    compositeRule: !0
  }, f), e.pass(f, () => e.error(!0));
}
De.macroKeywordCode = Yc;
function Jc(e, t) {
  var r;
  const { gen: n, keyword: s, schema: a, parentSchema: o, $data: l, it: i } = e;
  Qc(i, t);
  const f = !l && t.compile ? t.compile.call(i.self, a, o, i) : t.validate, c = to(n, s, f), h = n.let("valid");
  e.block$data(h, P), e.ok((r = t.valid) !== null && r !== void 0 ? r : h);
  function P() {
    if (t.errors === !1)
      v(), t.modifying && Ns(e), w(() => e.error());
    else {
      const y = t.async ? _() : R();
      t.modifying && Ns(e), w(() => Zc(e, y));
    }
  }
  function _() {
    const y = n.let("ruleErrs", null);
    return n.try(() => v((0, ye._)`await `), (b) => n.assign(h, !1).if((0, ye._)`${b} instanceof ${i.ValidationError}`, () => n.assign(y, (0, ye._)`${b}.errors`), () => n.throw(b))), y;
  }
  function R() {
    const y = (0, ye._)`${c}.errors`;
    return n.assign(y, null), v(ye.nil), y;
  }
  function v(y = t.async ? (0, ye._)`await ` : ye.nil) {
    const b = i.opts.passContext ? Be.default.this : Be.default.self, I = !("compile" in t && !l || t.schema === !1);
    n.assign(h, (0, ye._)`${y}${(0, Xc.callValidateCode)(e, c, b, I)}`, t.modifying);
  }
  function w(y) {
    var b;
    n.if((0, ye.not)((b = t.valid) !== null && b !== void 0 ? b : h), y);
  }
}
De.funcKeywordCode = Jc;
function Ns(e) {
  const { gen: t, data: r, it: n } = e;
  t.if(n.parentData, () => t.assign(r, (0, ye._)`${n.parentData}[${n.parentDataProperty}]`));
}
function Zc(e, t) {
  const { gen: r } = e;
  r.if((0, ye._)`Array.isArray(${t})`, () => {
    r.assign(Be.default.vErrors, (0, ye._)`${Be.default.vErrors} === null ? ${t} : ${Be.default.vErrors}.concat(${t})`).assign(Be.default.errors, (0, ye._)`${Be.default.vErrors}.length`), (0, Bc.extendErrors)(e);
  }, () => e.error());
}
function Qc({ schemaEnv: e }, t) {
  if (t.async && !e.$async)
    throw new Error("async keyword in sync schema");
}
function to(e, t, r) {
  if (r === void 0)
    throw new Error(`keyword "${t}" failed to compile`);
  return e.scopeValue("keyword", typeof r == "function" ? { ref: r } : { ref: r, code: (0, ye.stringify)(r) });
}
function el(e, t, r = !1) {
  return !t.length || t.some((n) => n === "array" ? Array.isArray(e) : n === "object" ? e && typeof e == "object" && !Array.isArray(e) : typeof e == n || r && typeof e > "u");
}
De.validSchemaType = el;
function tl({ schema: e, opts: t, self: r, errSchemaPath: n }, s, a) {
  if (Array.isArray(s.keyword) ? !s.keyword.includes(a) : s.keyword !== a)
    throw new Error("ajv implementation error");
  const o = s.dependencies;
  if (o != null && o.some((l) => !Object.prototype.hasOwnProperty.call(e, l)))
    throw new Error(`parent schema must have dependencies of ${a}: ${o.join(",")}`);
  if (s.validateSchema && !s.validateSchema(e[a])) {
    const i = `keyword "${a}" value is invalid at path "${n}": ` + r.errorsText(s.validateSchema.errors);
    if (t.validateSchema === "log")
      r.logger.error(i);
    else
      throw new Error(i);
  }
}
De.validateKeywordUsage = tl;
var Ke = {};
Object.defineProperty(Ke, "__esModule", { value: !0 });
Ke.extendSubschemaMode = Ke.extendSubschemaData = Ke.getSubschema = void 0;
const je = z, ro = D;
function rl(e, { keyword: t, schemaProp: r, schema: n, schemaPath: s, errSchemaPath: a, topSchemaRef: o }) {
  if (t !== void 0 && n !== void 0)
    throw new Error('both "keyword" and "schema" passed, only one allowed');
  if (t !== void 0) {
    const l = e.schema[t];
    return r === void 0 ? {
      schema: l,
      schemaPath: (0, je._)`${e.schemaPath}${(0, je.getProperty)(t)}`,
      errSchemaPath: `${e.errSchemaPath}/${t}`
    } : {
      schema: l[r],
      schemaPath: (0, je._)`${e.schemaPath}${(0, je.getProperty)(t)}${(0, je.getProperty)(r)}`,
      errSchemaPath: `${e.errSchemaPath}/${t}/${(0, ro.escapeFragment)(r)}`
    };
  }
  if (n !== void 0) {
    if (s === void 0 || a === void 0 || o === void 0)
      throw new Error('"schemaPath", "errSchemaPath" and "topSchemaRef" are required with "schema"');
    return {
      schema: n,
      schemaPath: s,
      topSchemaRef: o,
      errSchemaPath: a
    };
  }
  throw new Error('either "keyword" or "schema" must be passed');
}
Ke.getSubschema = rl;
function nl(e, t, { dataProp: r, dataPropType: n, data: s, dataTypes: a, propertyName: o }) {
  if (s !== void 0 && r !== void 0)
    throw new Error('both "data" and "dataProp" passed, only one allowed');
  const { gen: l } = t;
  if (r !== void 0) {
    const { errorPath: f, dataPathArr: c, opts: h } = t, P = l.let("data", (0, je._)`${t.data}${(0, je.getProperty)(r)}`, !0);
    i(P), e.errorPath = (0, je.str)`${f}${(0, ro.getErrorPath)(r, n, h.jsPropertySyntax)}`, e.parentDataProperty = (0, je._)`${r}`, e.dataPathArr = [...c, e.parentDataProperty];
  }
  if (s !== void 0) {
    const f = s instanceof je.Name ? s : l.let("data", s, !0);
    i(f), o !== void 0 && (e.propertyName = o);
  }
  a && (e.dataTypes = a);
  function i(f) {
    e.data = f, e.dataLevel = t.dataLevel + 1, e.dataTypes = [], t.definedProperties = /* @__PURE__ */ new Set(), e.parentData = t.data, e.dataNames = [...t.dataNames, f];
  }
}
Ke.extendSubschemaData = nl;
function sl(e, { jtdDiscriminator: t, jtdMetadata: r, compositeRule: n, createErrors: s, allErrors: a }) {
  n !== void 0 && (e.compositeRule = n), s !== void 0 && (e.createErrors = s), a !== void 0 && (e.allErrors = a), e.jtdDiscriminator = t, e.jtdMetadata = r;
}
Ke.extendSubschemaMode = sl;
var le = {}, no = function e(t, r) {
  if (t === r) return !0;
  if (t && r && typeof t == "object" && typeof r == "object") {
    if (t.constructor !== r.constructor) return !1;
    var n, s, a;
    if (Array.isArray(t)) {
      if (n = t.length, n != r.length) return !1;
      for (s = n; s-- !== 0; )
        if (!e(t[s], r[s])) return !1;
      return !0;
    }
    if (t.constructor === RegExp) return t.source === r.source && t.flags === r.flags;
    if (t.valueOf !== Object.prototype.valueOf) return t.valueOf() === r.valueOf();
    if (t.toString !== Object.prototype.toString) return t.toString() === r.toString();
    if (a = Object.keys(t), n = a.length, n !== Object.keys(r).length) return !1;
    for (s = n; s-- !== 0; )
      if (!Object.prototype.hasOwnProperty.call(r, a[s])) return !1;
    for (s = n; s-- !== 0; ) {
      var o = a[s];
      if (!e(t[o], r[o])) return !1;
    }
    return !0;
  }
  return t !== t && r !== r;
}, so = { exports: {} }, He = so.exports = function(e, t, r) {
  typeof t == "function" && (r = t, t = {}), r = t.cb || r;
  var n = typeof r == "function" ? r : r.pre || function() {
  }, s = r.post || function() {
  };
  Bt(t, n, s, e, "", e);
};
He.keywords = {
  additionalItems: !0,
  items: !0,
  contains: !0,
  additionalProperties: !0,
  propertyNames: !0,
  not: !0,
  if: !0,
  then: !0,
  else: !0
};
He.arrayKeywords = {
  items: !0,
  allOf: !0,
  anyOf: !0,
  oneOf: !0
};
He.propsKeywords = {
  $defs: !0,
  definitions: !0,
  properties: !0,
  patternProperties: !0,
  dependencies: !0
};
He.skipKeywords = {
  default: !0,
  enum: !0,
  const: !0,
  required: !0,
  maximum: !0,
  minimum: !0,
  exclusiveMaximum: !0,
  exclusiveMinimum: !0,
  multipleOf: !0,
  maxLength: !0,
  minLength: !0,
  pattern: !0,
  format: !0,
  maxItems: !0,
  minItems: !0,
  uniqueItems: !0,
  maxProperties: !0,
  minProperties: !0
};
function Bt(e, t, r, n, s, a, o, l, i, f) {
  if (n && typeof n == "object" && !Array.isArray(n)) {
    t(n, s, a, o, l, i, f);
    for (var c in n) {
      var h = n[c];
      if (Array.isArray(h)) {
        if (c in He.arrayKeywords)
          for (var P = 0; P < h.length; P++)
            Bt(e, t, r, h[P], s + "/" + c + "/" + P, a, s, c, n, P);
      } else if (c in He.propsKeywords) {
        if (h && typeof h == "object")
          for (var _ in h)
            Bt(e, t, r, h[_], s + "/" + c + "/" + al(_), a, s, c, n, _);
      } else (c in He.keywords || e.allKeys && !(c in He.skipKeywords)) && Bt(e, t, r, h, s + "/" + c, a, s, c, n);
    }
    r(n, s, a, o, l, i, f);
  }
}
function al(e) {
  return e.replace(/~/g, "~0").replace(/\//g, "~1");
}
var ol = so.exports;
Object.defineProperty(le, "__esModule", { value: !0 });
le.getSchemaRefs = le.resolveUrl = le.normalizeId = le._getFullPath = le.getFullPath = le.inlineRef = void 0;
const il = D, cl = no, ll = ol, ul = /* @__PURE__ */ new Set([
  "type",
  "format",
  "pattern",
  "maxLength",
  "minLength",
  "maxProperties",
  "minProperties",
  "maxItems",
  "minItems",
  "maximum",
  "minimum",
  "uniqueItems",
  "multipleOf",
  "required",
  "enum",
  "const"
]);
function fl(e, t = !0) {
  return typeof e == "boolean" ? !0 : t === !0 ? !Zr(e) : t ? ao(e) <= t : !1;
}
le.inlineRef = fl;
const dl = /* @__PURE__ */ new Set([
  "$ref",
  "$recursiveRef",
  "$recursiveAnchor",
  "$dynamicRef",
  "$dynamicAnchor"
]);
function Zr(e) {
  for (const t in e) {
    if (dl.has(t))
      return !0;
    const r = e[t];
    if (Array.isArray(r) && r.some(Zr) || typeof r == "object" && Zr(r))
      return !0;
  }
  return !1;
}
function ao(e) {
  let t = 0;
  for (const r in e) {
    if (r === "$ref")
      return 1 / 0;
    if (t++, !ul.has(r) && (typeof e[r] == "object" && (0, il.eachItem)(e[r], (n) => t += ao(n)), t === 1 / 0))
      return 1 / 0;
  }
  return t;
}
function oo(e, t = "", r) {
  r !== !1 && (t = lt(t));
  const n = e.parse(t);
  return io(e, n);
}
le.getFullPath = oo;
function io(e, t) {
  return e.serialize(t).split("#")[0] + "#";
}
le._getFullPath = io;
const hl = /#\/?$/;
function lt(e) {
  return e ? e.replace(hl, "") : "";
}
le.normalizeId = lt;
function pl(e, t, r) {
  return r = lt(r), e.resolve(t, r);
}
le.resolveUrl = pl;
const ml = /^[a-z_][-a-z0-9._]*$/i;
function yl(e, t) {
  if (typeof e == "boolean")
    return {};
  const { schemaId: r, uriResolver: n } = this.opts, s = lt(e[r] || t), a = { "": s }, o = oo(n, s, !1), l = {}, i = /* @__PURE__ */ new Set();
  return ll(e, { allKeys: !0 }, (h, P, _, R) => {
    if (R === void 0)
      return;
    const v = o + P;
    let w = a[R];
    typeof h[r] == "string" && (w = y.call(this, h[r])), b.call(this, h.$anchor), b.call(this, h.$dynamicAnchor), a[P] = w;
    function y(I) {
      const T = this.opts.uriResolver.resolve;
      if (I = lt(w ? T(w, I) : I), i.has(I))
        throw c(I);
      i.add(I);
      let A = this.refs[I];
      return typeof A == "string" && (A = this.refs[A]), typeof A == "object" ? f(h, A.schema, I) : I !== lt(v) && (I[0] === "#" ? (f(h, l[I], I), l[I] = h) : this.refs[I] = v), I;
    }
    function b(I) {
      if (typeof I == "string") {
        if (!ml.test(I))
          throw new Error(`invalid anchor "${I}"`);
        y.call(this, `#${I}`);
      }
    }
  }), l;
  function f(h, P, _) {
    if (P !== void 0 && !cl(h, P))
      throw c(_);
  }
  function c(h) {
    return new Error(`reference "${h}" resolves to more than one schema`);
  }
}
le.getSchemaRefs = yl;
Object.defineProperty(Oe, "__esModule", { value: !0 });
Oe.getData = Oe.KeywordCxt = Oe.validateFunctionCode = void 0;
const co = ht, Ts = ne, In = Me, tr = ne, $l = cr, bt = De, Cr = Ke, k = z, M = Le, _l = le, Fe = D, vt = Tt;
function gl(e) {
  if (fo(e) && (ho(e), uo(e))) {
    wl(e);
    return;
  }
  lo(e, () => (0, co.topBoolOrEmptySchema)(e));
}
Oe.validateFunctionCode = gl;
function lo({ gen: e, validateName: t, schema: r, schemaEnv: n, opts: s }, a) {
  s.code.es5 ? e.func(t, (0, k._)`${M.default.data}, ${M.default.valCxt}`, n.$async, () => {
    e.code((0, k._)`"use strict"; ${As(r, s)}`), El(e, s), e.code(a);
  }) : e.func(t, (0, k._)`${M.default.data}, ${vl(s)}`, n.$async, () => e.code(As(r, s)).code(a));
}
function vl(e) {
  return (0, k._)`{${M.default.instancePath}="", ${M.default.parentData}, ${M.default.parentDataProperty}, ${M.default.rootData}=${M.default.data}${e.dynamicRef ? (0, k._)`, ${M.default.dynamicAnchors}={}` : k.nil}}={}`;
}
function El(e, t) {
  e.if(M.default.valCxt, () => {
    e.var(M.default.instancePath, (0, k._)`${M.default.valCxt}.${M.default.instancePath}`), e.var(M.default.parentData, (0, k._)`${M.default.valCxt}.${M.default.parentData}`), e.var(M.default.parentDataProperty, (0, k._)`${M.default.valCxt}.${M.default.parentDataProperty}`), e.var(M.default.rootData, (0, k._)`${M.default.valCxt}.${M.default.rootData}`), t.dynamicRef && e.var(M.default.dynamicAnchors, (0, k._)`${M.default.valCxt}.${M.default.dynamicAnchors}`);
  }, () => {
    e.var(M.default.instancePath, (0, k._)`""`), e.var(M.default.parentData, (0, k._)`undefined`), e.var(M.default.parentDataProperty, (0, k._)`undefined`), e.var(M.default.rootData, M.default.data), t.dynamicRef && e.var(M.default.dynamicAnchors, (0, k._)`{}`);
  });
}
function wl(e) {
  const { schema: t, opts: r, gen: n } = e;
  lo(e, () => {
    r.$comment && t.$comment && mo(e), Ol(e), n.let(M.default.vErrors, null), n.let(M.default.errors, 0), r.unevaluated && Sl(e), po(e), Tl(e);
  });
}
function Sl(e) {
  const { gen: t, validateName: r } = e;
  e.evaluated = t.const("evaluated", (0, k._)`${r}.evaluated`), t.if((0, k._)`${e.evaluated}.dynamicProps`, () => t.assign((0, k._)`${e.evaluated}.props`, (0, k._)`undefined`)), t.if((0, k._)`${e.evaluated}.dynamicItems`, () => t.assign((0, k._)`${e.evaluated}.items`, (0, k._)`undefined`));
}
function As(e, t) {
  const r = typeof e == "object" && e[t.schemaId];
  return r && (t.code.source || t.code.process) ? (0, k._)`/*# sourceURL=${r} */` : k.nil;
}
function bl(e, t) {
  if (fo(e) && (ho(e), uo(e))) {
    Pl(e, t);
    return;
  }
  (0, co.boolOrEmptySchema)(e, t);
}
function uo({ schema: e, self: t }) {
  if (typeof e == "boolean")
    return !e;
  for (const r in e)
    if (t.RULES.all[r])
      return !0;
  return !1;
}
function fo(e) {
  return typeof e.schema != "boolean";
}
function Pl(e, t) {
  const { schema: r, gen: n, opts: s } = e;
  s.$comment && r.$comment && mo(e), Il(e), Nl(e);
  const a = n.const("_errs", M.default.errors);
  po(e, a), n.var(t, (0, k._)`${a} === ${M.default.errors}`);
}
function ho(e) {
  (0, Fe.checkUnknownRules)(e), Rl(e);
}
function po(e, t) {
  if (e.opts.jtd)
    return js(e, [], !1, t);
  const r = (0, Ts.getSchemaTypes)(e.schema), n = (0, Ts.coerceAndCheckDataType)(e, r);
  js(e, r, !n, t);
}
function Rl(e) {
  const { schema: t, errSchemaPath: r, opts: n, self: s } = e;
  t.$ref && n.ignoreKeywordsWithRef && (0, Fe.schemaHasRulesButRef)(t, s.RULES) && s.logger.warn(`$ref: keywords ignored in schema at path "${r}"`);
}
function Ol(e) {
  const { schema: t, opts: r } = e;
  t.default !== void 0 && r.useDefaults && r.strictSchema && (0, Fe.checkStrictMode)(e, "default is ignored in the schema root");
}
function Il(e) {
  const t = e.schema[e.opts.schemaId];
  t && (e.baseId = (0, _l.resolveUrl)(e.opts.uriResolver, e.baseId, t));
}
function Nl(e) {
  if (e.schema.$async && !e.schemaEnv.$async)
    throw new Error("async schema in sync schema");
}
function mo({ gen: e, schemaEnv: t, schema: r, errSchemaPath: n, opts: s }) {
  const a = r.$comment;
  if (s.$comment === !0)
    e.code((0, k._)`${M.default.self}.logger.log(${a})`);
  else if (typeof s.$comment == "function") {
    const o = (0, k.str)`${n}/$comment`, l = e.scopeValue("root", { ref: t.root });
    e.code((0, k._)`${M.default.self}.opts.$comment(${a}, ${o}, ${l}.schema)`);
  }
}
function Tl(e) {
  const { gen: t, schemaEnv: r, validateName: n, ValidationError: s, opts: a } = e;
  r.$async ? t.if((0, k._)`${M.default.errors} === 0`, () => t.return(M.default.data), () => t.throw((0, k._)`new ${s}(${M.default.vErrors})`)) : (t.assign((0, k._)`${n}.errors`, M.default.vErrors), a.unevaluated && Al(e), t.return((0, k._)`${M.default.errors} === 0`));
}
function Al({ gen: e, evaluated: t, props: r, items: n }) {
  r instanceof k.Name && e.assign((0, k._)`${t}.props`, r), n instanceof k.Name && e.assign((0, k._)`${t}.items`, n);
}
function js(e, t, r, n) {
  const { gen: s, schema: a, data: o, allErrors: l, opts: i, self: f } = e, { RULES: c } = f;
  if (a.$ref && (i.ignoreKeywordsWithRef || !(0, Fe.schemaHasRulesButRef)(a, c))) {
    s.block(() => _o(e, "$ref", c.all.$ref.definition));
    return;
  }
  i.jtd || jl(e, t), s.block(() => {
    for (const P of c.rules)
      h(P);
    h(c.post);
  });
  function h(P) {
    (0, In.shouldUseGroup)(a, P) && (P.type ? (s.if((0, tr.checkDataType)(P.type, o, i.strictNumbers)), Cs(e, P), t.length === 1 && t[0] === P.type && r && (s.else(), (0, tr.reportTypeError)(e)), s.endIf()) : Cs(e, P), l || s.if((0, k._)`${M.default.errors} === ${n || 0}`));
  }
}
function Cs(e, t) {
  const { gen: r, schema: n, opts: { useDefaults: s } } = e;
  s && (0, $l.assignDefaults)(e, t.type), r.block(() => {
    for (const a of t.rules)
      (0, In.shouldUseRule)(n, a) && _o(e, a.keyword, a.definition, t.type);
  });
}
function jl(e, t) {
  e.schemaEnv.meta || !e.opts.strictTypes || (Cl(e, t), e.opts.allowUnionTypes || Dl(e, t), kl(e, e.dataTypes));
}
function Cl(e, t) {
  if (t.length) {
    if (!e.dataTypes.length) {
      e.dataTypes = t;
      return;
    }
    t.forEach((r) => {
      yo(e.dataTypes, r) || Nn(e, `type "${r}" not allowed by context "${e.dataTypes.join(",")}"`);
    }), Ml(e, t);
  }
}
function Dl(e, t) {
  t.length > 1 && !(t.length === 2 && t.includes("null")) && Nn(e, "use allowUnionTypes to allow union type keyword");
}
function kl(e, t) {
  const r = e.self.RULES.all;
  for (const n in r) {
    const s = r[n];
    if (typeof s == "object" && (0, In.shouldUseRule)(e.schema, s)) {
      const { type: a } = s.definition;
      a.length && !a.some((o) => Ll(t, o)) && Nn(e, `missing type "${a.join(",")}" for keyword "${n}"`);
    }
  }
}
function Ll(e, t) {
  return e.includes(t) || t === "number" && e.includes("integer");
}
function yo(e, t) {
  return e.includes(t) || t === "integer" && e.includes("number");
}
function Ml(e, t) {
  const r = [];
  for (const n of e.dataTypes)
    yo(t, n) ? r.push(n) : t.includes("integer") && n === "number" && r.push("integer");
  e.dataTypes = r;
}
function Nn(e, t) {
  const r = e.schemaEnv.baseId + e.errSchemaPath;
  t += ` at "${r}" (strictTypes)`, (0, Fe.checkStrictMode)(e, t, e.opts.strictTypes);
}
class $o {
  constructor(t, r, n) {
    if ((0, bt.validateKeywordUsage)(t, r, n), this.gen = t.gen, this.allErrors = t.allErrors, this.keyword = n, this.data = t.data, this.schema = t.schema[n], this.$data = r.$data && t.opts.$data && this.schema && this.schema.$data, this.schemaValue = (0, Fe.schemaRefOrVal)(t, this.schema, n, this.$data), this.schemaType = r.schemaType, this.parentSchema = t.schema, this.params = {}, this.it = t, this.def = r, this.$data)
      this.schemaCode = t.gen.const("vSchema", go(this.$data, t));
    else if (this.schemaCode = this.schemaValue, !(0, bt.validSchemaType)(this.schema, r.schemaType, r.allowUndefined))
      throw new Error(`${n} value must be ${JSON.stringify(r.schemaType)}`);
    ("code" in r ? r.trackErrors : r.errors !== !1) && (this.errsCount = t.gen.const("_errs", M.default.errors));
  }
  result(t, r, n) {
    this.failResult((0, k.not)(t), r, n);
  }
  failResult(t, r, n) {
    this.gen.if(t), n ? n() : this.error(), r ? (this.gen.else(), r(), this.allErrors && this.gen.endIf()) : this.allErrors ? this.gen.endIf() : this.gen.else();
  }
  pass(t, r) {
    this.failResult((0, k.not)(t), void 0, r);
  }
  fail(t) {
    if (t === void 0) {
      this.error(), this.allErrors || this.gen.if(!1);
      return;
    }
    this.gen.if(t), this.error(), this.allErrors ? this.gen.endIf() : this.gen.else();
  }
  fail$data(t) {
    if (!this.$data)
      return this.fail(t);
    const { schemaCode: r } = this;
    this.fail((0, k._)`${r} !== undefined && (${(0, k.or)(this.invalid$data(), t)})`);
  }
  error(t, r, n) {
    if (r) {
      this.setParams(r), this._error(t, n), this.setParams({});
      return;
    }
    this._error(t, n);
  }
  _error(t, r) {
    (t ? vt.reportExtraError : vt.reportError)(this, this.def.error, r);
  }
  $dataError() {
    (0, vt.reportError)(this, this.def.$dataError || vt.keyword$DataError);
  }
  reset() {
    if (this.errsCount === void 0)
      throw new Error('add "trackErrors" to keyword definition');
    (0, vt.resetErrorsCount)(this.gen, this.errsCount);
  }
  ok(t) {
    this.allErrors || this.gen.if(t);
  }
  setParams(t, r) {
    r ? Object.assign(this.params, t) : this.params = t;
  }
  block$data(t, r, n = k.nil) {
    this.gen.block(() => {
      this.check$data(t, n), r();
    });
  }
  check$data(t = k.nil, r = k.nil) {
    if (!this.$data)
      return;
    const { gen: n, schemaCode: s, schemaType: a, def: o } = this;
    n.if((0, k.or)((0, k._)`${s} === undefined`, r)), t !== k.nil && n.assign(t, !0), (a.length || o.validateSchema) && (n.elseIf(this.invalid$data()), this.$dataError(), t !== k.nil && n.assign(t, !1)), n.else();
  }
  invalid$data() {
    const { gen: t, schemaCode: r, schemaType: n, def: s, it: a } = this;
    return (0, k.or)(o(), l());
    function o() {
      if (n.length) {
        if (!(r instanceof k.Name))
          throw new Error("ajv implementation error");
        const i = Array.isArray(n) ? n : [n];
        return (0, k._)`${(0, tr.checkDataTypes)(i, r, a.opts.strictNumbers, tr.DataType.Wrong)}`;
      }
      return k.nil;
    }
    function l() {
      if (s.validateSchema) {
        const i = t.scopeValue("validate$data", { ref: s.validateSchema });
        return (0, k._)`!${i}(${r})`;
      }
      return k.nil;
    }
  }
  subschema(t, r) {
    const n = (0, Cr.getSubschema)(this.it, t);
    (0, Cr.extendSubschemaData)(n, this.it, t), (0, Cr.extendSubschemaMode)(n, t);
    const s = { ...this.it, ...n, items: void 0, props: void 0 };
    return bl(s, r), s;
  }
  mergeEvaluated(t, r) {
    const { it: n, gen: s } = this;
    n.opts.unevaluated && (n.props !== !0 && t.props !== void 0 && (n.props = Fe.mergeEvaluated.props(s, t.props, n.props, r)), n.items !== !0 && t.items !== void 0 && (n.items = Fe.mergeEvaluated.items(s, t.items, n.items, r)));
  }
  mergeValidEvaluated(t, r) {
    const { it: n, gen: s } = this;
    if (n.opts.unevaluated && (n.props !== !0 || n.items !== !0))
      return s.if(r, () => this.mergeEvaluated(t, k.Name)), !0;
  }
}
Oe.KeywordCxt = $o;
function _o(e, t, r, n) {
  const s = new $o(e, r, t);
  "code" in r ? r.code(s, n) : s.$data && r.validate ? (0, bt.funcKeywordCode)(s, r) : "macro" in r ? (0, bt.macroKeywordCode)(s, r) : (r.compile || r.validate) && (0, bt.funcKeywordCode)(s, r);
}
const Fl = /^\/(?:[^~]|~0|~1)*$/, Ul = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
function go(e, { dataLevel: t, dataNames: r, dataPathArr: n }) {
  let s, a;
  if (e === "")
    return M.default.rootData;
  if (e[0] === "/") {
    if (!Fl.test(e))
      throw new Error(`Invalid JSON-pointer: ${e}`);
    s = e, a = M.default.rootData;
  } else {
    const f = Ul.exec(e);
    if (!f)
      throw new Error(`Invalid JSON-pointer: ${e}`);
    const c = +f[1];
    if (s = f[2], s === "#") {
      if (c >= t)
        throw new Error(i("property/index", c));
      return n[t - c];
    }
    if (c > t)
      throw new Error(i("data", c));
    if (a = r[t - c], !s)
      return a;
  }
  let o = a;
  const l = s.split("/");
  for (const f of l)
    f && (a = (0, k._)`${a}${(0, k.getProperty)((0, Fe.unescapeJsonPointer)(f))}`, o = (0, k._)`${o} && ${a}`);
  return o;
  function i(f, c) {
    return `Cannot access ${f} ${c} levels up, current level is ${t}`;
  }
}
Oe.getData = go;
var At = {};
Object.defineProperty(At, "__esModule", { value: !0 });
class zl extends Error {
  constructor(t) {
    super("validation failed"), this.errors = t, this.ajv = this.validation = !0;
  }
}
At.default = zl;
var yt = {};
Object.defineProperty(yt, "__esModule", { value: !0 });
const Dr = le;
class Vl extends Error {
  constructor(t, r, n, s) {
    super(s || `can't resolve reference ${n} from id ${r}`), this.missingRef = (0, Dr.resolveUrl)(t, r, n), this.missingSchema = (0, Dr.normalizeId)((0, Dr.getFullPath)(t, this.missingRef));
  }
}
yt.default = Vl;
var ve = {};
Object.defineProperty(ve, "__esModule", { value: !0 });
ve.resolveSchema = ve.getCompilingSchema = ve.resolveRef = ve.compileSchema = ve.SchemaEnv = void 0;
const be = z, ql = At, Xe = Le, Re = le, Ds = D, Gl = Oe;
class lr {
  constructor(t) {
    var r;
    this.refs = {}, this.dynamicAnchors = {};
    let n;
    typeof t.schema == "object" && (n = t.schema), this.schema = t.schema, this.schemaId = t.schemaId, this.root = t.root || this, this.baseId = (r = t.baseId) !== null && r !== void 0 ? r : (0, Re.normalizeId)(n == null ? void 0 : n[t.schemaId || "$id"]), this.schemaPath = t.schemaPath, this.localRefs = t.localRefs, this.meta = t.meta, this.$async = n == null ? void 0 : n.$async, this.refs = {};
  }
}
ve.SchemaEnv = lr;
function Tn(e) {
  const t = vo.call(this, e);
  if (t)
    return t;
  const r = (0, Re.getFullPath)(this.opts.uriResolver, e.root.baseId), { es5: n, lines: s } = this.opts.code, { ownProperties: a } = this.opts, o = new be.CodeGen(this.scope, { es5: n, lines: s, ownProperties: a });
  let l;
  e.$async && (l = o.scopeValue("Error", {
    ref: ql.default,
    code: (0, be._)`require("ajv/dist/runtime/validation_error").default`
  }));
  const i = o.scopeName("validate");
  e.validateName = i;
  const f = {
    gen: o,
    allErrors: this.opts.allErrors,
    data: Xe.default.data,
    parentData: Xe.default.parentData,
    parentDataProperty: Xe.default.parentDataProperty,
    dataNames: [Xe.default.data],
    dataPathArr: [be.nil],
    // TODO can its length be used as dataLevel if nil is removed?
    dataLevel: 0,
    dataTypes: [],
    definedProperties: /* @__PURE__ */ new Set(),
    topSchemaRef: o.scopeValue("schema", this.opts.code.source === !0 ? { ref: e.schema, code: (0, be.stringify)(e.schema) } : { ref: e.schema }),
    validateName: i,
    ValidationError: l,
    schema: e.schema,
    schemaEnv: e,
    rootId: r,
    baseId: e.baseId || r,
    schemaPath: be.nil,
    errSchemaPath: e.schemaPath || (this.opts.jtd ? "" : "#"),
    errorPath: (0, be._)`""`,
    opts: this.opts,
    self: this
  };
  let c;
  try {
    this._compilations.add(e), (0, Gl.validateFunctionCode)(f), o.optimize(this.opts.code.optimize);
    const h = o.toString();
    c = `${o.scopeRefs(Xe.default.scope)}return ${h}`, this.opts.code.process && (c = this.opts.code.process(c, e));
    const _ = new Function(`${Xe.default.self}`, `${Xe.default.scope}`, c)(this, this.scope.get());
    if (this.scope.value(i, { ref: _ }), _.errors = null, _.schema = e.schema, _.schemaEnv = e, e.$async && (_.$async = !0), this.opts.code.source === !0 && (_.source = { validateName: i, validateCode: h, scopeValues: o._values }), this.opts.unevaluated) {
      const { props: R, items: v } = f;
      _.evaluated = {
        props: R instanceof be.Name ? void 0 : R,
        items: v instanceof be.Name ? void 0 : v,
        dynamicProps: R instanceof be.Name,
        dynamicItems: v instanceof be.Name
      }, _.source && (_.source.evaluated = (0, be.stringify)(_.evaluated));
    }
    return e.validate = _, e;
  } catch (h) {
    throw delete e.validate, delete e.validateName, c && this.logger.error("Error compiling schema, function code:", c), h;
  } finally {
    this._compilations.delete(e);
  }
}
ve.compileSchema = Tn;
function Hl(e, t, r) {
  var n;
  r = (0, Re.resolveUrl)(this.opts.uriResolver, t, r);
  const s = e.refs[r];
  if (s)
    return s;
  let a = Wl.call(this, e, r);
  if (a === void 0) {
    const o = (n = e.localRefs) === null || n === void 0 ? void 0 : n[r], { schemaId: l } = this.opts;
    o && (a = new lr({ schema: o, schemaId: l, root: e, baseId: t }));
  }
  if (a !== void 0)
    return e.refs[r] = Kl.call(this, a);
}
ve.resolveRef = Hl;
function Kl(e) {
  return (0, Re.inlineRef)(e.schema, this.opts.inlineRefs) ? e.schema : e.validate ? e : Tn.call(this, e);
}
function vo(e) {
  for (const t of this._compilations)
    if (xl(t, e))
      return t;
}
ve.getCompilingSchema = vo;
function xl(e, t) {
  return e.schema === t.schema && e.root === t.root && e.baseId === t.baseId;
}
function Wl(e, t) {
  let r;
  for (; typeof (r = this.refs[t]) == "string"; )
    t = r;
  return r || this.schemas[t] || ur.call(this, e, t);
}
function ur(e, t) {
  const r = this.opts.uriResolver.parse(t), n = (0, Re._getFullPath)(this.opts.uriResolver, r);
  let s = (0, Re.getFullPath)(this.opts.uriResolver, e.baseId, void 0);
  if (Object.keys(e.schema).length > 0 && n === s)
    return kr.call(this, r, e);
  const a = (0, Re.normalizeId)(n), o = this.refs[a] || this.schemas[a];
  if (typeof o == "string") {
    const l = ur.call(this, e, o);
    return typeof (l == null ? void 0 : l.schema) != "object" ? void 0 : kr.call(this, r, l);
  }
  if (typeof (o == null ? void 0 : o.schema) == "object") {
    if (o.validate || Tn.call(this, o), a === (0, Re.normalizeId)(t)) {
      const { schema: l } = o, { schemaId: i } = this.opts, f = l[i];
      return f && (s = (0, Re.resolveUrl)(this.opts.uriResolver, s, f)), new lr({ schema: l, schemaId: i, root: e, baseId: s });
    }
    return kr.call(this, r, o);
  }
}
ve.resolveSchema = ur;
const Xl = /* @__PURE__ */ new Set([
  "properties",
  "patternProperties",
  "enum",
  "dependencies",
  "definitions"
]);
function kr(e, { baseId: t, schema: r, root: n }) {
  var s;
  if (((s = e.fragment) === null || s === void 0 ? void 0 : s[0]) !== "/")
    return;
  for (const l of e.fragment.slice(1).split("/")) {
    if (typeof r == "boolean")
      return;
    const i = r[(0, Ds.unescapeFragment)(l)];
    if (i === void 0)
      return;
    r = i;
    const f = typeof r == "object" && r[this.opts.schemaId];
    !Xl.has(l) && f && (t = (0, Re.resolveUrl)(this.opts.uriResolver, t, f));
  }
  let a;
  if (typeof r != "boolean" && r.$ref && !(0, Ds.schemaHasRulesButRef)(r, this.RULES)) {
    const l = (0, Re.resolveUrl)(this.opts.uriResolver, t, r.$ref);
    a = ur.call(this, n, l);
  }
  const { schemaId: o } = this.opts;
  if (a = a || new lr({ schema: r, schemaId: o, root: n, baseId: t }), a.schema !== a.root.schema)
    return a;
}
const Bl = "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#", Yl = "Meta-schema for $data reference (JSON AnySchema extension proposal)", Jl = "object", Zl = [
  "$data"
], Ql = {
  $data: {
    type: "string",
    anyOf: [
      {
        format: "relative-json-pointer"
      },
      {
        format: "json-pointer"
      }
    ]
  }
}, eu = !1, tu = {
  $id: Bl,
  description: Yl,
  type: Jl,
  required: Zl,
  properties: Ql,
  additionalProperties: eu
};
var An = {}, fr = { exports: {} };
const ru = RegExp.prototype.test.bind(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/iu), Eo = RegExp.prototype.test.bind(/^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)$/u), jn = RegExp.prototype.test.bind(/^[\da-f]{2}$/iu), wo = RegExp.prototype.test.bind(/^[\da-z\-._~]$/iu), nu = RegExp.prototype.test.bind(/^[\da-z\-._~!$&'()*+,;=:@/]$/iu);
function So(e) {
  let t = "", r = 0, n = 0;
  for (n = 0; n < e.length; n++)
    if (r = e[n].charCodeAt(0), r !== 48) {
      if (!(r >= 48 && r <= 57 || r >= 65 && r <= 70 || r >= 97 && r <= 102))
        return "";
      t += e[n];
      break;
    }
  for (n += 1; n < e.length; n++) {
    if (r = e[n].charCodeAt(0), !(r >= 48 && r <= 57 || r >= 65 && r <= 70 || r >= 97 && r <= 102))
      return "";
    t += e[n];
  }
  return t;
}
const su = RegExp.prototype.test.bind(/[^!"$&'()*+,\-.;=_`a-z{}~]/u);
function ks(e) {
  return e.length = 0, !0;
}
function au(e, t, r) {
  if (e.length) {
    const n = So(e);
    if (n !== "")
      t.push(n);
    else
      return r.error = !0, !1;
    e.length = 0;
  }
  return !0;
}
function ou(e) {
  let t = 0;
  const r = { error: !1, address: "", zone: "" }, n = [], s = [];
  let a = !1, o = !1, l = au;
  for (let i = 0; i < e.length; i++) {
    const f = e[i];
    if (!(f === "[" || f === "]"))
      if (f === ":") {
        if (a === !0 && (o = !0), !l(s, n, r))
          break;
        if (++t > 7) {
          r.error = !0;
          break;
        }
        i > 0 && e[i - 1] === ":" && (a = !0), n.push(":");
        continue;
      } else if (f === "%") {
        if (!l(s, n, r))
          break;
        l = ks;
      } else {
        s.push(f);
        continue;
      }
  }
  return s.length && (l === ks ? r.zone = s.join("") : o ? n.push(s.join("")) : n.push(So(s))), r.address = n.join(""), r;
}
function bo(e) {
  if (iu(e, ":") < 2)
    return { host: e, isIPV6: !1 };
  const t = ou(e);
  if (t.error)
    return { host: e, isIPV6: !1 };
  {
    let r = t.address, n = t.address;
    return t.zone && (r += "%" + t.zone, n += "%25" + t.zone), { host: r, isIPV6: !0, escapedHost: n };
  }
}
function iu(e, t) {
  let r = 0;
  for (let n = 0; n < e.length; n++)
    e[n] === t && r++;
  return r;
}
function cu(e) {
  let t = e;
  const r = [];
  let n = -1, s = 0;
  for (; s = t.length; ) {
    if (s === 1) {
      if (t === ".")
        break;
      if (t === "/") {
        r.push("/");
        break;
      } else {
        r.push(t);
        break;
      }
    } else if (s === 2) {
      if (t[0] === ".") {
        if (t[1] === ".")
          break;
        if (t[1] === "/") {
          t = t.slice(2);
          continue;
        }
      } else if (t[0] === "/" && (t[1] === "." || t[1] === "/")) {
        r.push("/");
        break;
      }
    } else if (s === 3 && t === "/..") {
      r.length !== 0 && r.pop(), r.push("/");
      break;
    }
    if (t[0] === ".") {
      if (t[1] === ".") {
        if (t[2] === "/") {
          t = t.slice(3);
          continue;
        }
      } else if (t[1] === "/") {
        t = t.slice(2);
        continue;
      }
    } else if (t[0] === "/" && t[1] === ".") {
      if (t[2] === "/") {
        t = t.slice(2);
        continue;
      } else if (t[2] === "." && t[3] === "/") {
        t = t.slice(3), r.length !== 0 && r.pop();
        continue;
      }
    }
    if ((n = t.indexOf("/", 1)) === -1) {
      r.push(t);
      break;
    } else
      r.push(t.slice(0, n)), t = t.slice(n);
  }
  return r.join("");
}
const lu = { "@": "%40", "/": "%2F", "?": "%3F", "#": "%23", ":": "%3A" }, uu = /[@/?#:]/g, fu = /[@/?#]/g;
function Po(e, t) {
  const r = t ? fu : uu;
  return r.lastIndex = 0, e.replace(r, (n) => lu[n]);
}
function du(e, t = !1) {
  if (e.indexOf("%") === -1)
    return e;
  let r = "";
  for (let n = 0; n < e.length; n++) {
    if (e[n] === "%" && n + 2 < e.length) {
      const s = e.slice(n + 1, n + 3);
      if (jn(s)) {
        const a = s.toUpperCase(), o = String.fromCharCode(parseInt(a, 16));
        t && wo(o) ? r += o : r += "%" + a, n += 2;
        continue;
      }
    }
    r += e[n];
  }
  return r;
}
function hu(e) {
  let t = "";
  for (let r = 0; r < e.length; r++) {
    if (e[r] === "%" && r + 2 < e.length) {
      const n = e.slice(r + 1, r + 3);
      if (jn(n)) {
        const s = n.toUpperCase(), a = String.fromCharCode(parseInt(s, 16));
        a !== "." && wo(a) ? t += a : t += "%" + s, r += 2;
        continue;
      }
    }
    nu(e[r]) ? t += e[r] : t += escape(e[r]);
  }
  return t;
}
function pu(e) {
  let t = "";
  for (let r = 0; r < e.length; r++) {
    if (e[r] === "%" && r + 2 < e.length) {
      const n = e.slice(r + 1, r + 3);
      if (jn(n)) {
        t += "%" + n.toUpperCase(), r += 2;
        continue;
      }
    }
    t += escape(e[r]);
  }
  return t;
}
function mu(e) {
  const t = [];
  if (e.userinfo !== void 0 && (t.push(e.userinfo), t.push("@")), e.host !== void 0) {
    let r = unescape(e.host);
    if (!Eo(r)) {
      const n = bo(r);
      n.isIPV6 === !0 ? r = `[${n.escapedHost}]` : r = Po(r, !1);
    }
    t.push(r);
  }
  return (typeof e.port == "number" || typeof e.port == "string") && (t.push(":"), t.push(String(e.port))), t.length ? t.join("") : void 0;
}
var Ro = {
  nonSimpleDomain: su,
  recomposeAuthority: mu,
  reescapeHostDelimiters: Po,
  normalizePercentEncoding: du,
  normalizePathEncoding: hu,
  escapePreservingEscapes: pu,
  removeDotSegments: cu,
  isIPv4: Eo,
  isUUID: ru,
  normalizeIPv6: bo
};
const { isUUID: yu } = Ro, $u = /([\da-z][\d\-a-z]{0,31}):((?:[\w!$'()*+,\-.:;=@]|%[\da-f]{2})+)/iu;
function Oo(e) {
  return e.secure === !0 ? !0 : e.secure === !1 ? !1 : e.scheme ? e.scheme.length === 3 && (e.scheme[0] === "w" || e.scheme[0] === "W") && (e.scheme[1] === "s" || e.scheme[1] === "S") && (e.scheme[2] === "s" || e.scheme[2] === "S") : !1;
}
function Io(e) {
  return e.host || (e.error = e.error || "HTTP URIs must have a host."), e;
}
function No(e) {
  const t = String(e.scheme).toLowerCase() === "https";
  return (e.port === (t ? 443 : 80) || e.port === "") && (e.port = void 0), e.path || (e.path = "/"), e;
}
function _u(e) {
  return e.secure = Oo(e), e.resourceName = (e.path || "/") + (e.query ? "?" + e.query : ""), e.path = void 0, e.query = void 0, e;
}
function gu(e) {
  if ((e.port === (Oo(e) ? 443 : 80) || e.port === "") && (e.port = void 0), typeof e.secure == "boolean" && (e.scheme = e.secure ? "wss" : "ws", e.secure = void 0), e.resourceName) {
    const [t, r] = e.resourceName.split("?");
    e.path = t && t !== "/" ? t : void 0, e.query = r, e.resourceName = void 0;
  }
  return e.fragment = void 0, e;
}
function vu(e, t) {
  if (!e.path)
    return e.error = "URN can not be parsed", e;
  const r = e.path.match($u);
  if (r) {
    const n = t.scheme || e.scheme || "urn";
    e.nid = r[1].toLowerCase(), e.nss = r[2];
    const s = `${n}:${t.nid || e.nid}`, a = Cn(s);
    e.path = void 0, a && (e = a.parse(e, t));
  } else
    e.error = e.error || "URN can not be parsed.";
  return e;
}
function Eu(e, t) {
  if (e.nid === void 0)
    throw new Error("URN without nid cannot be serialized");
  const r = t.scheme || e.scheme || "urn", n = e.nid.toLowerCase(), s = `${r}:${t.nid || n}`, a = Cn(s);
  a && (e = a.serialize(e, t));
  const o = e, l = e.nss;
  return o.path = `${n || t.nid}:${l}`, t.skipEscape = !0, o;
}
function wu(e, t) {
  const r = e;
  return r.uuid = r.nss, r.nss = void 0, !t.tolerant && (!r.uuid || !yu(r.uuid)) && (r.error = r.error || "UUID is not valid."), r;
}
function Su(e) {
  const t = e;
  return t.nss = (e.uuid || "").toLowerCase(), t;
}
const To = (
  /** @type {SchemeHandler} */
  {
    scheme: "http",
    domainHost: !0,
    parse: Io,
    serialize: No
  }
), bu = (
  /** @type {SchemeHandler} */
  {
    scheme: "https",
    domainHost: To.domainHost,
    parse: Io,
    serialize: No
  }
), Yt = (
  /** @type {SchemeHandler} */
  {
    scheme: "ws",
    domainHost: !0,
    parse: _u,
    serialize: gu
  }
), Pu = (
  /** @type {SchemeHandler} */
  {
    scheme: "wss",
    domainHost: Yt.domainHost,
    parse: Yt.parse,
    serialize: Yt.serialize
  }
), Ru = (
  /** @type {SchemeHandler} */
  {
    scheme: "urn",
    parse: vu,
    serialize: Eu,
    skipNormalize: !0
  }
), Ou = (
  /** @type {SchemeHandler} */
  {
    scheme: "urn:uuid",
    parse: wu,
    serialize: Su,
    skipNormalize: !0
  }
), rr = (
  /** @type {Record<SchemeName, SchemeHandler>} */
  {
    http: To,
    https: bu,
    ws: Yt,
    wss: Pu,
    urn: Ru,
    "urn:uuid": Ou
  }
);
Object.setPrototypeOf(rr, null);
function Cn(e) {
  return e && (rr[
    /** @type {SchemeName} */
    e
  ] || rr[
    /** @type {SchemeName} */
    e.toLowerCase()
  ]) || void 0;
}
var Iu = {
  SCHEMES: rr,
  getSchemeHandler: Cn
};
const { normalizeIPv6: Nu, removeDotSegments: wt, recomposeAuthority: Tu, normalizePercentEncoding: Au, normalizePathEncoding: ju, escapePreservingEscapes: Cu, reescapeHostDelimiters: Du, isIPv4: ku, nonSimpleDomain: Lu } = Ro, { SCHEMES: Mu, getSchemeHandler: Ao } = Iu;
function Fu(e, t) {
  return typeof e == "string" ? e = /** @type {T} */
  Gu(e, t) : typeof e == "object" && (e = /** @type {T} */
  pt(Qe(e, t), t)), e;
}
function Uu(e, t, r) {
  const n = r ? Object.assign({ scheme: "null" }, r) : { scheme: "null" }, s = jo(pt(e, n), pt(t, n), n, !0);
  return n.skipEscape = !0, Qe(s, n);
}
function jo(e, t, r, n) {
  const s = {};
  return n || (e = pt(Qe(e, r), r), t = pt(Qe(t, r), r)), r = r || {}, !r.tolerant && t.scheme ? (s.scheme = t.scheme, s.userinfo = t.userinfo, s.host = t.host, s.port = t.port, s.path = wt(t.path || ""), s.query = t.query) : (t.userinfo !== void 0 || t.host !== void 0 || t.port !== void 0 ? (s.userinfo = t.userinfo, s.host = t.host, s.port = t.port, s.path = wt(t.path || ""), s.query = t.query) : (t.path ? (t.path[0] === "/" ? s.path = wt(t.path) : ((e.userinfo !== void 0 || e.host !== void 0 || e.port !== void 0) && !e.path ? s.path = "/" + t.path : e.path ? s.path = e.path.slice(0, e.path.lastIndexOf("/") + 1) + t.path : s.path = t.path, s.path = wt(s.path)), s.query = t.query) : (s.path = e.path, t.query !== void 0 ? s.query = t.query : s.query = e.query), s.userinfo = e.userinfo, s.host = e.host, s.port = e.port), s.scheme = e.scheme), s.fragment = t.fragment, s;
}
function zu(e, t, r) {
  const n = Ls(e, r), s = Ls(t, r);
  return n !== void 0 && s !== void 0 && n.toLowerCase() === s.toLowerCase();
}
function Qe(e, t) {
  const r = {
    host: e.host,
    scheme: e.scheme,
    userinfo: e.userinfo,
    port: e.port,
    path: e.path,
    query: e.query,
    nid: e.nid,
    nss: e.nss,
    uuid: e.uuid,
    fragment: e.fragment,
    reference: e.reference,
    resourceName: e.resourceName,
    secure: e.secure,
    error: ""
  }, n = Object.assign({}, t), s = [], a = Ao(n.scheme || r.scheme);
  a && a.serialize && a.serialize(r, n), r.path !== void 0 && (n.skipEscape ? r.path = Au(r.path) : (r.path = Cu(r.path), r.scheme !== void 0 && (r.path = r.path.split("%3A").join(":")))), n.reference !== "suffix" && r.scheme && s.push(r.scheme, ":");
  const o = Tu(r);
  if (o !== void 0 && (n.reference !== "suffix" && s.push("//"), s.push(o), r.path && r.path[0] !== "/" && s.push("/")), r.path !== void 0) {
    let l = r.path;
    !n.absolutePath && (!a || !a.absolutePath) && (l = wt(l)), o === void 0 && l[0] === "/" && l[1] === "/" && (l = "/%2F" + l.slice(2)), s.push(l);
  }
  return r.query !== void 0 && s.push("?", r.query), r.fragment !== void 0 && s.push("#", r.fragment), s.join("");
}
const Vu = /^(?:([^#/:?]+):)?(?:\/\/((?:([^#/?@]*)@)?(\[[^#/?\]]+\]|[^#/:?]*)(?::(\d*))?))?([^#?]*)(?:\?([^#]*))?(?:#((?:.|[\n\r])*))?/u;
function qu(e, t) {
  if (t[2] !== void 0 && e.path && e.path[0] !== "/")
    return 'URI path must start with "/" when authority is present.';
  if (typeof e.port == "number" && (e.port < 0 || e.port > 65535))
    return "URI port is malformed.";
}
function Co(e, t) {
  const r = Object.assign({}, t), n = {
    scheme: void 0,
    userinfo: void 0,
    host: "",
    port: void 0,
    path: "",
    query: void 0,
    fragment: void 0
  };
  let s = !1, a = !1;
  r.reference === "suffix" && (r.scheme ? e = r.scheme + ":" + e : e = "//" + e);
  const o = e.match(Vu);
  if (o) {
    n.scheme = o[1], n.userinfo = o[3], n.host = o[4], n.port = parseInt(o[5], 10), n.path = o[6] || "", n.query = o[7], n.fragment = o[8], isNaN(n.port) && (n.port = o[5]);
    const l = qu(n, o);
    if (l !== void 0 && (n.error = n.error || l, s = !0), n.host)
      if (ku(n.host) === !1) {
        const c = Nu(n.host);
        n.host = c.host.toLowerCase(), a = c.isIPV6;
      } else
        a = !0;
    n.scheme === void 0 && n.userinfo === void 0 && n.host === void 0 && n.port === void 0 && n.query === void 0 && !n.path ? n.reference = "same-document" : n.scheme === void 0 ? n.reference = "relative" : n.fragment === void 0 ? n.reference = "absolute" : n.reference = "uri", r.reference && r.reference !== "suffix" && r.reference !== n.reference && (n.error = n.error || "URI is not a " + r.reference + " reference.");
    const i = Ao(r.scheme || n.scheme);
    if (!r.unicodeSupport && (!i || !i.unicodeSupport) && n.host && (r.domainHost || i && i.domainHost) && a === !1 && Lu(n.host))
      try {
        n.host = URL.domainToASCII(n.host.toLowerCase());
      } catch (f) {
        n.error = n.error || "Host's domain name can not be converted to ASCII: " + f;
      }
    if ((!i || i && !i.skipNormalize) && (e.indexOf("%") !== -1 && (n.scheme !== void 0 && (n.scheme = unescape(n.scheme)), n.host !== void 0 && (n.host = Du(unescape(n.host), a))), n.path && (n.path = ju(n.path)), n.fragment))
      try {
        n.fragment = encodeURI(decodeURIComponent(n.fragment));
      } catch {
        n.error = n.error || "URI malformed";
      }
    i && i.parse && i.parse(n, r);
  } else
    n.error = n.error || "URI can not be parsed.";
  return { parsed: n, malformedAuthorityOrPort: s };
}
function pt(e, t) {
  return Co(e, t).parsed;
}
function Gu(e, t) {
  return Do(e, t).normalized;
}
function Do(e, t) {
  const { parsed: r, malformedAuthorityOrPort: n } = Co(e, t);
  return {
    normalized: n ? e : Qe(r, t),
    malformedAuthorityOrPort: n
  };
}
function Ls(e, t) {
  if (typeof e == "string") {
    const { normalized: r, malformedAuthorityOrPort: n } = Do(e, t);
    return n ? void 0 : r;
  }
  if (typeof e == "object")
    return Qe(e, t);
}
const Dn = {
  SCHEMES: Mu,
  normalize: Fu,
  resolve: Uu,
  resolveComponent: jo,
  equal: zu,
  serialize: Qe,
  parse: pt
};
fr.exports = Dn;
fr.exports.default = Dn;
fr.exports.fastUri = Dn;
var Hu = fr.exports;
Object.defineProperty(An, "__esModule", { value: !0 });
const ko = Hu;
ko.code = 'require("ajv/dist/runtime/uri").default';
An.default = ko;
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.CodeGen = e.Name = e.nil = e.stringify = e.str = e._ = e.KeywordCxt = void 0;
  var t = Oe;
  Object.defineProperty(e, "KeywordCxt", { enumerable: !0, get: function() {
    return t.KeywordCxt;
  } });
  var r = z;
  Object.defineProperty(e, "_", { enumerable: !0, get: function() {
    return r._;
  } }), Object.defineProperty(e, "str", { enumerable: !0, get: function() {
    return r.str;
  } }), Object.defineProperty(e, "stringify", { enumerable: !0, get: function() {
    return r.stringify;
  } }), Object.defineProperty(e, "nil", { enumerable: !0, get: function() {
    return r.nil;
  } }), Object.defineProperty(e, "Name", { enumerable: !0, get: function() {
    return r.Name;
  } }), Object.defineProperty(e, "CodeGen", { enumerable: !0, get: function() {
    return r.CodeGen;
  } });
  const n = At, s = yt, a = Ze, o = ve, l = z, i = le, f = ne, c = D, h = tu, P = An, _ = (m, p) => new RegExp(m, p);
  _.code = "new RegExp";
  const R = ["removeAdditional", "useDefaults", "coerceTypes"], v = /* @__PURE__ */ new Set([
    "validate",
    "serialize",
    "parse",
    "wrapper",
    "root",
    "schema",
    "keyword",
    "pattern",
    "formats",
    "validate$data",
    "func",
    "obj",
    "Error"
  ]), w = {
    errorDataPath: "",
    format: "`validateFormats: false` can be used instead.",
    nullable: '"nullable" keyword is supported by default.',
    jsonPointers: "Deprecated jsPropertySyntax can be used instead.",
    extendRefs: "Deprecated ignoreKeywordsWithRef can be used instead.",
    missingRefs: "Pass empty schema with $id that should be ignored to ajv.addSchema.",
    processCode: "Use option `code: {process: (code, schemaEnv: object) => string}`",
    sourceCode: "Use option `code: {source: true}`",
    strictDefaults: "It is default now, see option `strict`.",
    strictKeywords: "It is default now, see option `strict`.",
    uniqueItems: '"uniqueItems" keyword is always validated.',
    unknownFormats: "Disable strict mode or pass `true` to `ajv.addFormat` (or `formats` option).",
    cache: "Map is used as cache, schema object as key.",
    serialize: "Map is used as cache, schema object as key.",
    ajvErrors: "It is default now."
  }, y = {
    ignoreKeywordsWithRef: "",
    jsPropertySyntax: "",
    unicode: '"minLength"/"maxLength" account for unicode characters by default.'
  }, b = 200;
  function I(m) {
    var p, E, $, u, d, S, C, j, q, H, ae, rt, gr, vr, Er, wr, Sr, br, Pr, Rr, Or, Ir, Nr, Tr, Ar;
    const gt = m.strict, jr = (p = m.code) === null || p === void 0 ? void 0 : p.optimize, Es = jr === !0 || jr === void 0 ? 1 : jr || 0, ws = ($ = (E = m.code) === null || E === void 0 ? void 0 : E.regExp) !== null && $ !== void 0 ? $ : _, si = (u = m.uriResolver) !== null && u !== void 0 ? u : P.default;
    return {
      strictSchema: (S = (d = m.strictSchema) !== null && d !== void 0 ? d : gt) !== null && S !== void 0 ? S : !0,
      strictNumbers: (j = (C = m.strictNumbers) !== null && C !== void 0 ? C : gt) !== null && j !== void 0 ? j : !0,
      strictTypes: (H = (q = m.strictTypes) !== null && q !== void 0 ? q : gt) !== null && H !== void 0 ? H : "log",
      strictTuples: (rt = (ae = m.strictTuples) !== null && ae !== void 0 ? ae : gt) !== null && rt !== void 0 ? rt : "log",
      strictRequired: (vr = (gr = m.strictRequired) !== null && gr !== void 0 ? gr : gt) !== null && vr !== void 0 ? vr : !1,
      code: m.code ? { ...m.code, optimize: Es, regExp: ws } : { optimize: Es, regExp: ws },
      loopRequired: (Er = m.loopRequired) !== null && Er !== void 0 ? Er : b,
      loopEnum: (wr = m.loopEnum) !== null && wr !== void 0 ? wr : b,
      meta: (Sr = m.meta) !== null && Sr !== void 0 ? Sr : !0,
      messages: (br = m.messages) !== null && br !== void 0 ? br : !0,
      inlineRefs: (Pr = m.inlineRefs) !== null && Pr !== void 0 ? Pr : !0,
      schemaId: (Rr = m.schemaId) !== null && Rr !== void 0 ? Rr : "$id",
      addUsedSchema: (Or = m.addUsedSchema) !== null && Or !== void 0 ? Or : !0,
      validateSchema: (Ir = m.validateSchema) !== null && Ir !== void 0 ? Ir : !0,
      validateFormats: (Nr = m.validateFormats) !== null && Nr !== void 0 ? Nr : !0,
      unicodeRegExp: (Tr = m.unicodeRegExp) !== null && Tr !== void 0 ? Tr : !0,
      int32range: (Ar = m.int32range) !== null && Ar !== void 0 ? Ar : !0,
      uriResolver: si
    };
  }
  class T {
    constructor(p = {}) {
      this.schemas = {}, this.refs = {}, this.formats = /* @__PURE__ */ Object.create(null), this._compilations = /* @__PURE__ */ new Set(), this._loading = {}, this._cache = /* @__PURE__ */ new Map(), p = this.opts = { ...p, ...I(p) };
      const { es5: E, lines: $ } = this.opts.code;
      this.scope = new l.ValueScope({ scope: {}, prefixes: v, es5: E, lines: $ }), this.logger = x(p.logger);
      const u = p.validateFormats;
      p.validateFormats = !1, this.RULES = (0, a.getRules)(), A.call(this, w, p, "NOT SUPPORTED"), A.call(this, y, p, "DEPRECATED", "warn"), this._metaOpts = F.call(this), p.formats && he.call(this), this._addVocabularies(), this._addDefaultMetaSchema(), p.keywords && L.call(this, p.keywords), typeof p.meta == "object" && this.addMetaSchema(p.meta), K.call(this), p.validateFormats = u;
    }
    _addVocabularies() {
      this.addKeyword("$async");
    }
    _addDefaultMetaSchema() {
      const { $data: p, meta: E, schemaId: $ } = this.opts;
      let u = h;
      $ === "id" && (u = { ...h }, u.id = u.$id, delete u.$id), E && p && this.addMetaSchema(u, u[$], !1);
    }
    defaultMeta() {
      const { meta: p, schemaId: E } = this.opts;
      return this.opts.defaultMeta = typeof p == "object" ? p[E] || p : void 0;
    }
    validate(p, E) {
      let $;
      if (typeof p == "string") {
        if ($ = this.getSchema(p), !$)
          throw new Error(`no schema with key or ref "${p}"`);
      } else
        $ = this.compile(p);
      const u = $(E);
      return "$async" in $ || (this.errors = $.errors), u;
    }
    compile(p, E) {
      const $ = this._addSchema(p, E);
      return $.validate || this._compileSchemaEnv($);
    }
    compileAsync(p, E) {
      if (typeof this.opts.loadSchema != "function")
        throw new Error("options.loadSchema should be a function");
      const { loadSchema: $ } = this.opts;
      return u.call(this, p, E);
      async function u(H, ae) {
        await d.call(this, H.$schema);
        const rt = this._addSchema(H, ae);
        return rt.validate || S.call(this, rt);
      }
      async function d(H) {
        H && !this.getSchema(H) && await u.call(this, { $ref: H }, !0);
      }
      async function S(H) {
        try {
          return this._compileSchemaEnv(H);
        } catch (ae) {
          if (!(ae instanceof s.default))
            throw ae;
          return C.call(this, ae), await j.call(this, ae.missingSchema), S.call(this, H);
        }
      }
      function C({ missingSchema: H, missingRef: ae }) {
        if (this.refs[H])
          throw new Error(`AnySchema ${H} is loaded but ${ae} cannot be resolved`);
      }
      async function j(H) {
        const ae = await q.call(this, H);
        this.refs[H] || await d.call(this, ae.$schema), this.refs[H] || this.addSchema(ae, H, E);
      }
      async function q(H) {
        const ae = this._loading[H];
        if (ae)
          return ae;
        try {
          return await (this._loading[H] = $(H));
        } finally {
          delete this._loading[H];
        }
      }
    }
    // Adds schema to the instance
    addSchema(p, E, $, u = this.opts.validateSchema) {
      if (Array.isArray(p)) {
        for (const S of p)
          this.addSchema(S, void 0, $, u);
        return this;
      }
      let d;
      if (typeof p == "object") {
        const { schemaId: S } = this.opts;
        if (d = p[S], d !== void 0 && typeof d != "string")
          throw new Error(`schema ${S} must be string`);
      }
      return E = (0, i.normalizeId)(E || d), this._checkUnique(E), this.schemas[E] = this._addSchema(p, $, E, u, !0), this;
    }
    // Add schema that will be used to validate other schemas
    // options in META_IGNORE_OPTIONS are alway set to false
    addMetaSchema(p, E, $ = this.opts.validateSchema) {
      return this.addSchema(p, E, !0, $), this;
    }
    //  Validate schema against its meta-schema
    validateSchema(p, E) {
      if (typeof p == "boolean")
        return !0;
      let $;
      if ($ = p.$schema, $ !== void 0 && typeof $ != "string")
        throw new Error("$schema must be a string");
      if ($ = $ || this.opts.defaultMeta || this.defaultMeta(), !$)
        return this.logger.warn("meta-schema not available"), this.errors = null, !0;
      const u = this.validate($, p);
      if (!u && E) {
        const d = "schema is invalid: " + this.errorsText();
        if (this.opts.validateSchema === "log")
          this.logger.error(d);
        else
          throw new Error(d);
      }
      return u;
    }
    // Get compiled schema by `key` or `ref`.
    // (`key` that was passed to `addSchema` or full schema reference - `schema.$id` or resolved id)
    getSchema(p) {
      let E;
      for (; typeof (E = G.call(this, p)) == "string"; )
        p = E;
      if (E === void 0) {
        const { schemaId: $ } = this.opts, u = new o.SchemaEnv({ schema: {}, schemaId: $ });
        if (E = o.resolveSchema.call(this, u, p), !E)
          return;
        this.refs[p] = E;
      }
      return E.validate || this._compileSchemaEnv(E);
    }
    // Remove cached schema(s).
    // If no parameter is passed all schemas but meta-schemas are removed.
    // If RegExp is passed all schemas with key/id matching pattern but meta-schemas are removed.
    // Even if schema is referenced by other schemas it still can be removed as other schemas have local references.
    removeSchema(p) {
      if (p instanceof RegExp)
        return this._removeAllSchemas(this.schemas, p), this._removeAllSchemas(this.refs, p), this;
      switch (typeof p) {
        case "undefined":
          return this._removeAllSchemas(this.schemas), this._removeAllSchemas(this.refs), this._cache.clear(), this;
        case "string": {
          const E = G.call(this, p);
          return typeof E == "object" && this._cache.delete(E.schema), delete this.schemas[p], delete this.refs[p], this;
        }
        case "object": {
          const E = p;
          this._cache.delete(E);
          let $ = p[this.opts.schemaId];
          return $ && ($ = (0, i.normalizeId)($), delete this.schemas[$], delete this.refs[$]), this;
        }
        default:
          throw new Error("ajv.removeSchema: invalid parameter");
      }
    }
    // add "vocabulary" - a collection of keywords
    addVocabulary(p) {
      for (const E of p)
        this.addKeyword(E);
      return this;
    }
    addKeyword(p, E) {
      let $;
      if (typeof p == "string")
        $ = p, typeof E == "object" && (this.logger.warn("these parameters are deprecated, see docs for addKeyword"), E.keyword = $);
      else if (typeof p == "object" && E === void 0) {
        if (E = p, $ = E.keyword, Array.isArray($) && !$.length)
          throw new Error("addKeywords: keyword must be string or non-empty array");
      } else
        throw new Error("invalid addKeywords parameters");
      if (re.call(this, $, E), !E)
        return (0, c.eachItem)($, (d) => ue.call(this, d)), this;
      N.call(this, E);
      const u = {
        ...E,
        type: (0, f.getJSONTypes)(E.type),
        schemaType: (0, f.getJSONTypes)(E.schemaType)
      };
      return (0, c.eachItem)($, u.type.length === 0 ? (d) => ue.call(this, d, u) : (d) => u.type.forEach((S) => ue.call(this, d, u, S))), this;
    }
    getKeyword(p) {
      const E = this.RULES.all[p];
      return typeof E == "object" ? E.definition : !!E;
    }
    // Remove keyword
    removeKeyword(p) {
      const { RULES: E } = this;
      delete E.keywords[p], delete E.all[p];
      for (const $ of E.rules) {
        const u = $.rules.findIndex((d) => d.keyword === p);
        u >= 0 && $.rules.splice(u, 1);
      }
      return this;
    }
    // Add format
    addFormat(p, E) {
      return typeof E == "string" && (E = new RegExp(E)), this.formats[p] = E, this;
    }
    errorsText(p = this.errors, { separator: E = ", ", dataVar: $ = "data" } = {}) {
      return !p || p.length === 0 ? "No errors" : p.map((u) => `${$}${u.instancePath} ${u.message}`).reduce((u, d) => u + E + d);
    }
    $dataMetaSchema(p, E) {
      const $ = this.RULES.all;
      p = JSON.parse(JSON.stringify(p));
      for (const u of E) {
        const d = u.split("/").slice(1);
        let S = p;
        for (const C of d)
          S = S[C];
        for (const C in $) {
          const j = $[C];
          if (typeof j != "object")
            continue;
          const { $data: q } = j.definition, H = S[C];
          q && H && (S[C] = O(H));
        }
      }
      return p;
    }
    _removeAllSchemas(p, E) {
      for (const $ in p) {
        const u = p[$];
        (!E || E.test($)) && (typeof u == "string" ? delete p[$] : u && !u.meta && (this._cache.delete(u.schema), delete p[$]));
      }
    }
    _addSchema(p, E, $, u = this.opts.validateSchema, d = this.opts.addUsedSchema) {
      let S;
      const { schemaId: C } = this.opts;
      if (typeof p == "object")
        S = p[C];
      else {
        if (this.opts.jtd)
          throw new Error("schema must be object");
        if (typeof p != "boolean")
          throw new Error("schema must be object or boolean");
      }
      let j = this._cache.get(p);
      if (j !== void 0)
        return j;
      $ = (0, i.normalizeId)(S || $);
      const q = i.getSchemaRefs.call(this, p, $);
      return j = new o.SchemaEnv({ schema: p, schemaId: C, meta: E, baseId: $, localRefs: q }), this._cache.set(j.schema, j), d && !$.startsWith("#") && ($ && this._checkUnique($), this.refs[$] = j), u && this.validateSchema(p, !0), j;
    }
    _checkUnique(p) {
      if (this.schemas[p] || this.refs[p])
        throw new Error(`schema with key or id "${p}" already exists`);
    }
    _compileSchemaEnv(p) {
      if (p.meta ? this._compileMetaSchema(p) : o.compileSchema.call(this, p), !p.validate)
        throw new Error("ajv implementation error");
      return p.validate;
    }
    _compileMetaSchema(p) {
      const E = this.opts;
      this.opts = this._metaOpts;
      try {
        o.compileSchema.call(this, p);
      } finally {
        this.opts = E;
      }
    }
  }
  T.ValidationError = n.default, T.MissingRefError = s.default, e.default = T;
  function A(m, p, E, $ = "error") {
    for (const u in m) {
      const d = u;
      d in p && this.logger[$](`${E}: option ${u}. ${m[d]}`);
    }
  }
  function G(m) {
    return m = (0, i.normalizeId)(m), this.schemas[m] || this.refs[m];
  }
  function K() {
    const m = this.opts.schemas;
    if (m)
      if (Array.isArray(m))
        this.addSchema(m);
      else
        for (const p in m)
          this.addSchema(m[p], p);
  }
  function he() {
    for (const m in this.opts.formats) {
      const p = this.opts.formats[m];
      p && this.addFormat(m, p);
    }
  }
  function L(m) {
    if (Array.isArray(m)) {
      this.addVocabulary(m);
      return;
    }
    this.logger.warn("keywords option as map is deprecated, pass array");
    for (const p in m) {
      const E = m[p];
      E.keyword || (E.keyword = p), this.addKeyword(E);
    }
  }
  function F() {
    const m = { ...this.opts };
    for (const p of R)
      delete m[p];
    return m;
  }
  const Z = { log() {
  }, warn() {
  }, error() {
  } };
  function x(m) {
    if (m === !1)
      return Z;
    if (m === void 0)
      return console;
    if (m.log && m.warn && m.error)
      return m;
    throw new Error("logger must implement log, warn and error methods");
  }
  const se = /^[a-z_$][a-z0-9_$:-]*$/i;
  function re(m, p) {
    const { RULES: E } = this;
    if ((0, c.eachItem)(m, ($) => {
      if (E.keywords[$])
        throw new Error(`Keyword ${$} is already defined`);
      if (!se.test($))
        throw new Error(`Keyword ${$} has invalid name`);
    }), !!p && p.$data && !("code" in p || "validate" in p))
      throw new Error('$data keyword must have "code" or "validate" function');
  }
  function ue(m, p, E) {
    var $;
    const u = p == null ? void 0 : p.post;
    if (E && u)
      throw new Error('keyword with "post" flag cannot have "type"');
    const { RULES: d } = this;
    let S = u ? d.post : d.rules.find(({ type: j }) => j === E);
    if (S || (S = { type: E, rules: [] }, d.rules.push(S)), d.keywords[m] = !0, !p)
      return;
    const C = {
      keyword: m,
      definition: {
        ...p,
        type: (0, f.getJSONTypes)(p.type),
        schemaType: (0, f.getJSONTypes)(p.schemaType)
      }
    };
    p.before ? Te.call(this, S, C, p.before) : S.rules.push(C), d.all[m] = C, ($ = p.implements) === null || $ === void 0 || $.forEach((j) => this.addKeyword(j));
  }
  function Te(m, p, E) {
    const $ = m.rules.findIndex((u) => u.keyword === E);
    $ >= 0 ? m.rules.splice($, 0, p) : (m.rules.push(p), this.logger.warn(`rule ${E} is not defined`));
  }
  function N(m) {
    let { metaSchema: p } = m;
    p !== void 0 && (m.$data && this.opts.$data && (p = O(p)), m.validateSchema = this.compile(p, !0));
  }
  const g = {
    $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#"
  };
  function O(m) {
    return { anyOf: [m, g] };
  }
})(Va);
var kn = {}, Ln = {}, Mn = {};
Object.defineProperty(Mn, "__esModule", { value: !0 });
const Ku = {
  keyword: "id",
  code() {
    throw new Error('NOT SUPPORTED: keyword "id", use "$id" for schema ID');
  }
};
Mn.default = Ku;
var et = {};
Object.defineProperty(et, "__esModule", { value: !0 });
et.callRef = et.getValidate = void 0;
const xu = yt, Ms = V, ge = z, st = Le, Fs = ve, Ft = D, Wu = {
  keyword: "$ref",
  schemaType: "string",
  code(e) {
    const { gen: t, schema: r, it: n } = e, { baseId: s, schemaEnv: a, validateName: o, opts: l, self: i } = n, { root: f } = a;
    if ((r === "#" || r === "#/") && s === f.baseId)
      return h();
    const c = Fs.resolveRef.call(i, f, s, r);
    if (c === void 0)
      throw new xu.default(n.opts.uriResolver, s, r);
    if (c instanceof Fs.SchemaEnv)
      return P(c);
    return _(c);
    function h() {
      if (a === f)
        return Jt(e, o, a, a.$async);
      const R = t.scopeValue("root", { ref: f });
      return Jt(e, (0, ge._)`${R}.validate`, f, f.$async);
    }
    function P(R) {
      const v = Lo(e, R);
      Jt(e, v, R, R.$async);
    }
    function _(R) {
      const v = t.scopeValue("schema", l.code.source === !0 ? { ref: R, code: (0, ge.stringify)(R) } : { ref: R }), w = t.name("valid"), y = e.subschema({
        schema: R,
        dataTypes: [],
        schemaPath: ge.nil,
        topSchemaRef: v,
        errSchemaPath: r
      }, w);
      e.mergeEvaluated(y), e.ok(w);
    }
  }
};
function Lo(e, t) {
  const { gen: r } = e;
  return t.validate ? r.scopeValue("validate", { ref: t.validate }) : (0, ge._)`${r.scopeValue("wrapper", { ref: t })}.validate`;
}
et.getValidate = Lo;
function Jt(e, t, r, n) {
  const { gen: s, it: a } = e, { allErrors: o, schemaEnv: l, opts: i } = a, f = i.passContext ? st.default.this : ge.nil;
  n ? c() : h();
  function c() {
    if (!l.$async)
      throw new Error("async schema referenced by sync schema");
    const R = s.let("valid");
    s.try(() => {
      s.code((0, ge._)`await ${(0, Ms.callValidateCode)(e, t, f)}`), _(t), o || s.assign(R, !0);
    }, (v) => {
      s.if((0, ge._)`!(${v} instanceof ${a.ValidationError})`, () => s.throw(v)), P(v), o || s.assign(R, !1);
    }), e.ok(R);
  }
  function h() {
    e.result((0, Ms.callValidateCode)(e, t, f), () => _(t), () => P(t));
  }
  function P(R) {
    const v = (0, ge._)`${R}.errors`;
    s.assign(st.default.vErrors, (0, ge._)`${st.default.vErrors} === null ? ${v} : ${st.default.vErrors}.concat(${v})`), s.assign(st.default.errors, (0, ge._)`${st.default.vErrors}.length`);
  }
  function _(R) {
    var v;
    if (!a.opts.unevaluated)
      return;
    const w = (v = r == null ? void 0 : r.validate) === null || v === void 0 ? void 0 : v.evaluated;
    if (a.props !== !0)
      if (w && !w.dynamicProps)
        w.props !== void 0 && (a.props = Ft.mergeEvaluated.props(s, w.props, a.props));
      else {
        const y = s.var("props", (0, ge._)`${R}.evaluated.props`);
        a.props = Ft.mergeEvaluated.props(s, y, a.props, ge.Name);
      }
    if (a.items !== !0)
      if (w && !w.dynamicItems)
        w.items !== void 0 && (a.items = Ft.mergeEvaluated.items(s, w.items, a.items));
      else {
        const y = s.var("items", (0, ge._)`${R}.evaluated.items`);
        a.items = Ft.mergeEvaluated.items(s, y, a.items, ge.Name);
      }
  }
}
et.callRef = Jt;
et.default = Wu;
Object.defineProperty(Ln, "__esModule", { value: !0 });
const Xu = Mn, Bu = et, Yu = [
  "$schema",
  "$id",
  "$defs",
  "$vocabulary",
  { keyword: "$comment" },
  "definitions",
  Xu.default,
  Bu.default
];
Ln.default = Yu;
var Fn = {}, Un = {};
Object.defineProperty(Un, "__esModule", { value: !0 });
const nr = z, ze = nr.operators, sr = {
  maximum: { okStr: "<=", ok: ze.LTE, fail: ze.GT },
  minimum: { okStr: ">=", ok: ze.GTE, fail: ze.LT },
  exclusiveMaximum: { okStr: "<", ok: ze.LT, fail: ze.GTE },
  exclusiveMinimum: { okStr: ">", ok: ze.GT, fail: ze.LTE }
}, Ju = {
  message: ({ keyword: e, schemaCode: t }) => (0, nr.str)`must be ${sr[e].okStr} ${t}`,
  params: ({ keyword: e, schemaCode: t }) => (0, nr._)`{comparison: ${sr[e].okStr}, limit: ${t}}`
}, Zu = {
  keyword: Object.keys(sr),
  type: "number",
  schemaType: "number",
  $data: !0,
  error: Ju,
  code(e) {
    const { keyword: t, data: r, schemaCode: n } = e;
    e.fail$data((0, nr._)`${r} ${sr[t].fail} ${n} || isNaN(${r})`);
  }
};
Un.default = Zu;
var zn = {};
Object.defineProperty(zn, "__esModule", { value: !0 });
const Pt = z, Qu = {
  message: ({ schemaCode: e }) => (0, Pt.str)`must be multiple of ${e}`,
  params: ({ schemaCode: e }) => (0, Pt._)`{multipleOf: ${e}}`
}, ef = {
  keyword: "multipleOf",
  type: "number",
  schemaType: "number",
  $data: !0,
  error: Qu,
  code(e) {
    const { gen: t, data: r, schemaCode: n, it: s } = e, a = s.opts.multipleOfPrecision, o = t.let("res"), l = a ? (0, Pt._)`Math.abs(Math.round(${o}) - ${o}) > 1e-${a}` : (0, Pt._)`${o} !== parseInt(${o})`;
    e.fail$data((0, Pt._)`(${n} === 0 || (${o} = ${r}/${n}, ${l}))`);
  }
};
zn.default = ef;
var Vn = {}, qn = {};
Object.defineProperty(qn, "__esModule", { value: !0 });
function Mo(e) {
  const t = e.length;
  let r = 0, n = 0, s;
  for (; n < t; )
    r++, s = e.charCodeAt(n++), s >= 55296 && s <= 56319 && n < t && (s = e.charCodeAt(n), (s & 64512) === 56320 && n++);
  return r;
}
qn.default = Mo;
Mo.code = 'require("ajv/dist/runtime/ucs2length").default';
Object.defineProperty(Vn, "__esModule", { value: !0 });
const Ye = z, tf = D, rf = qn, nf = {
  message({ keyword: e, schemaCode: t }) {
    const r = e === "maxLength" ? "more" : "fewer";
    return (0, Ye.str)`must NOT have ${r} than ${t} characters`;
  },
  params: ({ schemaCode: e }) => (0, Ye._)`{limit: ${e}}`
}, sf = {
  keyword: ["maxLength", "minLength"],
  type: "string",
  schemaType: "number",
  $data: !0,
  error: nf,
  code(e) {
    const { keyword: t, data: r, schemaCode: n, it: s } = e, a = t === "maxLength" ? Ye.operators.GT : Ye.operators.LT, o = s.opts.unicode === !1 ? (0, Ye._)`${r}.length` : (0, Ye._)`${(0, tf.useFunc)(e.gen, rf.default)}(${r})`;
    e.fail$data((0, Ye._)`${o} ${a} ${n}`);
  }
};
Vn.default = sf;
var Gn = {};
Object.defineProperty(Gn, "__esModule", { value: !0 });
const af = V, of = D, it = z, cf = {
  message: ({ schemaCode: e }) => (0, it.str)`must match pattern "${e}"`,
  params: ({ schemaCode: e }) => (0, it._)`{pattern: ${e}}`
}, lf = {
  keyword: "pattern",
  type: "string",
  schemaType: "string",
  $data: !0,
  error: cf,
  code(e) {
    const { gen: t, data: r, $data: n, schema: s, schemaCode: a, it: o } = e, l = o.opts.unicodeRegExp ? "u" : "";
    if (n) {
      const { regExp: i } = o.opts.code, f = i.code === "new RegExp" ? (0, it._)`new RegExp` : (0, of.useFunc)(t, i), c = t.let("valid");
      t.try(() => t.assign(c, (0, it._)`${f}(${a}, ${l}).test(${r})`), () => t.assign(c, !1)), e.fail$data((0, it._)`!${c}`);
    } else {
      const i = (0, af.usePattern)(e, s);
      e.fail$data((0, it._)`!${i}.test(${r})`);
    }
  }
};
Gn.default = lf;
var Hn = {};
Object.defineProperty(Hn, "__esModule", { value: !0 });
const Rt = z, uf = {
  message({ keyword: e, schemaCode: t }) {
    const r = e === "maxProperties" ? "more" : "fewer";
    return (0, Rt.str)`must NOT have ${r} than ${t} properties`;
  },
  params: ({ schemaCode: e }) => (0, Rt._)`{limit: ${e}}`
}, ff = {
  keyword: ["maxProperties", "minProperties"],
  type: "object",
  schemaType: "number",
  $data: !0,
  error: uf,
  code(e) {
    const { keyword: t, data: r, schemaCode: n } = e, s = t === "maxProperties" ? Rt.operators.GT : Rt.operators.LT;
    e.fail$data((0, Rt._)`Object.keys(${r}).length ${s} ${n}`);
  }
};
Hn.default = ff;
var Kn = {};
Object.defineProperty(Kn, "__esModule", { value: !0 });
const Et = V, Ot = z, df = D, hf = {
  message: ({ params: { missingProperty: e } }) => (0, Ot.str)`must have required property '${e}'`,
  params: ({ params: { missingProperty: e } }) => (0, Ot._)`{missingProperty: ${e}}`
}, pf = {
  keyword: "required",
  type: "object",
  schemaType: "array",
  $data: !0,
  error: hf,
  code(e) {
    const { gen: t, schema: r, schemaCode: n, data: s, $data: a, it: o } = e, { opts: l } = o;
    if (!a && r.length === 0)
      return;
    const i = r.length >= l.loopRequired;
    if (o.allErrors ? f() : c(), l.strictRequired) {
      const _ = e.parentSchema.properties, { definedProperties: R } = e.it;
      for (const v of r)
        if ((_ == null ? void 0 : _[v]) === void 0 && !R.has(v)) {
          const w = o.schemaEnv.baseId + o.errSchemaPath, y = `required property "${v}" is not defined at "${w}" (strictRequired)`;
          (0, df.checkStrictMode)(o, y, o.opts.strictRequired);
        }
    }
    function f() {
      if (i || a)
        e.block$data(Ot.nil, h);
      else
        for (const _ of r)
          (0, Et.checkReportMissingProp)(e, _);
    }
    function c() {
      const _ = t.let("missing");
      if (i || a) {
        const R = t.let("valid", !0);
        e.block$data(R, () => P(_, R)), e.ok(R);
      } else
        t.if((0, Et.checkMissingProp)(e, r, _)), (0, Et.reportMissingProp)(e, _), t.else();
    }
    function h() {
      t.forOf("prop", n, (_) => {
        e.setParams({ missingProperty: _ }), t.if((0, Et.noPropertyInData)(t, s, _, l.ownProperties), () => e.error());
      });
    }
    function P(_, R) {
      e.setParams({ missingProperty: _ }), t.forOf(_, n, () => {
        t.assign(R, (0, Et.propertyInData)(t, s, _, l.ownProperties)), t.if((0, Ot.not)(R), () => {
          e.error(), t.break();
        });
      }, Ot.nil);
    }
  }
};
Kn.default = pf;
var xn = {};
Object.defineProperty(xn, "__esModule", { value: !0 });
const It = z, mf = {
  message({ keyword: e, schemaCode: t }) {
    const r = e === "maxItems" ? "more" : "fewer";
    return (0, It.str)`must NOT have ${r} than ${t} items`;
  },
  params: ({ schemaCode: e }) => (0, It._)`{limit: ${e}}`
}, yf = {
  keyword: ["maxItems", "minItems"],
  type: "array",
  schemaType: "number",
  $data: !0,
  error: mf,
  code(e) {
    const { keyword: t, data: r, schemaCode: n } = e, s = t === "maxItems" ? It.operators.GT : It.operators.LT;
    e.fail$data((0, It._)`${r}.length ${s} ${n}`);
  }
};
xn.default = yf;
var Wn = {}, jt = {};
Object.defineProperty(jt, "__esModule", { value: !0 });
const Fo = no;
Fo.code = 'require("ajv/dist/runtime/equal").default';
jt.default = Fo;
Object.defineProperty(Wn, "__esModule", { value: !0 });
const Lr = ne, ie = z, $f = D, _f = jt, gf = {
  message: ({ params: { i: e, j: t } }) => (0, ie.str)`must NOT have duplicate items (items ## ${t} and ${e} are identical)`,
  params: ({ params: { i: e, j: t } }) => (0, ie._)`{i: ${e}, j: ${t}}`
}, vf = {
  keyword: "uniqueItems",
  type: "array",
  schemaType: "boolean",
  $data: !0,
  error: gf,
  code(e) {
    const { gen: t, data: r, $data: n, schema: s, parentSchema: a, schemaCode: o, it: l } = e;
    if (!n && !s)
      return;
    const i = t.let("valid"), f = a.items ? (0, Lr.getSchemaTypes)(a.items) : [];
    e.block$data(i, c, (0, ie._)`${o} === false`), e.ok(i);
    function c() {
      const R = t.let("i", (0, ie._)`${r}.length`), v = t.let("j");
      e.setParams({ i: R, j: v }), t.assign(i, !0), t.if((0, ie._)`${R} > 1`, () => (h() ? P : _)(R, v));
    }
    function h() {
      return f.length > 0 && !f.some((R) => R === "object" || R === "array");
    }
    function P(R, v) {
      const w = t.name("item"), y = (0, Lr.checkDataTypes)(f, w, l.opts.strictNumbers, Lr.DataType.Wrong), b = t.const("indices", (0, ie._)`{}`);
      t.for((0, ie._)`;${R}--;`, () => {
        t.let(w, (0, ie._)`${r}[${R}]`), t.if(y, (0, ie._)`continue`), f.length > 1 && t.if((0, ie._)`typeof ${w} == "string"`, (0, ie._)`${w} += "_"`), t.if((0, ie._)`typeof ${b}[${w}] == "number"`, () => {
          t.assign(v, (0, ie._)`${b}[${w}]`), e.error(), t.assign(i, !1).break();
        }).code((0, ie._)`${b}[${w}] = ${R}`);
      });
    }
    function _(R, v) {
      const w = (0, $f.useFunc)(t, _f.default), y = t.name("outer");
      t.label(y).for((0, ie._)`;${R}--;`, () => t.for((0, ie._)`${v} = ${R}; ${v}--;`, () => t.if((0, ie._)`${w}(${r}[${R}], ${r}[${v}])`, () => {
        e.error(), t.assign(i, !1).break(y);
      })));
    }
  }
};
Wn.default = vf;
var Xn = {};
Object.defineProperty(Xn, "__esModule", { value: !0 });
const Qr = z, Ef = D, wf = jt, Sf = {
  message: "must be equal to constant",
  params: ({ schemaCode: e }) => (0, Qr._)`{allowedValue: ${e}}`
}, bf = {
  keyword: "const",
  $data: !0,
  error: Sf,
  code(e) {
    const { gen: t, data: r, $data: n, schemaCode: s, schema: a } = e;
    n || a && typeof a == "object" ? e.fail$data((0, Qr._)`!${(0, Ef.useFunc)(t, wf.default)}(${r}, ${s})`) : e.fail((0, Qr._)`${a} !== ${r}`);
  }
};
Xn.default = bf;
var Bn = {};
Object.defineProperty(Bn, "__esModule", { value: !0 });
const St = z, Pf = D, Rf = jt, Of = {
  message: "must be equal to one of the allowed values",
  params: ({ schemaCode: e }) => (0, St._)`{allowedValues: ${e}}`
}, If = {
  keyword: "enum",
  schemaType: "array",
  $data: !0,
  error: Of,
  code(e) {
    const { gen: t, data: r, $data: n, schema: s, schemaCode: a, it: o } = e;
    if (!n && s.length === 0)
      throw new Error("enum must have non-empty array");
    const l = s.length >= o.opts.loopEnum;
    let i;
    const f = () => i ?? (i = (0, Pf.useFunc)(t, Rf.default));
    let c;
    if (l || n)
      c = t.let("valid"), e.block$data(c, h);
    else {
      if (!Array.isArray(s))
        throw new Error("ajv implementation error");
      const _ = t.const("vSchema", a);
      c = (0, St.or)(...s.map((R, v) => P(_, v)));
    }
    e.pass(c);
    function h() {
      t.assign(c, !1), t.forOf("v", a, (_) => t.if((0, St._)`${f()}(${r}, ${_})`, () => t.assign(c, !0).break()));
    }
    function P(_, R) {
      const v = s[R];
      return typeof v == "object" && v !== null ? (0, St._)`${f()}(${r}, ${_}[${R}])` : (0, St._)`${r} === ${v}`;
    }
  }
};
Bn.default = If;
Object.defineProperty(Fn, "__esModule", { value: !0 });
const Nf = Un, Tf = zn, Af = Vn, jf = Gn, Cf = Hn, Df = Kn, kf = xn, Lf = Wn, Mf = Xn, Ff = Bn, Uf = [
  // number
  Nf.default,
  Tf.default,
  // string
  Af.default,
  jf.default,
  // object
  Cf.default,
  Df.default,
  // array
  kf.default,
  Lf.default,
  // any
  { keyword: "type", schemaType: ["string", "array"] },
  { keyword: "nullable", schemaType: "boolean" },
  Mf.default,
  Ff.default
];
Fn.default = Uf;
var Yn = {}, $t = {};
Object.defineProperty($t, "__esModule", { value: !0 });
$t.validateAdditionalItems = void 0;
const Je = z, en = D, zf = {
  message: ({ params: { len: e } }) => (0, Je.str)`must NOT have more than ${e} items`,
  params: ({ params: { len: e } }) => (0, Je._)`{limit: ${e}}`
}, Vf = {
  keyword: "additionalItems",
  type: "array",
  schemaType: ["boolean", "object"],
  before: "uniqueItems",
  error: zf,
  code(e) {
    const { parentSchema: t, it: r } = e, { items: n } = t;
    if (!Array.isArray(n)) {
      (0, en.checkStrictMode)(r, '"additionalItems" is ignored when "items" is not an array of schemas');
      return;
    }
    Uo(e, n);
  }
};
function Uo(e, t) {
  const { gen: r, schema: n, data: s, keyword: a, it: o } = e;
  o.items = !0;
  const l = r.const("len", (0, Je._)`${s}.length`);
  if (n === !1)
    e.setParams({ len: t.length }), e.pass((0, Je._)`${l} <= ${t.length}`);
  else if (typeof n == "object" && !(0, en.alwaysValidSchema)(o, n)) {
    const f = r.var("valid", (0, Je._)`${l} <= ${t.length}`);
    r.if((0, Je.not)(f), () => i(f)), e.ok(f);
  }
  function i(f) {
    r.forRange("i", t.length, l, (c) => {
      e.subschema({ keyword: a, dataProp: c, dataPropType: en.Type.Num }, f), o.allErrors || r.if((0, Je.not)(f), () => r.break());
    });
  }
}
$t.validateAdditionalItems = Uo;
$t.default = Vf;
var Jn = {}, _t = {};
Object.defineProperty(_t, "__esModule", { value: !0 });
_t.validateTuple = void 0;
const Us = z, Zt = D, qf = V, Gf = {
  keyword: "items",
  type: "array",
  schemaType: ["object", "array", "boolean"],
  before: "uniqueItems",
  code(e) {
    const { schema: t, it: r } = e;
    if (Array.isArray(t))
      return zo(e, "additionalItems", t);
    r.items = !0, !(0, Zt.alwaysValidSchema)(r, t) && e.ok((0, qf.validateArray)(e));
  }
};
function zo(e, t, r = e.schema) {
  const { gen: n, parentSchema: s, data: a, keyword: o, it: l } = e;
  c(s), l.opts.unevaluated && r.length && l.items !== !0 && (l.items = Zt.mergeEvaluated.items(n, r.length, l.items));
  const i = n.name("valid"), f = n.const("len", (0, Us._)`${a}.length`);
  r.forEach((h, P) => {
    (0, Zt.alwaysValidSchema)(l, h) || (n.if((0, Us._)`${f} > ${P}`, () => e.subschema({
      keyword: o,
      schemaProp: P,
      dataProp: P
    }, i)), e.ok(i));
  });
  function c(h) {
    const { opts: P, errSchemaPath: _ } = l, R = r.length, v = R === h.minItems && (R === h.maxItems || h[t] === !1);
    if (P.strictTuples && !v) {
      const w = `"${o}" is ${R}-tuple, but minItems or maxItems/${t} are not specified or different at path "${_}"`;
      (0, Zt.checkStrictMode)(l, w, P.strictTuples);
    }
  }
}
_t.validateTuple = zo;
_t.default = Gf;
Object.defineProperty(Jn, "__esModule", { value: !0 });
const Hf = _t, Kf = {
  keyword: "prefixItems",
  type: "array",
  schemaType: ["array"],
  before: "uniqueItems",
  code: (e) => (0, Hf.validateTuple)(e, "items")
};
Jn.default = Kf;
var Zn = {};
Object.defineProperty(Zn, "__esModule", { value: !0 });
const zs = z, xf = D, Wf = V, Xf = $t, Bf = {
  message: ({ params: { len: e } }) => (0, zs.str)`must NOT have more than ${e} items`,
  params: ({ params: { len: e } }) => (0, zs._)`{limit: ${e}}`
}, Yf = {
  keyword: "items",
  type: "array",
  schemaType: ["object", "boolean"],
  before: "uniqueItems",
  error: Bf,
  code(e) {
    const { schema: t, parentSchema: r, it: n } = e, { prefixItems: s } = r;
    n.items = !0, !(0, xf.alwaysValidSchema)(n, t) && (s ? (0, Xf.validateAdditionalItems)(e, s) : e.ok((0, Wf.validateArray)(e)));
  }
};
Zn.default = Yf;
var Qn = {};
Object.defineProperty(Qn, "__esModule", { value: !0 });
const Se = z, Ut = D, Jf = {
  message: ({ params: { min: e, max: t } }) => t === void 0 ? (0, Se.str)`must contain at least ${e} valid item(s)` : (0, Se.str)`must contain at least ${e} and no more than ${t} valid item(s)`,
  params: ({ params: { min: e, max: t } }) => t === void 0 ? (0, Se._)`{minContains: ${e}}` : (0, Se._)`{minContains: ${e}, maxContains: ${t}}`
}, Zf = {
  keyword: "contains",
  type: "array",
  schemaType: ["object", "boolean"],
  before: "uniqueItems",
  trackErrors: !0,
  error: Jf,
  code(e) {
    const { gen: t, schema: r, parentSchema: n, data: s, it: a } = e;
    let o, l;
    const { minContains: i, maxContains: f } = n;
    a.opts.next ? (o = i === void 0 ? 1 : i, l = f) : o = 1;
    const c = t.const("len", (0, Se._)`${s}.length`);
    if (e.setParams({ min: o, max: l }), l === void 0 && o === 0) {
      (0, Ut.checkStrictMode)(a, '"minContains" == 0 without "maxContains": "contains" keyword ignored');
      return;
    }
    if (l !== void 0 && o > l) {
      (0, Ut.checkStrictMode)(a, '"minContains" > "maxContains" is always invalid'), e.fail();
      return;
    }
    if ((0, Ut.alwaysValidSchema)(a, r)) {
      let v = (0, Se._)`${c} >= ${o}`;
      l !== void 0 && (v = (0, Se._)`${v} && ${c} <= ${l}`), e.pass(v);
      return;
    }
    a.items = !0;
    const h = t.name("valid");
    l === void 0 && o === 1 ? _(h, () => t.if(h, () => t.break())) : o === 0 ? (t.let(h, !0), l !== void 0 && t.if((0, Se._)`${s}.length > 0`, P)) : (t.let(h, !1), P()), e.result(h, () => e.reset());
    function P() {
      const v = t.name("_valid"), w = t.let("count", 0);
      _(v, () => t.if(v, () => R(w)));
    }
    function _(v, w) {
      t.forRange("i", 0, c, (y) => {
        e.subschema({
          keyword: "contains",
          dataProp: y,
          dataPropType: Ut.Type.Num,
          compositeRule: !0
        }, v), w();
      });
    }
    function R(v) {
      t.code((0, Se._)`${v}++`), l === void 0 ? t.if((0, Se._)`${v} >= ${o}`, () => t.assign(h, !0).break()) : (t.if((0, Se._)`${v} > ${l}`, () => t.assign(h, !1).break()), o === 1 ? t.assign(h, !0) : t.if((0, Se._)`${v} >= ${o}`, () => t.assign(h, !0)));
    }
  }
};
Qn.default = Zf;
var Vo = {};
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.validateSchemaDeps = e.validatePropertyDeps = e.error = void 0;
  const t = z, r = D, n = V;
  e.error = {
    message: ({ params: { property: i, depsCount: f, deps: c } }) => {
      const h = f === 1 ? "property" : "properties";
      return (0, t.str)`must have ${h} ${c} when property ${i} is present`;
    },
    params: ({ params: { property: i, depsCount: f, deps: c, missingProperty: h } }) => (0, t._)`{property: ${i},
    missingProperty: ${h},
    depsCount: ${f},
    deps: ${c}}`
    // TODO change to reference
  };
  const s = {
    keyword: "dependencies",
    type: "object",
    schemaType: "object",
    error: e.error,
    code(i) {
      const [f, c] = a(i);
      o(i, f), l(i, c);
    }
  };
  function a({ schema: i }) {
    const f = {}, c = {};
    for (const h in i) {
      if (h === "__proto__")
        continue;
      const P = Array.isArray(i[h]) ? f : c;
      P[h] = i[h];
    }
    return [f, c];
  }
  function o(i, f = i.schema) {
    const { gen: c, data: h, it: P } = i;
    if (Object.keys(f).length === 0)
      return;
    const _ = c.let("missing");
    for (const R in f) {
      const v = f[R];
      if (v.length === 0)
        continue;
      const w = (0, n.propertyInData)(c, h, R, P.opts.ownProperties);
      i.setParams({
        property: R,
        depsCount: v.length,
        deps: v.join(", ")
      }), P.allErrors ? c.if(w, () => {
        for (const y of v)
          (0, n.checkReportMissingProp)(i, y);
      }) : (c.if((0, t._)`${w} && (${(0, n.checkMissingProp)(i, v, _)})`), (0, n.reportMissingProp)(i, _), c.else());
    }
  }
  e.validatePropertyDeps = o;
  function l(i, f = i.schema) {
    const { gen: c, data: h, keyword: P, it: _ } = i, R = c.name("valid");
    for (const v in f)
      (0, r.alwaysValidSchema)(_, f[v]) || (c.if(
        (0, n.propertyInData)(c, h, v, _.opts.ownProperties),
        () => {
          const w = i.subschema({ keyword: P, schemaProp: v }, R);
          i.mergeValidEvaluated(w, R);
        },
        () => c.var(R, !0)
        // TODO var
      ), i.ok(R));
  }
  e.validateSchemaDeps = l, e.default = s;
})(Vo);
var es = {};
Object.defineProperty(es, "__esModule", { value: !0 });
const qo = z, Qf = D, ed = {
  message: "property name must be valid",
  params: ({ params: e }) => (0, qo._)`{propertyName: ${e.propertyName}}`
}, td = {
  keyword: "propertyNames",
  type: "object",
  schemaType: ["object", "boolean"],
  error: ed,
  code(e) {
    const { gen: t, schema: r, data: n, it: s } = e;
    if ((0, Qf.alwaysValidSchema)(s, r))
      return;
    const a = t.name("valid");
    t.forIn("key", n, (o) => {
      e.setParams({ propertyName: o }), e.subschema({
        keyword: "propertyNames",
        data: o,
        dataTypes: ["string"],
        propertyName: o,
        compositeRule: !0
      }, a), t.if((0, qo.not)(a), () => {
        e.error(!0), s.allErrors || t.break();
      });
    }), e.ok(a);
  }
};
es.default = td;
var dr = {};
Object.defineProperty(dr, "__esModule", { value: !0 });
const zt = V, Pe = z, rd = Le, Vt = D, nd = {
  message: "must NOT have additional properties",
  params: ({ params: e }) => (0, Pe._)`{additionalProperty: ${e.additionalProperty}}`
}, sd = {
  keyword: "additionalProperties",
  type: ["object"],
  schemaType: ["boolean", "object"],
  allowUndefined: !0,
  trackErrors: !0,
  error: nd,
  code(e) {
    const { gen: t, schema: r, parentSchema: n, data: s, errsCount: a, it: o } = e;
    if (!a)
      throw new Error("ajv implementation error");
    const { allErrors: l, opts: i } = o;
    if (o.props = !0, i.removeAdditional !== "all" && (0, Vt.alwaysValidSchema)(o, r))
      return;
    const f = (0, zt.allSchemaProperties)(n.properties), c = (0, zt.allSchemaProperties)(n.patternProperties);
    h(), e.ok((0, Pe._)`${a} === ${rd.default.errors}`);
    function h() {
      t.forIn("key", s, (w) => {
        !f.length && !c.length ? R(w) : t.if(P(w), () => R(w));
      });
    }
    function P(w) {
      let y;
      if (f.length > 8) {
        const b = (0, Vt.schemaRefOrVal)(o, n.properties, "properties");
        y = (0, zt.isOwnProperty)(t, b, w);
      } else f.length ? y = (0, Pe.or)(...f.map((b) => (0, Pe._)`${w} === ${b}`)) : y = Pe.nil;
      return c.length && (y = (0, Pe.or)(y, ...c.map((b) => (0, Pe._)`${(0, zt.usePattern)(e, b)}.test(${w})`))), (0, Pe.not)(y);
    }
    function _(w) {
      t.code((0, Pe._)`delete ${s}[${w}]`);
    }
    function R(w) {
      if (i.removeAdditional === "all" || i.removeAdditional && r === !1) {
        _(w);
        return;
      }
      if (r === !1) {
        e.setParams({ additionalProperty: w }), e.error(), l || t.break();
        return;
      }
      if (typeof r == "object" && !(0, Vt.alwaysValidSchema)(o, r)) {
        const y = t.name("valid");
        i.removeAdditional === "failing" ? (v(w, y, !1), t.if((0, Pe.not)(y), () => {
          e.reset(), _(w);
        })) : (v(w, y), l || t.if((0, Pe.not)(y), () => t.break()));
      }
    }
    function v(w, y, b) {
      const I = {
        keyword: "additionalProperties",
        dataProp: w,
        dataPropType: Vt.Type.Str
      };
      b === !1 && Object.assign(I, {
        compositeRule: !0,
        createErrors: !1,
        allErrors: !1
      }), e.subschema(I, y);
    }
  }
};
dr.default = sd;
var ts = {};
Object.defineProperty(ts, "__esModule", { value: !0 });
const ad = Oe, Vs = V, Mr = D, qs = dr, od = {
  keyword: "properties",
  type: "object",
  schemaType: "object",
  code(e) {
    const { gen: t, schema: r, parentSchema: n, data: s, it: a } = e;
    a.opts.removeAdditional === "all" && n.additionalProperties === void 0 && qs.default.code(new ad.KeywordCxt(a, qs.default, "additionalProperties"));
    const o = (0, Vs.allSchemaProperties)(r);
    for (const h of o)
      a.definedProperties.add(h);
    a.opts.unevaluated && o.length && a.props !== !0 && (a.props = Mr.mergeEvaluated.props(t, (0, Mr.toHash)(o), a.props));
    const l = o.filter((h) => !(0, Mr.alwaysValidSchema)(a, r[h]));
    if (l.length === 0)
      return;
    const i = t.name("valid");
    for (const h of l)
      f(h) ? c(h) : (t.if((0, Vs.propertyInData)(t, s, h, a.opts.ownProperties)), c(h), a.allErrors || t.else().var(i, !0), t.endIf()), e.it.definedProperties.add(h), e.ok(i);
    function f(h) {
      return a.opts.useDefaults && !a.compositeRule && r[h].default !== void 0;
    }
    function c(h) {
      e.subschema({
        keyword: "properties",
        schemaProp: h,
        dataProp: h
      }, i);
    }
  }
};
ts.default = od;
var rs = {};
Object.defineProperty(rs, "__esModule", { value: !0 });
const Gs = V, qt = z, Hs = D, Ks = D, id = {
  keyword: "patternProperties",
  type: "object",
  schemaType: "object",
  code(e) {
    const { gen: t, schema: r, data: n, parentSchema: s, it: a } = e, { opts: o } = a, l = (0, Gs.allSchemaProperties)(r), i = l.filter((v) => (0, Hs.alwaysValidSchema)(a, r[v]));
    if (l.length === 0 || i.length === l.length && (!a.opts.unevaluated || a.props === !0))
      return;
    const f = o.strictSchema && !o.allowMatchingProperties && s.properties, c = t.name("valid");
    a.props !== !0 && !(a.props instanceof qt.Name) && (a.props = (0, Ks.evaluatedPropsToName)(t, a.props));
    const { props: h } = a;
    P();
    function P() {
      for (const v of l)
        f && _(v), a.allErrors ? R(v) : (t.var(c, !0), R(v), t.if(c));
    }
    function _(v) {
      for (const w in f)
        new RegExp(v).test(w) && (0, Hs.checkStrictMode)(a, `property ${w} matches pattern ${v} (use allowMatchingProperties)`);
    }
    function R(v) {
      t.forIn("key", n, (w) => {
        t.if((0, qt._)`${(0, Gs.usePattern)(e, v)}.test(${w})`, () => {
          const y = i.includes(v);
          y || e.subschema({
            keyword: "patternProperties",
            schemaProp: v,
            dataProp: w,
            dataPropType: Ks.Type.Str
          }, c), a.opts.unevaluated && h !== !0 ? t.assign((0, qt._)`${h}[${w}]`, !0) : !y && !a.allErrors && t.if((0, qt.not)(c), () => t.break());
        });
      });
    }
  }
};
rs.default = id;
var ns = {};
Object.defineProperty(ns, "__esModule", { value: !0 });
const cd = D, ld = {
  keyword: "not",
  schemaType: ["object", "boolean"],
  trackErrors: !0,
  code(e) {
    const { gen: t, schema: r, it: n } = e;
    if ((0, cd.alwaysValidSchema)(n, r)) {
      e.fail();
      return;
    }
    const s = t.name("valid");
    e.subschema({
      keyword: "not",
      compositeRule: !0,
      createErrors: !1,
      allErrors: !1
    }, s), e.failResult(s, () => e.reset(), () => e.error());
  },
  error: { message: "must NOT be valid" }
};
ns.default = ld;
var ss = {};
Object.defineProperty(ss, "__esModule", { value: !0 });
const ud = V, fd = {
  keyword: "anyOf",
  schemaType: "array",
  trackErrors: !0,
  code: ud.validateUnion,
  error: { message: "must match a schema in anyOf" }
};
ss.default = fd;
var as = {};
Object.defineProperty(as, "__esModule", { value: !0 });
const Qt = z, dd = D, hd = {
  message: "must match exactly one schema in oneOf",
  params: ({ params: e }) => (0, Qt._)`{passingSchemas: ${e.passing}}`
}, pd = {
  keyword: "oneOf",
  schemaType: "array",
  trackErrors: !0,
  error: hd,
  code(e) {
    const { gen: t, schema: r, parentSchema: n, it: s } = e;
    if (!Array.isArray(r))
      throw new Error("ajv implementation error");
    if (s.opts.discriminator && n.discriminator)
      return;
    const a = r, o = t.let("valid", !1), l = t.let("passing", null), i = t.name("_valid");
    e.setParams({ passing: l }), t.block(f), e.result(o, () => e.reset(), () => e.error(!0));
    function f() {
      a.forEach((c, h) => {
        let P;
        (0, dd.alwaysValidSchema)(s, c) ? t.var(i, !0) : P = e.subschema({
          keyword: "oneOf",
          schemaProp: h,
          compositeRule: !0
        }, i), h > 0 && t.if((0, Qt._)`${i} && ${o}`).assign(o, !1).assign(l, (0, Qt._)`[${l}, ${h}]`).else(), t.if(i, () => {
          t.assign(o, !0), t.assign(l, h), P && e.mergeEvaluated(P, Qt.Name);
        });
      });
    }
  }
};
as.default = pd;
var os = {};
Object.defineProperty(os, "__esModule", { value: !0 });
const md = D, yd = {
  keyword: "allOf",
  schemaType: "array",
  code(e) {
    const { gen: t, schema: r, it: n } = e;
    if (!Array.isArray(r))
      throw new Error("ajv implementation error");
    const s = t.name("valid");
    r.forEach((a, o) => {
      if ((0, md.alwaysValidSchema)(n, a))
        return;
      const l = e.subschema({ keyword: "allOf", schemaProp: o }, s);
      e.ok(s), e.mergeEvaluated(l);
    });
  }
};
os.default = yd;
var is = {};
Object.defineProperty(is, "__esModule", { value: !0 });
const ar = z, Go = D, $d = {
  message: ({ params: e }) => (0, ar.str)`must match "${e.ifClause}" schema`,
  params: ({ params: e }) => (0, ar._)`{failingKeyword: ${e.ifClause}}`
}, _d = {
  keyword: "if",
  schemaType: ["object", "boolean"],
  trackErrors: !0,
  error: $d,
  code(e) {
    const { gen: t, parentSchema: r, it: n } = e;
    r.then === void 0 && r.else === void 0 && (0, Go.checkStrictMode)(n, '"if" without "then" and "else" is ignored');
    const s = xs(n, "then"), a = xs(n, "else");
    if (!s && !a)
      return;
    const o = t.let("valid", !0), l = t.name("_valid");
    if (i(), e.reset(), s && a) {
      const c = t.let("ifClause");
      e.setParams({ ifClause: c }), t.if(l, f("then", c), f("else", c));
    } else s ? t.if(l, f("then")) : t.if((0, ar.not)(l), f("else"));
    e.pass(o, () => e.error(!0));
    function i() {
      const c = e.subschema({
        keyword: "if",
        compositeRule: !0,
        createErrors: !1,
        allErrors: !1
      }, l);
      e.mergeEvaluated(c);
    }
    function f(c, h) {
      return () => {
        const P = e.subschema({ keyword: c }, l);
        t.assign(o, l), e.mergeValidEvaluated(P, o), h ? t.assign(h, (0, ar._)`${c}`) : e.setParams({ ifClause: c });
      };
    }
  }
};
function xs(e, t) {
  const r = e.schema[t];
  return r !== void 0 && !(0, Go.alwaysValidSchema)(e, r);
}
is.default = _d;
var cs = {};
Object.defineProperty(cs, "__esModule", { value: !0 });
const gd = D, vd = {
  keyword: ["then", "else"],
  schemaType: ["object", "boolean"],
  code({ keyword: e, parentSchema: t, it: r }) {
    t.if === void 0 && (0, gd.checkStrictMode)(r, `"${e}" without "if" is ignored`);
  }
};
cs.default = vd;
Object.defineProperty(Yn, "__esModule", { value: !0 });
const Ed = $t, wd = Jn, Sd = _t, bd = Zn, Pd = Qn, Rd = Vo, Od = es, Id = dr, Nd = ts, Td = rs, Ad = ns, jd = ss, Cd = as, Dd = os, kd = is, Ld = cs;
function Md(e = !1) {
  const t = [
    // any
    Ad.default,
    jd.default,
    Cd.default,
    Dd.default,
    kd.default,
    Ld.default,
    // object
    Od.default,
    Id.default,
    Rd.default,
    Nd.default,
    Td.default
  ];
  return e ? t.push(wd.default, bd.default) : t.push(Ed.default, Sd.default), t.push(Pd.default), t;
}
Yn.default = Md;
var ls = {}, us = {};
Object.defineProperty(us, "__esModule", { value: !0 });
const te = z, Fd = {
  message: ({ schemaCode: e }) => (0, te.str)`must match format "${e}"`,
  params: ({ schemaCode: e }) => (0, te._)`{format: ${e}}`
}, Ud = {
  keyword: "format",
  type: ["number", "string"],
  schemaType: "string",
  $data: !0,
  error: Fd,
  code(e, t) {
    const { gen: r, data: n, $data: s, schema: a, schemaCode: o, it: l } = e, { opts: i, errSchemaPath: f, schemaEnv: c, self: h } = l;
    if (!i.validateFormats)
      return;
    s ? P() : _();
    function P() {
      const R = r.scopeValue("formats", {
        ref: h.formats,
        code: i.code.formats
      }), v = r.const("fDef", (0, te._)`${R}[${o}]`), w = r.let("fType"), y = r.let("format");
      r.if((0, te._)`typeof ${v} == "object" && !(${v} instanceof RegExp)`, () => r.assign(w, (0, te._)`${v}.type || "string"`).assign(y, (0, te._)`${v}.validate`), () => r.assign(w, (0, te._)`"string"`).assign(y, v)), e.fail$data((0, te.or)(b(), I()));
      function b() {
        return i.strictSchema === !1 ? te.nil : (0, te._)`${o} && !${y}`;
      }
      function I() {
        const T = c.$async ? (0, te._)`(${v}.async ? await ${y}(${n}) : ${y}(${n}))` : (0, te._)`${y}(${n})`, A = (0, te._)`(typeof ${y} == "function" ? ${T} : ${y}.test(${n}))`;
        return (0, te._)`${y} && ${y} !== true && ${w} === ${t} && !${A}`;
      }
    }
    function _() {
      const R = h.formats[a];
      if (!R) {
        b();
        return;
      }
      if (R === !0)
        return;
      const [v, w, y] = I(R);
      v === t && e.pass(T());
      function b() {
        if (i.strictSchema === !1) {
          h.logger.warn(A());
          return;
        }
        throw new Error(A());
        function A() {
          return `unknown format "${a}" ignored in schema at path "${f}"`;
        }
      }
      function I(A) {
        const G = A instanceof RegExp ? (0, te.regexpCode)(A) : i.code.formats ? (0, te._)`${i.code.formats}${(0, te.getProperty)(a)}` : void 0, K = r.scopeValue("formats", { key: a, ref: A, code: G });
        return typeof A == "object" && !(A instanceof RegExp) ? [A.type || "string", A.validate, (0, te._)`${K}.validate`] : ["string", A, K];
      }
      function T() {
        if (typeof R == "object" && !(R instanceof RegExp) && R.async) {
          if (!c.$async)
            throw new Error("async format in sync schema");
          return (0, te._)`await ${y}(${n})`;
        }
        return typeof w == "function" ? (0, te._)`${y}(${n})` : (0, te._)`${y}.test(${n})`;
      }
    }
  }
};
us.default = Ud;
Object.defineProperty(ls, "__esModule", { value: !0 });
const zd = us, Vd = [zd.default];
ls.default = Vd;
var mt = {};
Object.defineProperty(mt, "__esModule", { value: !0 });
mt.contentVocabulary = mt.metadataVocabulary = void 0;
mt.metadataVocabulary = [
  "title",
  "description",
  "default",
  "deprecated",
  "readOnly",
  "writeOnly",
  "examples"
];
mt.contentVocabulary = [
  "contentMediaType",
  "contentEncoding",
  "contentSchema"
];
Object.defineProperty(kn, "__esModule", { value: !0 });
const qd = Ln, Gd = Fn, Hd = Yn, Kd = ls, Ws = mt, xd = [
  qd.default,
  Gd.default,
  (0, Hd.default)(),
  Kd.default,
  Ws.metadataVocabulary,
  Ws.contentVocabulary
];
kn.default = xd;
var fs = {}, hr = {};
Object.defineProperty(hr, "__esModule", { value: !0 });
hr.DiscrError = void 0;
var Xs;
(function(e) {
  e.Tag = "tag", e.Mapping = "mapping";
})(Xs || (hr.DiscrError = Xs = {}));
Object.defineProperty(fs, "__esModule", { value: !0 });
const at = z, tn = hr, Bs = ve, Wd = yt, Xd = D, Bd = {
  message: ({ params: { discrError: e, tagName: t } }) => e === tn.DiscrError.Tag ? `tag "${t}" must be string` : `value of tag "${t}" must be in oneOf`,
  params: ({ params: { discrError: e, tag: t, tagName: r } }) => (0, at._)`{error: ${e}, tag: ${r}, tagValue: ${t}}`
}, Yd = {
  keyword: "discriminator",
  type: "object",
  schemaType: "object",
  error: Bd,
  code(e) {
    const { gen: t, data: r, schema: n, parentSchema: s, it: a } = e, { oneOf: o } = s;
    if (!a.opts.discriminator)
      throw new Error("discriminator: requires discriminator option");
    const l = n.propertyName;
    if (typeof l != "string")
      throw new Error("discriminator: requires propertyName");
    if (n.mapping)
      throw new Error("discriminator: mapping is not supported");
    if (!o)
      throw new Error("discriminator: requires oneOf keyword");
    const i = t.let("valid", !1), f = t.const("tag", (0, at._)`${r}${(0, at.getProperty)(l)}`);
    t.if((0, at._)`typeof ${f} == "string"`, () => c(), () => e.error(!1, { discrError: tn.DiscrError.Tag, tag: f, tagName: l })), e.ok(i);
    function c() {
      const _ = P();
      t.if(!1);
      for (const R in _)
        t.elseIf((0, at._)`${f} === ${R}`), t.assign(i, h(_[R]));
      t.else(), e.error(!1, { discrError: tn.DiscrError.Mapping, tag: f, tagName: l }), t.endIf();
    }
    function h(_) {
      const R = t.name("valid"), v = e.subschema({ keyword: "oneOf", schemaProp: _ }, R);
      return e.mergeEvaluated(v, at.Name), R;
    }
    function P() {
      var _;
      const R = {}, v = y(s);
      let w = !0;
      for (let T = 0; T < o.length; T++) {
        let A = o[T];
        if (A != null && A.$ref && !(0, Xd.schemaHasRulesButRef)(A, a.self.RULES)) {
          const K = A.$ref;
          if (A = Bs.resolveRef.call(a.self, a.schemaEnv.root, a.baseId, K), A instanceof Bs.SchemaEnv && (A = A.schema), A === void 0)
            throw new Wd.default(a.opts.uriResolver, a.baseId, K);
        }
        const G = (_ = A == null ? void 0 : A.properties) === null || _ === void 0 ? void 0 : _[l];
        if (typeof G != "object")
          throw new Error(`discriminator: oneOf subschemas (or referenced schemas) must have "properties/${l}"`);
        w = w && (v || y(A)), b(G, T);
      }
      if (!w)
        throw new Error(`discriminator: "${l}" must be required`);
      return R;
      function y({ required: T }) {
        return Array.isArray(T) && T.includes(l);
      }
      function b(T, A) {
        if (T.const)
          I(T.const, A);
        else if (T.enum)
          for (const G of T.enum)
            I(G, A);
        else
          throw new Error(`discriminator: "properties/${l}" must have "const" or "enum"`);
      }
      function I(T, A) {
        if (typeof T != "string" || T in R)
          throw new Error(`discriminator: "${l}" values must be unique strings`);
        R[T] = A;
      }
    }
  }
};
fs.default = Yd;
const Jd = "http://json-schema.org/draft-07/schema#", Zd = "http://json-schema.org/draft-07/schema#", Qd = "Core schema meta-schema", eh = {
  schemaArray: {
    type: "array",
    minItems: 1,
    items: {
      $ref: "#"
    }
  },
  nonNegativeInteger: {
    type: "integer",
    minimum: 0
  },
  nonNegativeIntegerDefault0: {
    allOf: [
      {
        $ref: "#/definitions/nonNegativeInteger"
      },
      {
        default: 0
      }
    ]
  },
  simpleTypes: {
    enum: [
      "array",
      "boolean",
      "integer",
      "null",
      "number",
      "object",
      "string"
    ]
  },
  stringArray: {
    type: "array",
    items: {
      type: "string"
    },
    uniqueItems: !0,
    default: []
  }
}, th = [
  "object",
  "boolean"
], rh = {
  $id: {
    type: "string",
    format: "uri-reference"
  },
  $schema: {
    type: "string",
    format: "uri"
  },
  $ref: {
    type: "string",
    format: "uri-reference"
  },
  $comment: {
    type: "string"
  },
  title: {
    type: "string"
  },
  description: {
    type: "string"
  },
  default: !0,
  readOnly: {
    type: "boolean",
    default: !1
  },
  examples: {
    type: "array",
    items: !0
  },
  multipleOf: {
    type: "number",
    exclusiveMinimum: 0
  },
  maximum: {
    type: "number"
  },
  exclusiveMaximum: {
    type: "number"
  },
  minimum: {
    type: "number"
  },
  exclusiveMinimum: {
    type: "number"
  },
  maxLength: {
    $ref: "#/definitions/nonNegativeInteger"
  },
  minLength: {
    $ref: "#/definitions/nonNegativeIntegerDefault0"
  },
  pattern: {
    type: "string",
    format: "regex"
  },
  additionalItems: {
    $ref: "#"
  },
  items: {
    anyOf: [
      {
        $ref: "#"
      },
      {
        $ref: "#/definitions/schemaArray"
      }
    ],
    default: !0
  },
  maxItems: {
    $ref: "#/definitions/nonNegativeInteger"
  },
  minItems: {
    $ref: "#/definitions/nonNegativeIntegerDefault0"
  },
  uniqueItems: {
    type: "boolean",
    default: !1
  },
  contains: {
    $ref: "#"
  },
  maxProperties: {
    $ref: "#/definitions/nonNegativeInteger"
  },
  minProperties: {
    $ref: "#/definitions/nonNegativeIntegerDefault0"
  },
  required: {
    $ref: "#/definitions/stringArray"
  },
  additionalProperties: {
    $ref: "#"
  },
  definitions: {
    type: "object",
    additionalProperties: {
      $ref: "#"
    },
    default: {}
  },
  properties: {
    type: "object",
    additionalProperties: {
      $ref: "#"
    },
    default: {}
  },
  patternProperties: {
    type: "object",
    additionalProperties: {
      $ref: "#"
    },
    propertyNames: {
      format: "regex"
    },
    default: {}
  },
  dependencies: {
    type: "object",
    additionalProperties: {
      anyOf: [
        {
          $ref: "#"
        },
        {
          $ref: "#/definitions/stringArray"
        }
      ]
    }
  },
  propertyNames: {
    $ref: "#"
  },
  const: !0,
  enum: {
    type: "array",
    items: !0,
    minItems: 1,
    uniqueItems: !0
  },
  type: {
    anyOf: [
      {
        $ref: "#/definitions/simpleTypes"
      },
      {
        type: "array",
        items: {
          $ref: "#/definitions/simpleTypes"
        },
        minItems: 1,
        uniqueItems: !0
      }
    ]
  },
  format: {
    type: "string"
  },
  contentMediaType: {
    type: "string"
  },
  contentEncoding: {
    type: "string"
  },
  if: {
    $ref: "#"
  },
  then: {
    $ref: "#"
  },
  else: {
    $ref: "#"
  },
  allOf: {
    $ref: "#/definitions/schemaArray"
  },
  anyOf: {
    $ref: "#/definitions/schemaArray"
  },
  oneOf: {
    $ref: "#/definitions/schemaArray"
  },
  not: {
    $ref: "#"
  }
}, nh = {
  $schema: Jd,
  $id: Zd,
  title: Qd,
  definitions: eh,
  type: th,
  properties: rh,
  default: !0
};
(function(e, t) {
  Object.defineProperty(t, "__esModule", { value: !0 }), t.MissingRefError = t.ValidationError = t.CodeGen = t.Name = t.nil = t.stringify = t.str = t._ = t.KeywordCxt = t.Ajv = void 0;
  const r = Va, n = kn, s = fs, a = nh, o = ["/properties"], l = "http://json-schema.org/draft-07/schema";
  class i extends r.default {
    _addVocabularies() {
      super._addVocabularies(), n.default.forEach((R) => this.addVocabulary(R)), this.opts.discriminator && this.addKeyword(s.default);
    }
    _addDefaultMetaSchema() {
      if (super._addDefaultMetaSchema(), !this.opts.meta)
        return;
      const R = this.opts.$data ? this.$dataMetaSchema(a, o) : a;
      this.addMetaSchema(R, l, !1), this.refs["http://json-schema.org/schema"] = l;
    }
    defaultMeta() {
      return this.opts.defaultMeta = super.defaultMeta() || (this.getSchema(l) ? l : void 0);
    }
  }
  t.Ajv = i, e.exports = t = i, e.exports.Ajv = i, Object.defineProperty(t, "__esModule", { value: !0 }), t.default = i;
  var f = Oe;
  Object.defineProperty(t, "KeywordCxt", { enumerable: !0, get: function() {
    return f.KeywordCxt;
  } });
  var c = z;
  Object.defineProperty(t, "_", { enumerable: !0, get: function() {
    return c._;
  } }), Object.defineProperty(t, "str", { enumerable: !0, get: function() {
    return c.str;
  } }), Object.defineProperty(t, "stringify", { enumerable: !0, get: function() {
    return c.stringify;
  } }), Object.defineProperty(t, "nil", { enumerable: !0, get: function() {
    return c.nil;
  } }), Object.defineProperty(t, "Name", { enumerable: !0, get: function() {
    return c.Name;
  } }), Object.defineProperty(t, "CodeGen", { enumerable: !0, get: function() {
    return c.CodeGen;
  } });
  var h = At;
  Object.defineProperty(t, "ValidationError", { enumerable: !0, get: function() {
    return h.default;
  } });
  var P = yt;
  Object.defineProperty(t, "MissingRefError", { enumerable: !0, get: function() {
    return P.default;
  } });
})(Xr, Xr.exports);
var Ho = Xr.exports, rn = { exports: {} }, Ko = {};
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.formatNames = e.fastFormats = e.fullFormats = void 0;
  function t(L, F) {
    return { validate: L, compare: F };
  }
  e.fullFormats = {
    // date: http://tools.ietf.org/html/rfc3339#section-5.6
    date: t(a, o),
    // date-time: http://tools.ietf.org/html/rfc3339#section-5.6
    time: t(i, f),
    "date-time": t(h, P),
    // duration: https://tools.ietf.org/html/rfc3339#appendix-A
    duration: /^P(?!$)((\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?|(\d+W)?)$/,
    uri: v,
    "uri-reference": /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i,
    // uri-template: https://tools.ietf.org/html/rfc6570
    "uri-template": /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i,
    // For the source: https://gist.github.com/dperini/729294
    // For test cases: https://mathiasbynens.be/demo/url-regex
    url: /^(?:https?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu,
    email: /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i,
    hostname: /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i,
    // optimized https://www.safaribooksonline.com/library/view/regular-expressions-cookbook/9780596802837/ch07s16.html
    ipv4: /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/,
    ipv6: /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i,
    regex: he,
    // uuid: http://tools.ietf.org/html/rfc4122
    uuid: /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
    // JSON-pointer: https://tools.ietf.org/html/rfc6901
    // uri fragment: https://tools.ietf.org/html/rfc3986#appendix-A
    "json-pointer": /^(?:\/(?:[^~/]|~0|~1)*)*$/,
    "json-pointer-uri-fragment": /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i,
    // relative JSON-pointer: http://tools.ietf.org/html/draft-luff-relative-json-pointer-00
    "relative-json-pointer": /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/,
    // the following formats are used by the openapi specification: https://spec.openapis.org/oas/v3.0.0#data-types
    // byte: https://github.com/miguelmota/is-base64
    byte: y,
    // signed 32 bit integer
    int32: { type: "number", validate: T },
    // signed 64 bit integer
    int64: { type: "number", validate: A },
    // C-type float
    float: { type: "number", validate: G },
    // C-type double
    double: { type: "number", validate: G },
    // hint to the UI to hide input strings
    password: !0,
    // unchecked string payload
    binary: !0
  }, e.fastFormats = {
    ...e.fullFormats,
    date: t(/^\d\d\d\d-[0-1]\d-[0-3]\d$/, o),
    time: t(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, f),
    "date-time": t(/^\d\d\d\d-[0-1]\d-[0-3]\d[t\s](?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, P),
    // uri: https://github.com/mafintosh/is-my-json-valid/blob/master/formats.js
    uri: /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i,
    "uri-reference": /^(?:(?:[a-z][a-z0-9+\-.]*:)?\/?\/)?(?:[^\\\s#][^\s#]*)?(?:#[^\\\s]*)?$/i,
    // email (sources from jsen validator):
    // http://stackoverflow.com/questions/201323/using-a-regular-expression-to-validate-an-email-address#answer-8829363
    // http://www.w3.org/TR/html5/forms.html#valid-e-mail-address (search for 'wilful violation')
    email: /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i
  }, e.formatNames = Object.keys(e.fullFormats);
  function r(L) {
    return L % 4 === 0 && (L % 100 !== 0 || L % 400 === 0);
  }
  const n = /^(\d\d\d\d)-(\d\d)-(\d\d)$/, s = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  function a(L) {
    const F = n.exec(L);
    if (!F)
      return !1;
    const Z = +F[1], x = +F[2], se = +F[3];
    return x >= 1 && x <= 12 && se >= 1 && se <= (x === 2 && r(Z) ? 29 : s[x]);
  }
  function o(L, F) {
    if (L && F)
      return L > F ? 1 : L < F ? -1 : 0;
  }
  const l = /^(\d\d):(\d\d):(\d\d)(\.\d+)?(z|[+-]\d\d(?::?\d\d)?)?$/i;
  function i(L, F) {
    const Z = l.exec(L);
    if (!Z)
      return !1;
    const x = +Z[1], se = +Z[2], re = +Z[3], ue = Z[5];
    return (x <= 23 && se <= 59 && re <= 59 || x === 23 && se === 59 && re === 60) && (!F || ue !== "");
  }
  function f(L, F) {
    if (!(L && F))
      return;
    const Z = l.exec(L), x = l.exec(F);
    if (Z && x)
      return L = Z[1] + Z[2] + Z[3] + (Z[4] || ""), F = x[1] + x[2] + x[3] + (x[4] || ""), L > F ? 1 : L < F ? -1 : 0;
  }
  const c = /t|\s/i;
  function h(L) {
    const F = L.split(c);
    return F.length === 2 && a(F[0]) && i(F[1], !0);
  }
  function P(L, F) {
    if (!(L && F))
      return;
    const [Z, x] = L.split(c), [se, re] = F.split(c), ue = o(Z, se);
    if (ue !== void 0)
      return ue || f(x, re);
  }
  const _ = /\/|:/, R = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
  function v(L) {
    return _.test(L) && R.test(L);
  }
  const w = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/gm;
  function y(L) {
    return w.lastIndex = 0, w.test(L);
  }
  const b = -2147483648, I = 2 ** 31 - 1;
  function T(L) {
    return Number.isInteger(L) && L <= I && L >= b;
  }
  function A(L) {
    return Number.isInteger(L);
  }
  function G() {
    return !0;
  }
  const K = /[^\\]\\Z/;
  function he(L) {
    if (K.test(L))
      return !1;
    try {
      return new RegExp(L), !0;
    } catch {
      return !1;
    }
  }
})(Ko);
var xo = {};
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.formatLimitDefinition = void 0;
  const t = Ho, r = z, n = r.operators, s = {
    formatMaximum: { okStr: "<=", ok: n.LTE, fail: n.GT },
    formatMinimum: { okStr: ">=", ok: n.GTE, fail: n.LT },
    formatExclusiveMaximum: { okStr: "<", ok: n.LT, fail: n.GTE },
    formatExclusiveMinimum: { okStr: ">", ok: n.GT, fail: n.LTE }
  }, a = {
    message: ({ keyword: l, schemaCode: i }) => r.str`should be ${s[l].okStr} ${i}`,
    params: ({ keyword: l, schemaCode: i }) => r._`{comparison: ${s[l].okStr}, limit: ${i}}`
  };
  e.formatLimitDefinition = {
    keyword: Object.keys(s),
    type: "string",
    schemaType: "string",
    $data: !0,
    error: a,
    code(l) {
      const { gen: i, data: f, schemaCode: c, keyword: h, it: P } = l, { opts: _, self: R } = P;
      if (!_.validateFormats)
        return;
      const v = new t.KeywordCxt(P, R.RULES.all.format.definition, "format");
      v.$data ? w() : y();
      function w() {
        const I = i.scopeValue("formats", {
          ref: R.formats,
          code: _.code.formats
        }), T = i.const("fmt", r._`${I}[${v.schemaCode}]`);
        l.fail$data(r.or(r._`typeof ${T} != "object"`, r._`${T} instanceof RegExp`, r._`typeof ${T}.compare != "function"`, b(T)));
      }
      function y() {
        const I = v.schema, T = R.formats[I];
        if (!T || T === !0)
          return;
        if (typeof T != "object" || T instanceof RegExp || typeof T.compare != "function")
          throw new Error(`"${h}": format "${I}" does not define "compare" function`);
        const A = i.scopeValue("formats", {
          key: I,
          ref: T,
          code: _.code.formats ? r._`${_.code.formats}${r.getProperty(I)}` : void 0
        });
        l.fail$data(b(A));
      }
      function b(I) {
        return r._`${I}.compare(${f}, ${c}) ${s[h].fail} 0`;
      }
    },
    dependencies: ["format"]
  };
  const o = (l) => (l.addKeyword(e.formatLimitDefinition), l);
  e.default = o;
})(xo);
(function(e, t) {
  Object.defineProperty(t, "__esModule", { value: !0 });
  const r = Ko, n = xo, s = z, a = new s.Name("fullFormats"), o = new s.Name("fastFormats"), l = (f, c = { keywords: !0 }) => {
    if (Array.isArray(c))
      return i(f, c, r.fullFormats, a), f;
    const [h, P] = c.mode === "fast" ? [r.fastFormats, o] : [r.fullFormats, a], _ = c.formats || r.formatNames;
    return i(f, _, h, P), c.keywords && n.default(f), f;
  };
  l.get = (f, c = "full") => {
    const P = (c === "fast" ? r.fastFormats : r.fullFormats)[f];
    if (!P)
      throw new Error(`Unknown format "${f}"`);
    return P;
  };
  function i(f, c, h, P) {
    var _, R;
    (_ = (R = f.opts.code).formats) !== null && _ !== void 0 || (R.formats = s._`require("ajv-formats/dist/formats").${P}`);
    for (const v of c)
      f.addFormat(v, h[v]);
  }
  e.exports = t = l, Object.defineProperty(t, "__esModule", { value: !0 }), t.default = l;
})(rn, rn.exports);
var sh = rn.exports;
const ah = (e, t, r, n) => {
  if (r === "length" || r === "prototype" || r === "arguments" || r === "caller")
    return;
  const s = Object.getOwnPropertyDescriptor(e, r), a = Object.getOwnPropertyDescriptor(t, r);
  !oh(s, a) && n || Object.defineProperty(e, r, a);
}, oh = function(e, t) {
  return e === void 0 || e.configurable || e.writable === t.writable && e.enumerable === t.enumerable && e.configurable === t.configurable && (e.writable || e.value === t.value);
}, ih = (e, t) => {
  const r = Object.getPrototypeOf(t);
  r !== Object.getPrototypeOf(e) && Object.setPrototypeOf(e, r);
}, ch = (e, t) => `/* Wrapped ${e}*/
${t}`, lh = Object.getOwnPropertyDescriptor(Function.prototype, "toString"), uh = Object.getOwnPropertyDescriptor(Function.prototype.toString, "name"), fh = (e, t, r) => {
  const n = r === "" ? "" : `with ${r.trim()}() `, s = ch.bind(null, n, t.toString());
  Object.defineProperty(s, "name", uh), Object.defineProperty(e, "toString", { ...lh, value: s });
}, dh = (e, t, { ignoreNonConfigurable: r = !1 } = {}) => {
  const { name: n } = e;
  for (const s of Reflect.ownKeys(t))
    ah(e, t, s, r);
  return ih(e, t), fh(e, t, n), e;
};
var hh = dh;
const ph = hh;
var mh = (e, t = {}) => {
  if (typeof e != "function")
    throw new TypeError(`Expected the first argument to be a function, got \`${typeof e}\``);
  const {
    wait: r = 0,
    before: n = !1,
    after: s = !0
  } = t;
  if (!n && !s)
    throw new Error("Both `before` and `after` are false, function wouldn't be called.");
  let a, o;
  const l = function(...i) {
    const f = this, c = () => {
      a = void 0, s && (o = e.apply(f, i));
    }, h = n && !a;
    return clearTimeout(a), a = setTimeout(c, r), h && (o = e.apply(f, i)), o;
  };
  return ph(l, e), l.cancel = () => {
    a && (clearTimeout(a), a = void 0);
  }, l;
}, nn = { exports: {} };
const yh = "2.0.0", Wo = 256, $h = Number.MAX_SAFE_INTEGER || /* istanbul ignore next */
9007199254740991, _h = 16, gh = Wo - 6, vh = [
  "major",
  "premajor",
  "minor",
  "preminor",
  "patch",
  "prepatch",
  "prerelease"
];
var Ct = {
  MAX_LENGTH: Wo,
  MAX_SAFE_COMPONENT_LENGTH: _h,
  MAX_SAFE_BUILD_LENGTH: gh,
  MAX_SAFE_INTEGER: $h,
  RELEASE_TYPES: vh,
  SEMVER_SPEC_VERSION: yh,
  FLAG_INCLUDE_PRERELEASE: 1,
  FLAG_LOOSE: 2
};
const Eh = typeof process == "object" && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...e) => console.error("SEMVER", ...e) : () => {
};
var pr = Eh;
(function(e, t) {
  const {
    MAX_SAFE_COMPONENT_LENGTH: r,
    MAX_SAFE_BUILD_LENGTH: n,
    MAX_LENGTH: s
  } = Ct, a = pr;
  t = e.exports = {};
  const o = t.re = [], l = t.safeRe = [], i = t.src = [], f = t.safeSrc = [], c = t.t = {};
  let h = 0;
  const P = "[a-zA-Z0-9-]", _ = [
    ["\\s", 1],
    ["\\d", s],
    [P, n]
  ], R = (w) => {
    for (const [y, b] of _)
      w = w.split(`${y}*`).join(`${y}{0,${b}}`).split(`${y}+`).join(`${y}{1,${b}}`);
    return w;
  }, v = (w, y, b) => {
    const I = R(y), T = h++;
    a(w, T, y), c[w] = T, i[T] = y, f[T] = I, o[T] = new RegExp(y, b ? "g" : void 0), l[T] = new RegExp(I, b ? "g" : void 0);
  };
  v("NUMERICIDENTIFIER", "0|[1-9]\\d*"), v("NUMERICIDENTIFIERLOOSE", "\\d+"), v("NONNUMERICIDENTIFIER", `\\d*[a-zA-Z-]${P}*`), v("MAINVERSION", `(${i[c.NUMERICIDENTIFIER]})\\.(${i[c.NUMERICIDENTIFIER]})\\.(${i[c.NUMERICIDENTIFIER]})`), v("MAINVERSIONLOOSE", `(${i[c.NUMERICIDENTIFIERLOOSE]})\\.(${i[c.NUMERICIDENTIFIERLOOSE]})\\.(${i[c.NUMERICIDENTIFIERLOOSE]})`), v("PRERELEASEIDENTIFIER", `(?:${i[c.NONNUMERICIDENTIFIER]}|${i[c.NUMERICIDENTIFIER]})`), v("PRERELEASEIDENTIFIERLOOSE", `(?:${i[c.NONNUMERICIDENTIFIER]}|${i[c.NUMERICIDENTIFIERLOOSE]})`), v("PRERELEASE", `(?:-(${i[c.PRERELEASEIDENTIFIER]}(?:\\.${i[c.PRERELEASEIDENTIFIER]})*))`), v("PRERELEASELOOSE", `(?:-?(${i[c.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${i[c.PRERELEASEIDENTIFIERLOOSE]})*))`), v("BUILDIDENTIFIER", `${P}+`), v("BUILD", `(?:\\+(${i[c.BUILDIDENTIFIER]}(?:\\.${i[c.BUILDIDENTIFIER]})*))`), v("FULLPLAIN", `v?${i[c.MAINVERSION]}${i[c.PRERELEASE]}?${i[c.BUILD]}?`), v("FULL", `^${i[c.FULLPLAIN]}$`), v("LOOSEPLAIN", `[v=\\s]*${i[c.MAINVERSIONLOOSE]}${i[c.PRERELEASELOOSE]}?${i[c.BUILD]}?`), v("LOOSE", `^${i[c.LOOSEPLAIN]}$`), v("GTLT", "((?:<|>)?=?)"), v("XRANGEIDENTIFIERLOOSE", `${i[c.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`), v("XRANGEIDENTIFIER", `${i[c.NUMERICIDENTIFIER]}|x|X|\\*`), v("XRANGEPLAIN", `[v=\\s]*(${i[c.XRANGEIDENTIFIER]})(?:\\.(${i[c.XRANGEIDENTIFIER]})(?:\\.(${i[c.XRANGEIDENTIFIER]})(?:${i[c.PRERELEASE]})?${i[c.BUILD]}?)?)?`), v("XRANGEPLAINLOOSE", `[v=\\s]*(${i[c.XRANGEIDENTIFIERLOOSE]})(?:\\.(${i[c.XRANGEIDENTIFIERLOOSE]})(?:\\.(${i[c.XRANGEIDENTIFIERLOOSE]})(?:${i[c.PRERELEASELOOSE]})?${i[c.BUILD]}?)?)?`), v("XRANGE", `^${i[c.GTLT]}\\s*${i[c.XRANGEPLAIN]}$`), v("XRANGELOOSE", `^${i[c.GTLT]}\\s*${i[c.XRANGEPLAINLOOSE]}$`), v("COERCEPLAIN", `(^|[^\\d])(\\d{1,${r}})(?:\\.(\\d{1,${r}}))?(?:\\.(\\d{1,${r}}))?`), v("COERCE", `${i[c.COERCEPLAIN]}(?:$|[^\\d])`), v("COERCEFULL", i[c.COERCEPLAIN] + `(?:${i[c.PRERELEASE]})?(?:${i[c.BUILD]})?(?:$|[^\\d])`), v("COERCERTL", i[c.COERCE], !0), v("COERCERTLFULL", i[c.COERCEFULL], !0), v("LONETILDE", "(?:~>?)"), v("TILDETRIM", `(\\s*)${i[c.LONETILDE]}\\s+`, !0), t.tildeTrimReplace = "$1~", v("TILDE", `^${i[c.LONETILDE]}${i[c.XRANGEPLAIN]}$`), v("TILDELOOSE", `^${i[c.LONETILDE]}${i[c.XRANGEPLAINLOOSE]}$`), v("LONECARET", "(?:\\^)"), v("CARETTRIM", `(\\s*)${i[c.LONECARET]}\\s+`, !0), t.caretTrimReplace = "$1^", v("CARET", `^${i[c.LONECARET]}${i[c.XRANGEPLAIN]}$`), v("CARETLOOSE", `^${i[c.LONECARET]}${i[c.XRANGEPLAINLOOSE]}$`), v("COMPARATORLOOSE", `^${i[c.GTLT]}\\s*(${i[c.LOOSEPLAIN]})$|^$`), v("COMPARATOR", `^${i[c.GTLT]}\\s*(${i[c.FULLPLAIN]})$|^$`), v("COMPARATORTRIM", `(\\s*)${i[c.GTLT]}\\s*(${i[c.LOOSEPLAIN]}|${i[c.XRANGEPLAIN]})`, !0), t.comparatorTrimReplace = "$1$2$3", v("HYPHENRANGE", `^\\s*(${i[c.XRANGEPLAIN]})\\s+-\\s+(${i[c.XRANGEPLAIN]})\\s*$`), v("HYPHENRANGELOOSE", `^\\s*(${i[c.XRANGEPLAINLOOSE]})\\s+-\\s+(${i[c.XRANGEPLAINLOOSE]})\\s*$`), v("STAR", "(<|>)?=?\\s*\\*"), v("GTE0", "^\\s*>=\\s*0\\.0\\.0\\s*$"), v("GTE0PRE", "^\\s*>=\\s*0\\.0\\.0-0\\s*$");
})(nn, nn.exports);
var Dt = nn.exports;
const wh = Object.freeze({ loose: !0 }), Sh = Object.freeze({}), bh = (e) => e ? typeof e != "object" ? wh : e : Sh;
var ds = bh;
const Ys = /^[0-9]+$/, Xo = (e, t) => {
  if (typeof e == "number" && typeof t == "number")
    return e === t ? 0 : e < t ? -1 : 1;
  const r = Ys.test(e), n = Ys.test(t);
  return r && n && (e = +e, t = +t), e === t ? 0 : r && !n ? -1 : n && !r ? 1 : e < t ? -1 : 1;
}, Ph = (e, t) => Xo(t, e);
var Bo = {
  compareIdentifiers: Xo,
  rcompareIdentifiers: Ph
};
const Gt = pr, { MAX_LENGTH: Js, MAX_SAFE_INTEGER: Ht } = Ct, { safeRe: Kt, t: xt } = Dt, Rh = ds, { compareIdentifiers: sn } = Bo, Oh = (e, t) => {
  const r = t.split(".");
  if (r.length > e.length)
    return !1;
  for (let n = 0; n < r.length; n++)
    if (sn(e[n], r[n]) !== 0)
      return !1;
  return !0;
};
let Ih = class Ae {
  constructor(t, r) {
    if (r = Rh(r), t instanceof Ae) {
      if (t.loose === !!r.loose && t.includePrerelease === !!r.includePrerelease)
        return t;
      t = t.version;
    } else if (typeof t != "string")
      throw new TypeError(`Invalid version. Must be a string. Got type "${typeof t}".`);
    if (t.length > Js)
      throw new TypeError(
        `version is longer than ${Js} characters`
      );
    Gt("SemVer", t, r), this.options = r, this.loose = !!r.loose, this.includePrerelease = !!r.includePrerelease;
    const n = t.trim().match(r.loose ? Kt[xt.LOOSE] : Kt[xt.FULL]);
    if (!n)
      throw new TypeError(`Invalid Version: ${t}`);
    if (this.raw = t, this.major = +n[1], this.minor = +n[2], this.patch = +n[3], this.major > Ht || this.major < 0)
      throw new TypeError("Invalid major version");
    if (this.minor > Ht || this.minor < 0)
      throw new TypeError("Invalid minor version");
    if (this.patch > Ht || this.patch < 0)
      throw new TypeError("Invalid patch version");
    n[4] ? this.prerelease = n[4].split(".").map((s) => {
      if (/^[0-9]+$/.test(s)) {
        const a = +s;
        if (a >= 0 && a < Ht)
          return a;
      }
      return s;
    }) : this.prerelease = [], this.build = n[5] ? n[5].split(".") : [], this.format();
  }
  format() {
    return this.version = `${this.major}.${this.minor}.${this.patch}`, this.prerelease.length && (this.version += `-${this.prerelease.join(".")}`), this.version;
  }
  toString() {
    return this.version;
  }
  compare(t) {
    if (Gt("SemVer.compare", this.version, this.options, t), !(t instanceof Ae)) {
      if (typeof t == "string" && t === this.version)
        return 0;
      t = new Ae(t, this.options);
    }
    return t.version === this.version ? 0 : this.compareMain(t) || this.comparePre(t);
  }
  compareMain(t) {
    return t instanceof Ae || (t = new Ae(t, this.options)), this.major < t.major ? -1 : this.major > t.major ? 1 : this.minor < t.minor ? -1 : this.minor > t.minor ? 1 : this.patch < t.patch ? -1 : this.patch > t.patch ? 1 : 0;
  }
  comparePre(t) {
    if (t instanceof Ae || (t = new Ae(t, this.options)), this.prerelease.length && !t.prerelease.length)
      return -1;
    if (!this.prerelease.length && t.prerelease.length)
      return 1;
    if (!this.prerelease.length && !t.prerelease.length)
      return 0;
    let r = 0;
    do {
      const n = this.prerelease[r], s = t.prerelease[r];
      if (Gt("prerelease compare", r, n, s), n === void 0 && s === void 0)
        return 0;
      if (s === void 0)
        return 1;
      if (n === void 0)
        return -1;
      if (n === s)
        continue;
      return sn(n, s);
    } while (++r);
  }
  compareBuild(t) {
    t instanceof Ae || (t = new Ae(t, this.options));
    let r = 0;
    do {
      const n = this.build[r], s = t.build[r];
      if (Gt("build compare", r, n, s), n === void 0 && s === void 0)
        return 0;
      if (s === void 0)
        return 1;
      if (n === void 0)
        return -1;
      if (n === s)
        continue;
      return sn(n, s);
    } while (++r);
  }
  // preminor will bump the version up to the next minor release, and immediately
  // down to pre-release. premajor and prepatch work the same way.
  inc(t, r, n) {
    if (t.startsWith("pre")) {
      if (!r && n === !1)
        throw new Error("invalid increment argument: identifier is empty");
      if (r) {
        const s = `-${r}`.match(this.options.loose ? Kt[xt.PRERELEASELOOSE] : Kt[xt.PRERELEASE]);
        if (!s || s[1] !== r)
          throw new Error(`invalid identifier: ${r}`);
      }
    }
    switch (t) {
      case "premajor":
        this.prerelease.length = 0, this.patch = 0, this.minor = 0, this.major++, this.inc("pre", r, n);
        break;
      case "preminor":
        this.prerelease.length = 0, this.patch = 0, this.minor++, this.inc("pre", r, n);
        break;
      case "prepatch":
        this.prerelease.length = 0, this.inc("patch", r, n), this.inc("pre", r, n);
        break;
      case "prerelease":
        this.prerelease.length === 0 && this.inc("patch", r, n), this.inc("pre", r, n);
        break;
      case "release":
        if (this.prerelease.length === 0)
          throw new Error(`version ${this.raw} is not a prerelease`);
        this.prerelease.length = 0;
        break;
      case "major":
        (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) && this.major++, this.minor = 0, this.patch = 0, this.prerelease = [];
        break;
      case "minor":
        (this.patch !== 0 || this.prerelease.length === 0) && this.minor++, this.patch = 0, this.prerelease = [];
        break;
      case "patch":
        this.prerelease.length === 0 && this.patch++, this.prerelease = [];
        break;
      case "pre": {
        const s = Number(n) ? 1 : 0;
        if (this.prerelease.length === 0)
          this.prerelease = [s];
        else {
          let a = this.prerelease.length;
          for (; --a >= 0; )
            typeof this.prerelease[a] == "number" && (this.prerelease[a]++, a = -2);
          if (a === -1) {
            if (r === this.prerelease.join(".") && n === !1)
              throw new Error("invalid increment argument: identifier already exists");
            this.prerelease.push(s);
          }
        }
        if (r) {
          let a = [r, s];
          if (n === !1 && (a = [r]), Oh(this.prerelease, r)) {
            const o = this.prerelease[r.split(".").length];
            isNaN(o) && (this.prerelease = a);
          } else
            this.prerelease = a;
        }
        break;
      }
      default:
        throw new Error(`invalid increment argument: ${t}`);
    }
    return this.raw = this.format(), this.build.length && (this.raw += `+${this.build.join(".")}`), this;
  }
};
var de = Ih;
const Zs = de, Nh = (e, t, r = !1) => {
  if (e instanceof Zs)
    return e;
  try {
    return new Zs(e, t);
  } catch (n) {
    if (!r)
      return null;
    throw n;
  }
};
var tt = Nh;
const Th = tt, Ah = (e, t) => {
  const r = Th(e, t);
  return r ? r.version : null;
};
var jh = Ah;
const Ch = tt, Dh = (e, t) => {
  const r = Ch(e.trim().replace(/^[=v]+/, ""), t);
  return r ? r.version : null;
};
var kh = Dh;
const Qs = de, Lh = (e, t, r, n, s) => {
  typeof r == "string" && (s = n, n = r, r = void 0);
  try {
    return new Qs(
      e instanceof Qs ? e.version : e,
      r
    ).inc(t, n, s).version;
  } catch {
    return null;
  }
};
var Mh = Lh;
const ea = tt, Fh = (e, t) => {
  const r = ea(e, null, !0), n = ea(t, null, !0), s = r.compare(n);
  if (s === 0)
    return null;
  const a = s > 0, o = a ? r : n, l = a ? n : r, i = !!o.prerelease.length;
  if (!!l.prerelease.length && !i) {
    if (!l.patch && !l.minor)
      return "major";
    if (l.compareMain(o) === 0)
      return l.minor && !l.patch ? "minor" : "patch";
  }
  const c = i ? "pre" : "";
  return r.major !== n.major ? c + "major" : r.minor !== n.minor ? c + "minor" : r.patch !== n.patch ? c + "patch" : "prerelease";
};
var Uh = Fh;
const zh = de, Vh = (e, t) => new zh(e, t).major;
var qh = Vh;
const Gh = de, Hh = (e, t) => new Gh(e, t).minor;
var Kh = Hh;
const xh = de, Wh = (e, t) => new xh(e, t).patch;
var Xh = Wh;
const Bh = tt, Yh = (e, t) => {
  const r = Bh(e, t);
  return r && r.prerelease.length ? r.prerelease : null;
};
var Jh = Yh;
const ta = de, Zh = (e, t, r) => new ta(e, r).compare(new ta(t, r));
var Ie = Zh;
const Qh = Ie, ep = (e, t, r) => Qh(t, e, r);
var tp = ep;
const rp = Ie, np = (e, t) => rp(e, t, !0);
var sp = np;
const ra = de, ap = (e, t, r) => {
  const n = new ra(e, r), s = new ra(t, r);
  return n.compare(s) || n.compareBuild(s);
};
var hs = ap;
const op = hs, ip = (e, t) => e.sort((r, n) => op(r, n, t));
var cp = ip;
const lp = hs, up = (e, t) => e.sort((r, n) => lp(n, r, t));
var fp = up;
const dp = Ie, hp = (e, t, r) => dp(e, t, r) > 0;
var mr = hp;
const pp = Ie, mp = (e, t, r) => pp(e, t, r) < 0;
var ps = mp;
const yp = Ie, $p = (e, t, r) => yp(e, t, r) === 0;
var Yo = $p;
const _p = Ie, gp = (e, t, r) => _p(e, t, r) !== 0;
var Jo = gp;
const vp = Ie, Ep = (e, t, r) => vp(e, t, r) >= 0;
var ms = Ep;
const wp = Ie, Sp = (e, t, r) => wp(e, t, r) <= 0;
var ys = Sp;
const bp = Yo, Pp = Jo, Rp = mr, Op = ms, Ip = ps, Np = ys, Tp = (e, t, r, n) => {
  switch (t) {
    case "===":
      return typeof e == "object" && (e = e.version), typeof r == "object" && (r = r.version), e === r;
    case "!==":
      return typeof e == "object" && (e = e.version), typeof r == "object" && (r = r.version), e !== r;
    case "":
    case "=":
    case "==":
      return bp(e, r, n);
    case "!=":
      return Pp(e, r, n);
    case ">":
      return Rp(e, r, n);
    case ">=":
      return Op(e, r, n);
    case "<":
      return Ip(e, r, n);
    case "<=":
      return Np(e, r, n);
    default:
      throw new TypeError(`Invalid operator: ${t}`);
  }
};
var Zo = Tp;
const Ap = de, jp = tt, { safeRe: Wt, t: Xt } = Dt, Cp = (e, t) => {
  if (e instanceof Ap)
    return e;
  if (typeof e == "number" && (e = String(e)), typeof e != "string")
    return null;
  t = t || {};
  let r = null;
  if (!t.rtl)
    r = e.match(t.includePrerelease ? Wt[Xt.COERCEFULL] : Wt[Xt.COERCE]);
  else {
    const i = t.includePrerelease ? Wt[Xt.COERCERTLFULL] : Wt[Xt.COERCERTL];
    let f;
    for (; (f = i.exec(e)) && (!r || r.index + r[0].length !== e.length); )
      (!r || f.index + f[0].length !== r.index + r[0].length) && (r = f), i.lastIndex = f.index + f[1].length + f[2].length;
    i.lastIndex = -1;
  }
  if (r === null)
    return null;
  const n = r[2], s = r[3] || "0", a = r[4] || "0", o = t.includePrerelease && r[5] ? `-${r[5]}` : "", l = t.includePrerelease && r[6] ? `+${r[6]}` : "";
  return jp(`${n}.${s}.${a}${o}${l}`, t);
};
var Dp = Cp;
const kp = tt, Lp = Ct, Mp = de, Fp = (e, t, r) => {
  if (!Lp.RELEASE_TYPES.includes(t))
    return null;
  const n = Up(e, r);
  return n && zp(n, t);
}, Up = (e, t) => {
  const r = e instanceof Mp ? e.version : e;
  return kp(r, t);
}, zp = (e, t) => {
  if (Vp(t))
    return e.version;
  switch (e.prerelease = [], t) {
    case "major":
      e.minor = 0, e.patch = 0;
      break;
    case "minor":
      e.patch = 0;
      break;
  }
  return e.format();
}, Vp = (e) => e.startsWith("pre");
var qp = Fp;
class Gp {
  constructor() {
    this.max = 1e3, this.map = /* @__PURE__ */ new Map();
  }
  get(t) {
    const r = this.map.get(t);
    if (r !== void 0)
      return this.map.delete(t), this.map.set(t, r), r;
  }
  delete(t) {
    return this.map.delete(t);
  }
  set(t, r) {
    if (!this.delete(t) && r !== void 0) {
      if (this.map.size >= this.max) {
        const s = this.map.keys().next().value;
        this.delete(s);
      }
      this.map.set(t, r);
    }
    return this;
  }
}
var Hp = Gp, Fr, na;
function Ne() {
  if (na) return Fr;
  na = 1;
  const e = /\s+/g;
  class t {
    constructor(g, O) {
      if (O = s(O), g instanceof t)
        return g.loose === !!O.loose && g.includePrerelease === !!O.includePrerelease ? g : new t(g.raw, O);
      if (g instanceof a)
        return this.raw = g.value, this.set = [[g]], this.formatted = void 0, this;
      if (this.options = O, this.loose = !!O.loose, this.includePrerelease = !!O.includePrerelease, this.raw = g.trim().replace(e, " "), this.set = this.raw.split("||").map((m) => this.parseRange(m.trim())).filter((m) => m.length), !this.set.length)
        throw new TypeError(`Invalid SemVer Range: ${this.raw}`);
      if (this.set.length > 1) {
        const m = this.set[0];
        if (this.set = this.set.filter((p) => !y(p[0])), this.set.length === 0)
          this.set = [m];
        else if (this.set.length > 1) {
          for (const p of this.set)
            if (p.length === 1 && b(p[0])) {
              this.set = [p];
              break;
            }
        }
      }
      this.formatted = void 0;
    }
    get range() {
      if (this.formatted === void 0) {
        this.formatted = "";
        for (let g = 0; g < this.set.length; g++) {
          g > 0 && (this.formatted += "||");
          const O = this.set[g];
          for (let m = 0; m < O.length; m++)
            m > 0 && (this.formatted += " "), this.formatted += O[m].toString().trim();
        }
      }
      return this.formatted;
    }
    format() {
      return this.range;
    }
    toString() {
      return this.range;
    }
    parseRange(g) {
      g = g.replace(w, "");
      const m = ((this.options.includePrerelease && R) | (this.options.loose && v)) + ":" + g, p = n.get(m);
      if (p)
        return p;
      const E = this.options.loose, $ = E ? i[c.HYPHENRANGELOOSE] : i[c.HYPHENRANGE];
      g = g.replace($, ue(this.options.includePrerelease)), o("hyphen replace", g), g = g.replace(i[c.COMPARATORTRIM], h), o("comparator trim", g), g = g.replace(i[c.TILDETRIM], P), o("tilde trim", g), g = g.replace(i[c.CARETTRIM], _), o("caret trim", g);
      let u = g.split(" ").map((j) => T(j, this.options)).join(" ").split(/\s+/).map((j) => re(j, this.options));
      E && (u = u.filter((j) => (o("loose invalid filter", j, this.options), !!j.match(i[c.COMPARATORLOOSE])))), o("range list", u);
      const d = /* @__PURE__ */ new Map(), S = u.map((j) => new a(j, this.options));
      for (const j of S) {
        if (y(j))
          return [j];
        d.set(j.value, j);
      }
      d.size > 1 && d.has("") && d.delete("");
      const C = [...d.values()];
      return n.set(m, C), C;
    }
    intersects(g, O) {
      if (!(g instanceof t))
        throw new TypeError("a Range is required");
      return this.set.some((m) => I(m, O) && g.set.some((p) => I(p, O) && m.every((E) => p.every(($) => E.intersects($, O)))));
    }
    // if ANY of the sets match ALL of its comparators, then pass
    test(g) {
      if (!g)
        return !1;
      if (typeof g == "string")
        try {
          g = new l(g, this.options);
        } catch {
          return !1;
        }
      for (let O = 0; O < this.set.length; O++)
        if (Te(this.set[O], g, this.options))
          return !0;
      return !1;
    }
  }
  Fr = t;
  const r = Hp, n = new r(), s = ds, a = yr(), o = pr, l = de, {
    safeRe: i,
    src: f,
    t: c,
    comparatorTrimReplace: h,
    tildeTrimReplace: P,
    caretTrimReplace: _
  } = Dt, { FLAG_INCLUDE_PRERELEASE: R, FLAG_LOOSE: v } = Ct, w = new RegExp(f[c.BUILD], "g"), y = (N) => N.value === "<0.0.0-0", b = (N) => N.value === "", I = (N, g) => {
    let O = !0;
    const m = N.slice();
    let p = m.pop();
    for (; O && m.length; )
      O = m.every((E) => p.intersects(E, g)), p = m.pop();
    return O;
  }, T = (N, g) => (N = N.replace(i[c.BUILD], ""), o("comp", N, g), N = L(N, g), o("caret", N), N = K(N, g), o("tildes", N), N = Z(N, g), o("xrange", N), N = se(N, g), o("stars", N), N), A = (N) => !N || N.toLowerCase() === "x" || N === "*", G = (N, g, O) => A(N) && !A(g) || A(g) && O && !A(O), K = (N, g) => N.trim().split(/\s+/).map((O) => he(O, g)).join(" "), he = (N, g) => {
    const O = g.loose ? i[c.TILDELOOSE] : i[c.TILDE];
    return N.replace(O, (m, p, E, $, u) => {
      o("tilde", N, m, p, E, $, u);
      let d;
      return A(p) ? d = "" : A(E) ? d = `>=${p}.0.0 <${+p + 1}.0.0-0` : A($) ? d = `>=${p}.${E}.0 <${p}.${+E + 1}.0-0` : u ? (o("replaceTilde pr", u), d = `>=${p}.${E}.${$}-${u} <${p}.${+E + 1}.0-0`) : d = `>=${p}.${E}.${$} <${p}.${+E + 1}.0-0`, o("tilde return", d), d;
    });
  }, L = (N, g) => N.trim().split(/\s+/).map((O) => F(O, g)).join(" "), F = (N, g) => {
    o("caret", N, g);
    const O = g.loose ? i[c.CARETLOOSE] : i[c.CARET], m = g.includePrerelease ? "-0" : "";
    return N.replace(O, (p, E, $, u, d) => {
      o("caret", N, p, E, $, u, d);
      let S;
      return A(E) ? S = "" : A($) ? S = `>=${E}.0.0${m} <${+E + 1}.0.0-0` : A(u) ? E === "0" ? S = `>=${E}.${$}.0${m} <${E}.${+$ + 1}.0-0` : S = `>=${E}.${$}.0${m} <${+E + 1}.0.0-0` : d ? (o("replaceCaret pr", d), E === "0" ? $ === "0" ? S = `>=${E}.${$}.${u}-${d} <${E}.${$}.${+u + 1}-0` : S = `>=${E}.${$}.${u}-${d} <${E}.${+$ + 1}.0-0` : S = `>=${E}.${$}.${u}-${d} <${+E + 1}.0.0-0`) : (o("no pr"), E === "0" ? $ === "0" ? S = `>=${E}.${$}.${u} <${E}.${$}.${+u + 1}-0` : S = `>=${E}.${$}.${u} <${E}.${+$ + 1}.0-0` : S = `>=${E}.${$}.${u} <${+E + 1}.0.0-0`), o("caret return", S), S;
    });
  }, Z = (N, g) => (o("replaceXRanges", N, g), N.split(/\s+/).map((O) => x(O, g)).join(" ")), x = (N, g) => {
    N = N.trim();
    const O = g.loose ? i[c.XRANGELOOSE] : i[c.XRANGE];
    return N.replace(O, (m, p, E, $, u, d) => {
      if (o("xRange", N, m, p, E, $, u, d), G(E, $, u))
        return N;
      const S = A(E), C = S || A($), j = C || A(u), q = j;
      return p === "=" && q && (p = ""), d = g.includePrerelease ? "-0" : "", S ? p === ">" || p === "<" ? m = "<0.0.0-0" : m = "*" : p && q ? (C && ($ = 0), u = 0, p === ">" ? (p = ">=", C ? (E = +E + 1, $ = 0, u = 0) : ($ = +$ + 1, u = 0)) : p === "<=" && (p = "<", C ? E = +E + 1 : $ = +$ + 1), p === "<" && (d = "-0"), m = `${p + E}.${$}.${u}${d}`) : C ? m = `>=${E}.0.0${d} <${+E + 1}.0.0-0` : j && (m = `>=${E}.${$}.0${d} <${E}.${+$ + 1}.0-0`), o("xRange return", m), m;
    });
  }, se = (N, g) => (o("replaceStars", N, g), N.trim().replace(i[c.STAR], "")), re = (N, g) => (o("replaceGTE0", N, g), N.trim().replace(i[g.includePrerelease ? c.GTE0PRE : c.GTE0], "")), ue = (N) => (g, O, m, p, E, $, u, d, S, C, j, q) => (A(m) ? O = "" : A(p) ? O = `>=${m}.0.0${N ? "-0" : ""}` : A(E) ? O = `>=${m}.${p}.0${N ? "-0" : ""}` : $ ? O = `>=${O}` : O = `>=${O}${N ? "-0" : ""}`, A(S) ? d = "" : A(C) ? d = `<${+S + 1}.0.0-0` : A(j) ? d = `<${S}.${+C + 1}.0-0` : q ? d = `<=${S}.${C}.${j}-${q}` : N ? d = `<${S}.${C}.${+j + 1}-0` : d = `<=${d}`, `${O} ${d}`.trim()), Te = (N, g, O) => {
    for (let m = 0; m < N.length; m++)
      if (!N[m].test(g))
        return !1;
    if (g.prerelease.length && !O.includePrerelease) {
      for (let m = 0; m < N.length; m++)
        if (o(N[m].semver), N[m].semver !== a.ANY && N[m].semver.prerelease.length > 0) {
          const p = N[m].semver;
          if (p.major === g.major && p.minor === g.minor && p.patch === g.patch)
            return !0;
        }
      return !1;
    }
    return !0;
  };
  return Fr;
}
var Ur, sa;
function yr() {
  if (sa) return Ur;
  sa = 1;
  const e = Symbol("SemVer ANY");
  class t {
    static get ANY() {
      return e;
    }
    constructor(c, h) {
      if (h = r(h), c instanceof t) {
        if (c.loose === !!h.loose)
          return c;
        c = c.value;
      }
      c = c.trim().split(/\s+/).join(" "), o("comparator", c, h), this.options = h, this.loose = !!h.loose, this.parse(c), this.semver === e ? this.value = "" : this.value = this.operator + this.semver.version, o("comp", this);
    }
    parse(c) {
      const h = this.options.loose ? n[s.COMPARATORLOOSE] : n[s.COMPARATOR], P = c.match(h);
      if (!P)
        throw new TypeError(`Invalid comparator: ${c}`);
      this.operator = P[1] !== void 0 ? P[1] : "", this.operator === "=" && (this.operator = ""), P[2] ? this.semver = new l(P[2], this.options.loose) : this.semver = e;
    }
    toString() {
      return this.value;
    }
    test(c) {
      if (o("Comparator.test", c, this.options.loose), this.semver === e || c === e)
        return !0;
      if (typeof c == "string")
        try {
          c = new l(c, this.options);
        } catch {
          return !1;
        }
      return a(c, this.operator, this.semver, this.options);
    }
    intersects(c, h) {
      if (!(c instanceof t))
        throw new TypeError("a Comparator is required");
      return this.operator === "" ? this.value === "" ? !0 : new i(c.value, h).test(this.value) : c.operator === "" ? c.value === "" ? !0 : new i(this.value, h).test(c.semver) : (h = r(h), h.includePrerelease && (this.value === "<0.0.0-0" || c.value === "<0.0.0-0") || !h.includePrerelease && (this.value.startsWith("<0.0.0") || c.value.startsWith("<0.0.0")) ? !1 : !!(this.operator.startsWith(">") && c.operator.startsWith(">") || this.operator.startsWith("<") && c.operator.startsWith("<") || this.semver.version === c.semver.version && this.operator.includes("=") && c.operator.includes("=") || a(this.semver, "<", c.semver, h) && this.operator.startsWith(">") && c.operator.startsWith("<") || a(this.semver, ">", c.semver, h) && this.operator.startsWith("<") && c.operator.startsWith(">")));
    }
  }
  Ur = t;
  const r = ds, { safeRe: n, t: s } = Dt, a = Zo, o = pr, l = de, i = Ne();
  return Ur;
}
const Kp = Ne(), xp = (e, t, r) => {
  try {
    t = new Kp(t, r);
  } catch {
    return !1;
  }
  return t.test(e);
};
var $r = xp;
const Wp = Ne(), Xp = (e, t) => new Wp(e, t).set.map((r) => r.map((n) => n.value).join(" ").trim().split(" "));
var Bp = Xp;
const Yp = de, Jp = Ne(), Zp = (e, t, r) => {
  let n = null, s = null, a = null;
  try {
    a = new Jp(t, r);
  } catch {
    return null;
  }
  return e.forEach((o) => {
    a.test(o) && (!n || s.compare(o) === -1) && (n = o, s = new Yp(n, r));
  }), n;
};
var Qp = Zp;
const em = de, tm = Ne(), rm = (e, t, r) => {
  let n = null, s = null, a = null;
  try {
    a = new tm(t, r);
  } catch {
    return null;
  }
  return e.forEach((o) => {
    a.test(o) && (!n || s.compare(o) === 1) && (n = o, s = new em(n, r));
  }), n;
};
var nm = rm;
const zr = de, sm = Ne(), aa = mr, am = (e, t) => {
  e = new sm(e, t);
  let r = new zr("0.0.0");
  if (e.test(r) || (r = new zr("0.0.0-0"), e.test(r)))
    return r;
  r = null;
  for (let n = 0; n < e.set.length; ++n) {
    const s = e.set[n];
    let a = null;
    s.forEach((o) => {
      const l = new zr(o.semver.version);
      switch (o.operator) {
        case ">":
          l.prerelease.length === 0 ? l.patch++ : l.prerelease.push(0), l.raw = l.format();
        case "":
        case ">=":
          (!a || aa(l, a)) && (a = l);
          break;
        case "<":
        case "<=":
          break;
        default:
          throw new Error(`Unexpected operation: ${o.operator}`);
      }
    }), a && (!r || aa(r, a)) && (r = a);
  }
  return r && e.test(r) ? r : null;
};
var om = am;
const im = Ne(), cm = (e, t) => {
  try {
    return new im(e, t).range || "*";
  } catch {
    return null;
  }
};
var lm = cm;
const um = de, Qo = yr(), { ANY: fm } = Qo, dm = Ne(), hm = $r, oa = mr, ia = ps, pm = ys, mm = ms, ym = (e, t, r, n) => {
  e = new um(e, n), t = new dm(t, n);
  let s, a, o, l, i;
  switch (r) {
    case ">":
      s = oa, a = pm, o = ia, l = ">", i = ">=";
      break;
    case "<":
      s = ia, a = mm, o = oa, l = "<", i = "<=";
      break;
    default:
      throw new TypeError('Must provide a hilo val of "<" or ">"');
  }
  if (hm(e, t, n))
    return !1;
  for (let f = 0; f < t.set.length; ++f) {
    const c = t.set[f];
    let h = null, P = null;
    if (c.forEach((_) => {
      _.semver === fm && (_ = new Qo(">=0.0.0")), h = h || _, P = P || _, s(_.semver, h.semver, n) ? h = _ : o(_.semver, P.semver, n) && (P = _);
    }), h.operator === l || h.operator === i || (!P.operator || P.operator === l) && a(e, P.semver))
      return !1;
    if (P.operator === i && o(e, P.semver))
      return !1;
  }
  return !0;
};
var $s = ym;
const $m = $s, _m = (e, t, r) => $m(e, t, ">", r);
var gm = _m;
const vm = $s, Em = (e, t, r) => vm(e, t, "<", r);
var wm = Em;
const ca = Ne(), Sm = (e, t, r) => (e = new ca(e, r), t = new ca(t, r), e.intersects(t, r));
var bm = Sm;
const Pm = $r, Rm = Ie;
var Om = (e, t, r) => {
  const n = [];
  let s = null, a = null;
  const o = e.sort((c, h) => Rm(c, h, r));
  for (const c of o)
    Pm(c, t, r) ? (a = c, s || (s = c)) : (a && n.push([s, a]), a = null, s = null);
  s && n.push([s, null]);
  const l = [];
  for (const [c, h] of n)
    c === h ? l.push(c) : !h && c === o[0] ? l.push("*") : h ? c === o[0] ? l.push(`<=${h}`) : l.push(`${c} - ${h}`) : l.push(`>=${c}`);
  const i = l.join(" || "), f = typeof t.raw == "string" ? t.raw : String(t);
  return i.length < f.length ? i : t;
};
const la = Ne(), _s = yr(), { ANY: Vr } = _s, qr = $r, gs = Ie, Im = (e, t, r = {}) => {
  if (e === t)
    return !0;
  e = new la(e, r), t = new la(t, r);
  let n = !1;
  e: for (const s of e.set) {
    for (const a of t.set) {
      const o = Tm(s, a, r);
      if (n = n || o !== null, o)
        continue e;
    }
    if (n)
      return !1;
  }
  return !0;
}, Nm = [new _s(">=0.0.0-0")], ua = [new _s(">=0.0.0")], Tm = (e, t, r) => {
  if (e === t)
    return !0;
  if (e.length === 1 && e[0].semver === Vr) {
    if (t.length === 1 && t[0].semver === Vr)
      return !0;
    r.includePrerelease ? e = Nm : e = ua;
  }
  if (t.length === 1 && t[0].semver === Vr) {
    if (r.includePrerelease)
      return !0;
    t = ua;
  }
  const n = /* @__PURE__ */ new Set();
  let s, a;
  for (const _ of e)
    _.operator === ">" || _.operator === ">=" ? s = fa(s, _, r) : _.operator === "<" || _.operator === "<=" ? a = da(a, _, r) : n.add(_.semver);
  if (n.size > 1)
    return null;
  let o;
  if (s && a) {
    if (o = gs(s.semver, a.semver, r), o > 0)
      return null;
    if (o === 0 && (s.operator !== ">=" || a.operator !== "<="))
      return null;
  }
  for (const _ of n) {
    if (s && !qr(_, String(s), r) || a && !qr(_, String(a), r))
      return null;
    for (const R of t)
      if (!qr(_, String(R), r))
        return !1;
    return !0;
  }
  let l, i, f, c, h = a && !r.includePrerelease && a.semver.prerelease.length ? a.semver : !1, P = s && !r.includePrerelease && s.semver.prerelease.length ? s.semver : !1;
  h && h.prerelease.length === 1 && a.operator === "<" && h.prerelease[0] === 0 && (h = !1);
  for (const _ of t) {
    if (c = c || _.operator === ">" || _.operator === ">=", f = f || _.operator === "<" || _.operator === "<=", s) {
      if (P && _.semver.prerelease && _.semver.prerelease.length && _.semver.major === P.major && _.semver.minor === P.minor && _.semver.patch === P.patch && (P = !1), _.operator === ">" || _.operator === ">=") {
        if (l = fa(s, _, r), l === _ && l !== s)
          return !1;
      } else if (s.operator === ">=" && !_.test(s.semver))
        return !1;
    }
    if (a) {
      if (h && _.semver.prerelease && _.semver.prerelease.length && _.semver.major === h.major && _.semver.minor === h.minor && _.semver.patch === h.patch && (h = !1), _.operator === "<" || _.operator === "<=") {
        if (i = da(a, _, r), i === _ && i !== a)
          return !1;
      } else if (a.operator === "<=" && !_.test(a.semver))
        return !1;
    }
    if (!_.operator && (a || s) && o !== 0)
      return !1;
  }
  return !(s && f && !a && o !== 0 || a && c && !s && o !== 0 || P || h);
}, fa = (e, t, r) => {
  if (!e)
    return t;
  const n = gs(e.semver, t.semver, r);
  return n > 0 ? e : n < 0 || t.operator === ">" && e.operator === ">=" ? t : e;
}, da = (e, t, r) => {
  if (!e)
    return t;
  const n = gs(e.semver, t.semver, r);
  return n < 0 ? e : n > 0 || t.operator === "<" && e.operator === "<=" ? t : e;
};
var Am = Im;
const Gr = Dt, ha = Ct, jm = de, pa = Bo, Cm = tt, Dm = jh, km = kh, Lm = Mh, Mm = Uh, Fm = qh, Um = Kh, zm = Xh, Vm = Jh, qm = Ie, Gm = tp, Hm = sp, Km = hs, xm = cp, Wm = fp, Xm = mr, Bm = ps, Ym = Yo, Jm = Jo, Zm = ms, Qm = ys, ey = Zo, ty = Dp, ry = qp, ny = yr(), sy = Ne(), ay = $r, oy = Bp, iy = Qp, cy = nm, ly = om, uy = lm, fy = $s, dy = gm, hy = wm, py = bm, my = Om, yy = Am;
var $y = {
  parse: Cm,
  valid: Dm,
  clean: km,
  inc: Lm,
  diff: Mm,
  major: Fm,
  minor: Um,
  patch: zm,
  prerelease: Vm,
  compare: qm,
  rcompare: Gm,
  compareLoose: Hm,
  compareBuild: Km,
  sort: xm,
  rsort: Wm,
  gt: Xm,
  lt: Bm,
  eq: Ym,
  neq: Jm,
  gte: Zm,
  lte: Qm,
  cmp: ey,
  coerce: ty,
  truncate: ry,
  Comparator: ny,
  Range: sy,
  satisfies: ay,
  toComparators: oy,
  maxSatisfying: iy,
  minSatisfying: cy,
  minVersion: ly,
  validRange: uy,
  outside: fy,
  gtr: dy,
  ltr: hy,
  intersects: py,
  simplifyRange: my,
  subset: yy,
  SemVer: jm,
  re: Gr.re,
  src: Gr.src,
  tokens: Gr.t,
  SEMVER_SPEC_VERSION: ha.SEMVER_SPEC_VERSION,
  RELEASE_TYPES: ha.RELEASE_TYPES,
  compareIdentifiers: pa.compareIdentifiers,
  rcompareIdentifiers: pa.rcompareIdentifiers
}, _r = { exports: {} }, vs = { exports: {} };
const ei = (e, t) => {
  for (const r of Reflect.ownKeys(t))
    Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
  return e;
};
vs.exports = ei;
vs.exports.default = ei;
var _y = vs.exports;
const gy = _y, or = /* @__PURE__ */ new WeakMap(), ti = (e, t = {}) => {
  if (typeof e != "function")
    throw new TypeError("Expected a function");
  let r, n = 0;
  const s = e.displayName || e.name || "<anonymous>", a = function(...o) {
    if (or.set(a, ++n), n === 1)
      r = e.apply(this, o), e = null;
    else if (t.throw === !0)
      throw new Error(`Function \`${s}\` can only be called once`);
    return r;
  };
  return gy(a, e), or.set(a, n), a;
};
_r.exports = ti;
_r.exports.default = ti;
_r.exports.callCount = (e) => {
  if (!or.has(e))
    throw new Error(`The given function \`${e.name}\` is not wrapped by the \`onetime\` package`);
  return or.get(e);
};
var vy = _r.exports;
(function(e, t) {
  var r = kt && kt.__classPrivateFieldSet || function(N, g, O, m, p) {
    if (m === "m") throw new TypeError("Private method is not writable");
    if (m === "a" && !p) throw new TypeError("Private accessor was defined without a setter");
    if (typeof g == "function" ? N !== g || !p : !g.has(N)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return m === "a" ? p.call(N, O) : p ? p.value = O : g.set(N, O), O;
  }, n = kt && kt.__classPrivateFieldGet || function(N, g, O, m) {
    if (O === "a" && !m) throw new TypeError("Private accessor was defined without a getter");
    if (typeof g == "function" ? N !== g || !m : !g.has(N)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return O === "m" ? m : O === "a" ? m.call(N) : m ? m.value : g.get(N);
  }, s, a, o, l, i, f;
  Object.defineProperty(t, "__esModule", { value: !0 });
  const c = wa, h = on, P = ke, _ = ui, R = fi, v = di, w = _i, y = Ni, b = Ci, I = Ce, T = Ho, A = sh, G = mh, K = $y, he = vy, L = "aes-256-cbc", F = () => /* @__PURE__ */ Object.create(null), Z = (N) => N != null;
  let x = "";
  try {
    delete require.cache[__filename], x = P.dirname((a = (s = e.parent) === null || s === void 0 ? void 0 : s.filename) !== null && a !== void 0 ? a : ".");
  } catch {
  }
  const se = (N, g) => {
    const O = /* @__PURE__ */ new Set([
      "undefined",
      "symbol",
      "function"
    ]), m = typeof g;
    if (O.has(m))
      throw new TypeError(`Setting a value of type \`${m}\` for key \`${N}\` is not allowed as it's not supported by JSON`);
  }, re = "__internal__", ue = `${re}.migrations.version`;
  class Te {
    constructor(g = {}) {
      var O;
      o.set(this, void 0), l.set(this, void 0), i.set(this, void 0), f.set(this, {}), this._deserialize = (d) => JSON.parse(d), this._serialize = (d) => JSON.stringify(d, void 0, "	");
      const m = {
        configName: "config",
        fileExtension: "json",
        projectSuffix: "nodejs",
        clearInvalidConfig: !1,
        accessPropertiesByDotNotation: !0,
        configFileMode: 438,
        ...g
      }, p = he(() => {
        const d = y.sync({ cwd: x }), S = d && JSON.parse(h.readFileSync(d, "utf8"));
        return S ?? {};
      });
      if (!m.cwd) {
        if (m.projectName || (m.projectName = p().name), !m.projectName)
          throw new Error("Project name could not be inferred. Please specify the `projectName` option.");
        m.cwd = b(m.projectName, { suffix: m.projectSuffix }).config;
      }
      if (r(this, i, m, "f"), m.schema) {
        if (typeof m.schema != "object")
          throw new TypeError("The `schema` option must be an object.");
        const d = new T.default({
          allErrors: !0,
          useDefaults: !0
        });
        (0, A.default)(d);
        const S = {
          type: "object",
          properties: m.schema
        };
        r(this, o, d.compile(S), "f");
        for (const [C, j] of Object.entries(m.schema))
          j != null && j.default && (n(this, f, "f")[C] = j.default);
      }
      m.defaults && r(this, f, {
        ...n(this, f, "f"),
        ...m.defaults
      }, "f"), m.serialize && (this._serialize = m.serialize), m.deserialize && (this._deserialize = m.deserialize), this.events = new v.EventEmitter(), r(this, l, m.encryptionKey, "f");
      const E = m.fileExtension ? `.${m.fileExtension}` : "";
      this.path = P.resolve(m.cwd, `${(O = m.configName) !== null && O !== void 0 ? O : "config"}${E}`);
      const $ = this.store, u = Object.assign(F(), m.defaults, $);
      this._validate(u);
      try {
        R.deepEqual($, u);
      } catch {
        this.store = u;
      }
      if (m.watch && this._watch(), m.migrations) {
        if (m.projectVersion || (m.projectVersion = p().version), !m.projectVersion)
          throw new Error("Project version could not be inferred. Please specify the `projectVersion` option.");
        this._migrate(m.migrations, m.projectVersion, m.beforeEachMigration);
      }
    }
    get(g, O) {
      if (n(this, i, "f").accessPropertiesByDotNotation)
        return this._get(g, O);
      const { store: m } = this;
      return g in m ? m[g] : O;
    }
    set(g, O) {
      if (typeof g != "string" && typeof g != "object")
        throw new TypeError(`Expected \`key\` to be of type \`string\` or \`object\`, got ${typeof g}`);
      if (typeof g != "object" && O === void 0)
        throw new TypeError("Use `delete()` to clear values");
      if (this._containsReservedKey(g))
        throw new TypeError(`Please don't use the ${re} key, as it's used to manage this module internal operations.`);
      const { store: m } = this, p = (E, $) => {
        se(E, $), n(this, i, "f").accessPropertiesByDotNotation ? w.set(m, E, $) : m[E] = $;
      };
      if (typeof g == "object") {
        const E = g;
        for (const [$, u] of Object.entries(E))
          p($, u);
      } else
        p(g, O);
      this.store = m;
    }
    /**
        Check if an item exists.
    
        @param key - The key of the item to check.
        */
    has(g) {
      return n(this, i, "f").accessPropertiesByDotNotation ? w.has(this.store, g) : g in this.store;
    }
    /**
        Reset items to their default values, as defined by the `defaults` or `schema` option.
    
        @see `clear()` to reset all items.
    
        @param keys - The keys of the items to reset.
        */
    reset(...g) {
      for (const O of g)
        Z(n(this, f, "f")[O]) && this.set(O, n(this, f, "f")[O]);
    }
    /**
        Delete an item.
    
        @param key - The key of the item to delete.
        */
    delete(g) {
      const { store: O } = this;
      n(this, i, "f").accessPropertiesByDotNotation ? w.delete(O, g) : delete O[g], this.store = O;
    }
    /**
        Delete all items.
    
        This resets known items to their default values, if defined by the `defaults` or `schema` option.
        */
    clear() {
      this.store = F();
      for (const g of Object.keys(n(this, f, "f")))
        this.reset(g);
    }
    /**
        Watches the given `key`, calling `callback` on any changes.
    
        @param key - The key wo watch.
        @param callback - A callback function that is called on any changes. When a `key` is first set `oldValue` will be `undefined`, and when a key is deleted `newValue` will be `undefined`.
        @returns A function, that when called, will unsubscribe.
        */
    onDidChange(g, O) {
      if (typeof g != "string")
        throw new TypeError(`Expected \`key\` to be of type \`string\`, got ${typeof g}`);
      if (typeof O != "function")
        throw new TypeError(`Expected \`callback\` to be of type \`function\`, got ${typeof O}`);
      return this._handleChange(() => this.get(g), O);
    }
    /**
        Watches the whole config object, calling `callback` on any changes.
    
        @param callback - A callback function that is called on any changes. When a `key` is first set `oldValue` will be `undefined`, and when a key is deleted `newValue` will be `undefined`.
        @returns A function, that when called, will unsubscribe.
        */
    onDidAnyChange(g) {
      if (typeof g != "function")
        throw new TypeError(`Expected \`callback\` to be of type \`function\`, got ${typeof g}`);
      return this._handleChange(() => this.store, g);
    }
    get size() {
      return Object.keys(this.store).length;
    }
    get store() {
      try {
        const g = h.readFileSync(this.path, n(this, l, "f") ? null : "utf8"), O = this._encryptData(g), m = this._deserialize(O);
        return this._validate(m), Object.assign(F(), m);
      } catch (g) {
        if ((g == null ? void 0 : g.code) === "ENOENT")
          return this._ensureDirectory(), F();
        if (n(this, i, "f").clearInvalidConfig && g.name === "SyntaxError")
          return F();
        throw g;
      }
    }
    set store(g) {
      this._ensureDirectory(), this._validate(g), this._write(g), this.events.emit("change");
    }
    *[(o = /* @__PURE__ */ new WeakMap(), l = /* @__PURE__ */ new WeakMap(), i = /* @__PURE__ */ new WeakMap(), f = /* @__PURE__ */ new WeakMap(), Symbol.iterator)]() {
      for (const [g, O] of Object.entries(this.store))
        yield [g, O];
    }
    _encryptData(g) {
      if (!n(this, l, "f"))
        return g.toString();
      try {
        if (n(this, l, "f"))
          try {
            if (g.slice(16, 17).toString() === ":") {
              const O = g.slice(0, 16), m = _.pbkdf2Sync(n(this, l, "f"), O.toString(), 1e4, 32, "sha512"), p = _.createDecipheriv(L, m, O);
              g = Buffer.concat([p.update(Buffer.from(g.slice(17))), p.final()]).toString("utf8");
            } else {
              const O = _.createDecipher(L, n(this, l, "f"));
              g = Buffer.concat([O.update(Buffer.from(g)), O.final()]).toString("utf8");
            }
          } catch {
          }
      } catch {
      }
      return g.toString();
    }
    _handleChange(g, O) {
      let m = g();
      const p = () => {
        const E = m, $ = g();
        (0, c.isDeepStrictEqual)($, E) || (m = $, O.call(this, $, E));
      };
      return this.events.on("change", p), () => this.events.removeListener("change", p);
    }
    _validate(g) {
      if (!n(this, o, "f") || n(this, o, "f").call(this, g) || !n(this, o, "f").errors)
        return;
      const m = n(this, o, "f").errors.map(({ instancePath: p, message: E = "" }) => `\`${p.slice(1)}\` ${E}`);
      throw new Error("Config schema violation: " + m.join("; "));
    }
    _ensureDirectory() {
      h.mkdirSync(P.dirname(this.path), { recursive: !0 });
    }
    _write(g) {
      let O = this._serialize(g);
      if (n(this, l, "f")) {
        const m = _.randomBytes(16), p = _.pbkdf2Sync(n(this, l, "f"), m.toString(), 1e4, 32, "sha512"), E = _.createCipheriv(L, p, m);
        O = Buffer.concat([m, Buffer.from(":"), E.update(Buffer.from(O)), E.final()]);
      }
      if (process.env.SNAP)
        h.writeFileSync(this.path, O, { mode: n(this, i, "f").configFileMode });
      else
        try {
          I.writeFileSync(this.path, O, { mode: n(this, i, "f").configFileMode });
        } catch (m) {
          if ((m == null ? void 0 : m.code) === "EXDEV") {
            h.writeFileSync(this.path, O, { mode: n(this, i, "f").configFileMode });
            return;
          }
          throw m;
        }
    }
    _watch() {
      this._ensureDirectory(), h.existsSync(this.path) || this._write(F()), process.platform === "win32" ? h.watch(this.path, { persistent: !1 }, G(() => {
        this.events.emit("change");
      }, { wait: 100 })) : h.watchFile(this.path, { persistent: !1 }, G(() => {
        this.events.emit("change");
      }, { wait: 5e3 }));
    }
    _migrate(g, O, m) {
      let p = this._get(ue, "0.0.0");
      const E = Object.keys(g).filter((u) => this._shouldPerformMigration(u, p, O));
      let $ = { ...this.store };
      for (const u of E)
        try {
          m && m(this, {
            fromVersion: p,
            toVersion: u,
            finalVersion: O,
            versions: E
          });
          const d = g[u];
          d(this), this._set(ue, u), p = u, $ = { ...this.store };
        } catch (d) {
          throw this.store = $, new Error(`Something went wrong during the migration! Changes applied to the store until this failed migration will be restored. ${d}`);
        }
      (this._isVersionInRangeFormat(p) || !K.eq(p, O)) && this._set(ue, O);
    }
    _containsReservedKey(g) {
      return typeof g == "object" && Object.keys(g)[0] === re ? !0 : typeof g != "string" ? !1 : n(this, i, "f").accessPropertiesByDotNotation ? !!g.startsWith(`${re}.`) : !1;
    }
    _isVersionInRangeFormat(g) {
      return K.clean(g) === null;
    }
    _shouldPerformMigration(g, O, m) {
      return this._isVersionInRangeFormat(g) ? O !== "0.0.0" && K.satisfies(O, g) ? !1 : K.satisfies(m, g) : !(K.lte(g, O) || K.gt(g, m));
    }
    _get(g, O) {
      return w.get(this.store, g, O);
    }
    _set(g, O) {
      const { store: m } = this;
      w.set(m, g, O), this.store = m;
    }
  }
  t.default = Te, e.exports = Te, e.exports.default = Te;
})(xr, xr.exports);
var Ey = xr.exports;
const ma = ke, { app: er, ipcMain: an, ipcRenderer: ya, shell: wy } = ai, Sy = Ey;
let $a = !1;
const _a = () => {
  if (!an || !er)
    throw new Error("Electron Store: You need to call `.initRenderer()` from the main process.");
  const e = {
    defaultCwd: er.getPath("userData"),
    appVersion: er.getVersion()
  };
  return $a || (an.on("electron-store-get-data", (t) => {
    t.returnValue = e;
  }), $a = !0), e;
};
class by extends Sy {
  constructor(t) {
    let r, n;
    if (ya) {
      const s = ya.sendSync("electron-store-get-data");
      if (!s)
        throw new Error("Electron Store: You need to call `.initRenderer()` from the main process.");
      ({ defaultCwd: r, appVersion: n } = s);
    } else an && er && ({ defaultCwd: r, appVersion: n } = _a());
    t = {
      name: "config",
      ...t
    }, t.projectVersion || (t.projectVersion = n), t.cwd ? t.cwd = ma.isAbsolute(t.cwd) ? t.cwd : ma.join(r, t.cwd) : t.cwd = r, t.configName = t.name, delete t.name, super(t);
  }
  static initRenderer() {
    _a();
  }
  async openInEditor() {
    const t = await wy.openPath(this.path);
    if (t)
      throw new Error(t);
  }
}
var Py = by;
const Ry = /* @__PURE__ */ pi(Py), _e = {
  mainWindow: null,
  store: new Ry()
}, Oy = li(import.meta.url), ga = ke.dirname(Oy), Hr = 64, Kr = 64, va = 40, Iy = ["*://*.hdslb.com/*", "*://*.bilivideo.com/*", "*://*.bilibili.com/*"];
function ri() {
  const e = oi.getPrimaryDisplay(), { width: t, height: r } = e.workAreaSize, { x: n, y: s } = e.workArea;
  let a = n + t - Hr - va, o = s + r - Kr - va;
  const l = new ii({
    width: Hr,
    height: Kr,
    minWidth: Hr,
    minHeight: Kr,
    x: a,
    y: o,
    alwaysOnTop: !0,
    frame: !1,
    transparent: !0,
    backgroundColor: "#00000000",
    hasShadow: !1,
    resizable: !0,
    skipTaskbar: !1,
    show: !1,
    webPreferences: {
      preload: ke.join(ga, "preload.js"),
      contextIsolation: !0,
      nodeIntegration: !1
    }
  });
  _e.mainWindow = l, l.webContents.session.webRequest.onBeforeSendHeaders(
    { urls: Iy },
    (i, f) => {
      i.requestHeaders.Referer = "https://www.bilibili.com/", i.requestHeaders["User-Agent"] = "Mozilla/5.0", f({ requestHeaders: i.requestHeaders });
    }
  ), l.once("ready-to-show", () => {
    l == null || l.show();
  }), l.webContents.on("render-process-gone", (i, f) => {
    console.error("[main] RENDERER CRASHED:", f.reason, f.exitCode);
  }), process.env.VITE_DEV_SERVER_URL ? (l.loadURL(process.env.VITE_DEV_SERVER_URL), ci.register("F12", () => {
    l == null || l.webContents.toggleDevTools();
  })) : l.loadFile(ke.join(ga, "../dist/index.html")), l.on("close", () => {
    const i = l.getPosition();
    _e.store.set("windowPosition", { left: i[0], top: i[1] });
  }), l.on("closed", () => {
    _e.mainWindow = null;
  });
}
const Ea = 20, Ny = 10 * 60 * 1e3;
async function ni(e) {
  const r = await (await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${e}`, {
    headers: { Referer: "https://www.bilibili.com/", "User-Agent": "Mozilla/5.0" }
  })).json();
  if (r.code !== 0) throw new Error(r.message);
  return { bvid: r.data.bvid, cid: r.data.cid, title: r.data.title, author: r.data.owner.name, cover: r.data.pic, duration: r.data.duration };
}
function Ty(e) {
  const t = e.match(/medialist\/play\/dlista\/(\d+)\/(\d+)/);
  if (t) return { seasonId: t[1], mid: t[2] };
  const r = e.match(/space\.bilibili\.com\/(\d+)\/favlist\?.*fid=(\d+)/);
  return r ? { seasonId: r[2], mid: r[1] } : null;
}
async function Ay(e, t) {
  var a, o, l;
  const r = [];
  let n = 1;
  for (; ; ) {
    const f = await (await fetch(`https://api.bilibili.com/x/v3/fav/resource/list?media_id=${t}&pn=${n}&ps=${Ea}`, {
      headers: { Referer: "https://www.bilibili.com/", "User-Agent": "Mozilla/5.0" }
    })).json();
    if (f.code !== 0) throw new Error(f.message);
    const c = ((a = f.data) == null ? void 0 : a.list) || ((o = f.data) == null ? void 0 : o.medias) || [];
    if (c.length === 0 || (r.push(...c), !((l = f.data) != null && l.has_more) || c.length < Ea)) break;
    n++;
  }
  return await Promise.all(r.map(async (i) => {
    var f, c;
    try {
      const h = await ni(i.bvid);
      return {
        bvid: i.bvid,
        cid: h.cid,
        title: i.title,
        author: ((f = i.upper) == null ? void 0 : f.name) || "",
        cover: i.cover,
        duration: i.duration
      };
    } catch {
      return {
        bvid: i.bvid,
        cid: 0,
        title: i.title,
        author: ((c = i.upper) == null ? void 0 : c.name) || "",
        cover: i.cover,
        duration: i.duration
      };
    }
  }));
}
async function jy(e, t) {
  var o, l;
  const n = await (await fetch(`https://api.bilibili.com/x/player/playurl?bvid=${e}&cid=${t}&qn=0&fnval=16&fnver=0&fourk=1`, {
    headers: { Referer: "https://www.bilibili.com/", "User-Agent": "Mozilla/5.0" }
  })).json();
  if (n.code !== 0) throw new Error(n.message);
  const s = (l = (o = n.data.dash) == null ? void 0 : o.audio) == null ? void 0 : l[0];
  if (!s) throw new Error("No audio track found");
  const a = s.baseUrl || s.base_url;
  if (!a) throw new Error("No audio URL");
  return { url: a, expiresAt: Date.now() + Ny };
}
const Cy = { width: 320, height: 480 };
function Dy() {
  xe.handle("api", async (e, t) => {
    try {
      switch (t.type) {
        case "GET_VIDEO_INFO":
          return { success: !0, data: await ni(t.bvid) };
        case "GET_PLAYLIST": {
          const r = Ty(t.url);
          if (!r) throw new Error("Invalid playlist URL");
          return { success: !0, data: await Ay(r.mid, r.seasonId) };
        }
        case "GET_AUDIO_URL":
          return { success: !0, data: await jy(t.bvid, t.cid) };
        default:
          return { success: !1, error: `Unknown message type: ${t.type}` };
      }
    } catch (r) {
      return { success: !1, error: r.message };
    }
  }), xe.handle("store:get", (e, t) => _e.store.get(t)), xe.handle("store:set", (e, t, r) => _e.store.set(t, r)), xe.on("window:move", (e, t, r) => {
    _e.mainWindow && _e.mainWindow.setPosition(Math.round(t), Math.round(r));
  }), xe.handle("window:resize", (e, t, r) => {
    _e.mainWindow && _e.mainWindow.setSize(Math.round(t), Math.round(r));
  }), xe.handle("window:getPosition", () => {
    if (!_e.mainWindow) return { x: 0, y: 0, ...Cy };
    const [e, t] = _e.mainWindow.getPosition(), [r, n] = _e.mainWindow.getSize();
    return { x: e, y: t, width: r, height: n };
  }), xe.handle("window:setMinimumSize", (e, t, r) => {
    _e.mainWindow && _e.mainWindow.setMinimumSize(Math.round(t), Math.round(r));
  });
}
ut.disableHardwareAcceleration();
ut.commandLine.appendSwitch("disable-gpu-cache");
ut.whenReady().then(() => {
  ri(), Dy();
});
ut.on("window-all-closed", () => {
  ut.quit();
});
ut.on("activate", () => {
  ri();
});
