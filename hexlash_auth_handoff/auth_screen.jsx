/* Hexlash auth screen — single screen, login + signup together (no tabs).
   One pink accent (#ff0069), reserved for the email Submit + field focus —
   the one native action we own. Provider buttons are equal & neutral.
   Provider buttons are triggers only: real input happens in an external
   provider modal (Privy) we don't design — we show a thin stub to signal it. */

const { useState, useRef, useEffect } = React;

const HX_STYLE = `
.hx-stage{position:absolute;inset:0;overflow:hidden;font-family:var(--mono);
  color:var(--white);background:var(--bg);
  --accent:#ff0069;--accent-rgb:255,0,105;--bg:#08080a;--white:#f6f4f6;
  --muted:#6e6a72;--muted2:#48454d;--line:rgba(255,255,255,.08);
  --line2:rgba(255,255,255,.14);--card:rgba(255,255,255,.022);
  --field:rgba(255,255,255,.03);--err:#d6534c;
  --disp:"Saira Condensed",sans-serif;--mono:"JetBrains Mono",monospace;
  background-image:radial-gradient(120% 78% at 50% -14%, #160a11 0%, #0b070a 44%, var(--bg) 78%);}
.hx-motif{position:absolute;inset:0;pointer-events:none;opacity:.5;
  background-position:center;mix-blend-mode:screen;}
.hx-wrap{position:absolute;inset:0;display:flex;flex-direction:column;
  align-items:center;justify-content:center;padding:48px 24px 96px;}
.hx-logo{margin-bottom:38px;display:flex;}
.hx-col{display:flex;flex-direction:column;align-items:stretch;
  width:var(--cardw,372px);}

.hx-card{background:var(--card);border:1px solid var(--line);border-radius:16px;
  padding:34px 30px 30px;backdrop-filter:blur(2px);position:relative;}
.hx-card.has-back{padding-top:50px;}
.hx-back{position:absolute;top:18px;left:16px;display:inline-flex;align-items:center;
  gap:5px;background:none;border:0;cursor:pointer;color:var(--muted);
  font-family:var(--mono);font-size:11px;letter-spacing:.18em;text-transform:uppercase;
  padding:6px 8px;border-radius:6px;transition:color .18s;}
.hx-back:hover{color:var(--white);}
.hx-head{text-align:center;margin-bottom:24px;}
.hx-title{font-family:var(--disp);font-weight:800;text-transform:uppercase;
  font-size:34px;line-height:.92;letter-spacing:.02em;}
.hx-sub{font-family:var(--mono);font-size:10.5px;letter-spacing:.24em;
  text-transform:uppercase;color:var(--muted);margin-top:9px;}

.hx-list{display:flex;flex-direction:column;gap:11px;}
.hx-btn{display:flex;align-items:center;gap:13px;width:100%;height:52px;
  padding:0 16px;background:var(--field);border:1px solid var(--line);
  border-radius:10px;color:var(--white);cursor:pointer;
  font-family:var(--mono);font-size:12.5px;font-weight:500;letter-spacing:.16em;
  text-transform:uppercase;transition:border-color .18s,background .18s,transform .12s;}
.hx-btn .hx-ic{display:flex;color:#cfccd3;flex:0 0 auto;}
.hx-btn .hx-lbl{flex:1 1 auto;text-align:left;}
.hx-btn .hx-chev{color:var(--muted);display:flex;}
.hx-btn:hover{border-color:var(--line2);background:rgba(255,255,255,.05);}
.hx-btn:active{transform:translateY(1px);}
.hx-btn:disabled{cursor:default;}

/* email field */
.hx-fieldrow{display:flex;align-items:center;gap:11px;height:54px;padding:0 6px 0 15px;
  background:var(--field);border:1px solid var(--line);border-radius:11px;
  transition:border-color .2s,box-shadow .25s,background .2s;}
.hx-fieldrow .hx-mic{color:var(--muted);display:flex;flex:0 0 auto;}
.hx-input{flex:1 1 auto;min-width:0;background:none;border:0;outline:0;color:var(--white);
  font-family:var(--mono);font-size:13.5px;letter-spacing:.02em;caret-color:var(--accent);}
.hx-input::placeholder{color:var(--muted2);letter-spacing:.02em;}
.hx-fieldrow.is-focus{border-color:var(--accent);
  box-shadow:0 0 0 1px rgba(var(--accent-rgb),.55),0 0 26px -2px rgba(var(--accent-rgb),.5);
  background:rgba(255,255,255,.045);}
.hx-fieldrow.is-error{border-color:var(--err);}
.hx-submit{flex:0 0 auto;height:42px;padding:0 20px;border-radius:8px;border:0;cursor:pointer;
  font-family:var(--mono);font-weight:700;font-size:11.5px;letter-spacing:.16em;text-transform:uppercase;
  background:rgba(255,255,255,.06);color:var(--muted);transition:background .2s,color .2s,box-shadow .2s;}
.hx-submit.is-ready{background:var(--accent);color:#fff;
  box-shadow:0 0 22px -3px rgba(var(--accent-rgb),.6);}
.hx-submit.is-ready:hover{filter:brightness(1.08);}
.hx-errline{display:flex;align-items:center;gap:7px;margin-top:11px;
  font-family:var(--mono);font-size:11px;letter-spacing:.04em;color:var(--err);}
.hx-fine{margin-top:14px;font-family:var(--mono);font-size:10.5px;line-height:1.7;
  letter-spacing:.02em;color:var(--muted);text-align:center;}
.hx-fine a{color:#a9a5af;text-decoration:none;border-bottom:1px solid rgba(255,255,255,.18);}

/* below-card */
.hx-referral{margin-top:14px;display:flex;align-items:center;justify-content:center;gap:9px;
  height:46px;width:100%;background:rgba(255,255,255,.015);border:1px dashed var(--line2);
  border-radius:10px;color:#bdb9c2;cursor:pointer;font-family:var(--mono);font-weight:500;
  font-size:11px;letter-spacing:.2em;text-transform:uppercase;transition:border-color .18s,color .18s;}
.hx-referral:hover{border-color:rgba(var(--accent-rgb),.4);color:var(--white);}
.hx-referral .hx-ic{color:var(--muted);display:flex;}
.hx-guest{margin-top:18px;text-align:center;}
.hx-guest button{background:none;border:0;cursor:pointer;color:var(--muted);
  font-family:var(--mono);font-size:11px;letter-spacing:.12em;
  border-bottom:1px solid transparent;padding-bottom:2px;transition:color .18s,border-color .18s;}
.hx-guest button:hover{color:#bdb9c2;border-color:rgba(255,255,255,.2);}

/* footer */
.hx-foot{position:absolute;left:0;right:0;bottom:0;height:54px;display:flex;
  align-items:center;justify-content:space-between;padding:0 30px;
  border-top:1px solid var(--line);background:rgba(8,8,10,.4);}
.hx-foot-l{display:flex;gap:22px;font-family:var(--mono);font-size:10px;letter-spacing:.18em;
  text-transform:uppercase;color:var(--muted);}
.hx-foot-l a{color:var(--muted);text-decoration:none;transition:color .18s;}
.hx-foot-l a:hover{color:var(--white);}
.hx-foot-r{display:flex;gap:8px;}
.hx-soc{width:30px;height:30px;display:flex;align-items:center;justify-content:center;
  border:1px solid var(--line);border-radius:7px;color:var(--muted);cursor:pointer;
  transition:color .18s,border-color .18s;background:none;}
.hx-soc:hover{color:var(--accent);border-color:rgba(var(--accent-rgb),.4);}

/* provider stub (NOT the real Privy modal — a thin signal only) */
.hx-stub{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
  background:rgba(6,6,8,.66);backdrop-filter:blur(4px);z-index:20;animation:hxfade .2s ease;}
.hx-stub-box{width:300px;border:1px solid var(--line2);border-radius:14px;
  background:#101013;padding:26px 24px;text-align:center;}
.hx-stub-box .hx-stub-ic{display:flex;justify-content:center;color:#cfccd3;margin-bottom:14px;}
.hx-stub-h{font-family:var(--disp);font-weight:700;text-transform:uppercase;font-size:19px;letter-spacing:.04em;}
.hx-stub-p{font-family:var(--mono);font-size:11px;line-height:1.6;letter-spacing:.04em;color:var(--muted);margin-top:8px;}
.hx-stub-tag{display:inline-block;margin-top:16px;font-family:var(--mono);font-size:9.5px;letter-spacing:.2em;
  text-transform:uppercase;color:var(--muted2);border:1px dashed var(--line);border-radius:5px;padding:5px 9px;}
.hx-stub-x{position:absolute;top:14px;right:16px;background:none;border:0;color:var(--muted);cursor:pointer;font-size:18px;}
.hx-toast{position:absolute;left:50%;bottom:74px;transform:translateX(-50%);z-index:25;
  display:flex;align-items:center;gap:9px;padding:11px 18px;border-radius:10px;
  background:#101013;border:1px solid rgba(var(--accent-rgb),.45);
  box-shadow:0 0 24px -6px rgba(var(--accent-rgb),.5);
  font-family:var(--mono);font-size:11px;letter-spacing:.08em;color:var(--white);animation:hxrise .25s ease;}
.hx-toast .hx-dot{width:7px;height:7px;border-radius:50%;background:var(--accent);box-shadow:0 0 9px var(--accent);}
@keyframes hxfade{from{opacity:0}to{opacity:1}}
.hx-stage.hx-noglow .hx-fieldrow.is-focus{box-shadow:0 0 0 1px rgba(var(--accent-rgb),.55);}
.hx-stage.hx-noglow .hx-submit.is-ready{box-shadow:none;}
.hx-stage.hx-noglow .hx-toast{box-shadow:none;}
@keyframes hxrise{from{opacity:0;transform:translate(-50%,8px)}to{opacity:1;transform:translateX(-50%)}}
`;

function injectHxStyle() {
  if (typeof document === 'undefined' || document.getElementById('hx-auth-style')) return;
  const s = document.createElement('style');
  s.id = 'hx-auth-style';
  s.textContent = HX_STYLE;
  document.head.appendChild(s);
}

// tiny dark hex-lattice motif as a data-URI background (very quiet)
function motifBg(accentRgb) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='56' height='64' viewBox='0 0 56 64'>
    <g fill='none' stroke='rgba(${accentRgb},0.07)' stroke-width='1'>
      <polygon points='28,2 52,16 52,44 28,58 4,44 4,16'/>
      <polygon points='28,30 40,37 40,51 28,58 16,51 16,37' stroke='rgba(255,255,255,0.035)'/>
    </g></svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function AuthScreen({ variant = 'live', tw = {} }) {
  useEffect(injectHxStyle, []);
  const accent = tw.accent || '#ff0069';
  const accentRgb = hexToRgb(accent);
  const headline = tw.headline || 'WELCOME';
  const showMotif = tw.motif !== false;
  const glow = tw.glow !== false;
  const cardw = tw.cardw || 372;

  // ---- initial state from variant (static previews freeze a state) ----
  const isLive = variant === 'live';
  const init = {
    live:           { stage: 'default', email: '', focus: false, error: false },
    'default':      { stage: 'default', email: '', focus: false, error: false },
    'more':         { stage: 'more',    email: '', focus: false, error: false },
    'email-empty':  { stage: 'email',   email: '', focus: false, error: false },
    'email-focus':  { stage: 'email',   email: '', focus: true,  error: false },
    'email-filled': { stage: 'email',   email: 'fighter@hexlash.gg', focus: false, error: false },
    'email-error':  { stage: 'email',   email: 'fighter@hex', focus: false, error: true },
  }[variant] || { stage: 'default', email: '', focus: false, error: false };

  const [stage, setStage] = useState(init.stage);
  const [email, setEmail] = useState(init.email);
  const [focus, setFocus] = useState(init.focus);
  const [error, setError] = useState(init.error);
  const [stub, setStub] = useState(null);
  const [toast, setToast] = useState(false);
  const inputRef = useRef(null);

  const valid = EMAIL_RE.test(email.trim());
  const block = !isLive; // static preview → no interaction

  const go = (s) => { if (block) return; setError(false); setStage(s); };
  const openStub = (name) => { if (block) return; setStub(name); };
  const pickEmail = () => { if (block) return; setStage('email'); setError(false);
    setTimeout(() => inputRef.current && inputRef.current.focus(), 30); };
  const submit = () => {
    if (block) return;
    if (!valid) { setError(true); return; }
    setError(false); setToast(true);
    clearTimeout(window.__hxToast); window.__hxToast = setTimeout(() => setToast(false), 2600);
  };

  const styleVars = {
    '--accent': accent, '--accent-rgb': accentRgb, '--cardw': cardw + 'px',
  };

  return (
    <div className={'hx-stage' + (glow ? '' : ' hx-noglow')} style={styleVars}>
      {showMotif && (
        <div className="hx-motif" style={{ background: motifBg(accentRgb), backgroundSize: '56px 64px' }} />
      )}

      <div className="hx-wrap">
        <div className="hx-logo">
          <HexMark size={62} color="#f6f4f6" />
        </div>

        <div className="hx-col">
          <div className={'hx-card' + (stage !== 'default' ? ' has-back' : '')}>
            {stage !== 'default' && (
              <button className="hx-back" onClick={() => go(stage === 'email' ? 'more' : 'default')}>
                <IconChevron s={13} dir="left" /> BACK
              </button>
            )}

            <div className="hx-head">
              <div className="hx-title">{headline}</div>
              <div className="hx-sub">
                {stage === 'email' ? 'ENTER YOUR EMAIL TO CONTINUE' : 'SELECT YOUR PREFERRED LOGIN OPTION'}
              </div>
            </div>

            {stage === 'default' && (
              <div className="hx-list">
                <button className="hx-btn" onClick={() => openStub('Google')}>
                  <span className="hx-ic"><IconGoogle s={18} /></span><span className="hx-lbl">Google</span>
                </button>
                <button className="hx-btn" onClick={() => openStub('X')}>
                  <span className="hx-ic"><IconX s={16} /></span><span className="hx-lbl">X</span>
                </button>
                <button className="hx-btn" onClick={() => openStub('Web3 Wallet')}>
                  <span className="hx-ic"><IconWallet s={19} /></span><span className="hx-lbl">Web3 Wallet</span>
                </button>
                <button className="hx-btn" onClick={() => go('more')}>
                  <span className="hx-ic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#cfccd3" strokeWidth="1.7"><circle cx="12" cy="8" r="3.4"/><path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" strokeLinecap="round"/></svg></span>
                  <span className="hx-lbl">More Options</span>
                  <span className="hx-chev"><IconChevron s={15} /></span>
                </button>
              </div>
            )}

            {stage === 'more' && (
              <div className="hx-list">
                <button className="hx-btn" onClick={pickEmail}>
                  <span className="hx-ic"><IconMail s={19} /></span><span className="hx-lbl">Email</span>
                </button>
                <button className="hx-btn" onClick={() => openStub('Farcaster')}>
                  <span className="hx-ic"><IconFarcaster s={18} /></span><span className="hx-lbl">Farcaster</span>
                </button>
                <button className="hx-btn" onClick={() => openStub('Discord')}>
                  <span className="hx-ic"><IconDiscord s={19} /></span><span className="hx-lbl">Discord</span>
                </button>
              </div>
            )}

            {stage === 'email' && (
              <div>
                <div className={'hx-fieldrow' + (focus ? ' is-focus' : '') + (error ? ' is-error' : '')}>
                  <span className="hx-mic"><IconMail s={18} /></span>
                  <input
                    ref={inputRef} className="hx-input" type="email" placeholder="your@email.com"
                    value={email} spellCheck="false"
                    onChange={(e) => { if (block) return; setEmail(e.target.value); if (error) setError(false); }}
                    onFocus={() => !block && setFocus(true)}
                    onBlur={() => !block && setFocus(false)}
                    onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
                  />
                  <button className={'hx-submit' + (valid ? ' is-ready' : '')} onClick={submit}>Submit</button>
                </div>
                {error && (
                  <div className="hx-errline">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5M12 16h.01" strokeLinecap="round"/></svg>
                    Enter a valid email address
                  </div>
                )}
                <div className="hx-fine">
                  By continuing you agree to our <a>Terms</a> &amp; <a>Privacy Policy</a>.
                </div>
              </div>
            )}
          </div>

          <button className="hx-referral" onClick={() => openStub('Referral code')}>
            <span className="hx-ic"><IconTicket s={15} /></span> I have a referral code
          </button>

          <div className="hx-guest">
            <button onClick={() => openStub('Guest mode')}>Play as Guest</button>
          </div>
        </div>
      </div>

      <div className="hx-foot">
        <div className="hx-foot-l">
          <a>Privacy Policy</a><a>Terms of Use</a>
        </div>
        <div className="hx-foot-r">
          <button className="hx-soc" aria-label="X"><IconX s={14} /></button>
          <button className="hx-soc" aria-label="Discord"><IconDiscord s={16} /></button>
        </div>
      </div>

      {toast && (
        <div className="hx-toast"><span className="hx-dot" /> Magic link sent to {email} ↗</div>
      )}

      {stub && (
        <div className="hx-stub" onClick={() => setStub(null)}>
          <div className="hx-stub-box" onClick={(e) => e.stopPropagation()}>
            <button className="hx-stub-x" onClick={() => setStub(null)}>×</button>
            <div className="hx-stub-ic">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="10" rx="2.4"/><path d="M7 11V8a5 5 0 0 1 10 0v3" strokeLinecap="round"/></svg>
            </div>
            <div className="hx-stub-h">{stub}</div>
            <div className="hx-stub-p">Continues in a secure provider window.<br/>That flow lives outside this screen.</div>
            <span className="hx-stub-tag">External · Privy</span>
          </div>
        </div>
      )}
    </div>
  );
}

function hexToRgb(hex) {
  const m = hex.replace('#', '');
  const n = m.length === 3 ? m.split('').map(c => c + c).join('') : m;
  const i = parseInt(n, 16);
  return `${(i >> 16) & 255},${(i >> 8) & 255},${i & 255}`;
}

Object.assign(window, { AuthScreen });
