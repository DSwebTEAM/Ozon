import { useState } from "react";

const GH = "https://github.com/DSwebTEAM/Ozon";
const CURL = "curl -fsSL https://get.ozon.is-a.dev | bash";
const GIT_STEPS = [
  "git clone https://github.com/DSwebTEAM/Ozon",
  "cd Ozon",
  "sudo bash install.sh",
];

const PRESETS = [
  { tier:"01", name:"Sentinel", scope:"VPS + Static", cert:false,
    items:["Custom SSH port (10000–65535)","fail2ban IP banning","Ed25519 keypair on install"] },
  { tier:"02", name:"Aegis", scope:"VPS + Static", cert:false,
    items:["mTLS between internal services","Outbound rate limiting","Audit trail log"] },
  { tier:"03", name:"Blacksite", scope:"VPS + Static", cert:false,
    items:["WireGuard or OpenVPN tunnel","Port 443 masquerade","Ghost mode daemon","Worker proxy + DB masking"] },
  { tier:"04", name:"Sovereign", scope:"VPS only", cert:true,
    items:["Port knocking","GeoIP blocking","Full session recording","DSwebTEAM certified seal"] },
];

const FACES = [
  { label:"Admin Face", badge:"For server operators",
    desc:"Hardens the channel between you and your server across five progressive layers — from SSH port randomisation through to a WireGuard ghost-mode daemon masquerading as a kernel thread.",
    layers:[
      {n:"L1", t:"Random SSH port (10000–65535)"},
      {n:"L2", t:"fail2ban — IP banning and rate limiting"},
      {n:"L3", t:"Ed25519 keypair + mTLS between internal services"},
      {n:"L4", t:"WireGuard tunnel — SSH runs inside it"},
      {n:"L5", t:"Port 443 masquerade + ghost mode daemon"},
    ]},
  { label:"Edge Face", badge:"For static sites and frontends",
    desc:"Protects credential delivery between your hosted site and the end-user browser. Runs entirely at the Cloudflare edge — no server required. A UV on the same network sees only standard TLSv1.3.",
    layers:[
      {n:"01", t:"Auto-injects ozon-edge.min.js (~10 kb)"},
      {n:"02", t:"App-layer encryption on tokens and JWTs"},
      {n:"03", t:"API keys stay in Worker env vars only"},
      {n:"04", t:"DB URL never reaches the browser"},
      {n:"05", t:"Request signing — only the Worker calls your API"},
    ]},
];

const CLI_CMDS = [
  {cmd:"ozon status",          desc:"Show which preset layers are active"},
  {cmd:"ozon audit",           desc:"Run a full security check"},
  {cmd:"ozon preset upgrade",  desc:"Move up to the next preset tier"},
  {cmd:"ozon harden",          desc:"Apply additional hardening within current tier"},
  {cmd:"ozon edge deploy",     desc:"Redeploy the Edge Face Worker script"},
  {cmd:"ozon logs",            desc:"View OZON activity and audit trail"},
  {cmd:"ozon rotate-keys",     desc:"Regenerate the device Ed25519 keypair"},
];

const ARCH_LAYERS = [
  {n:"L5", lbl:"Port 443 masquerade", col:"#5ac8fa",
   det:"WireGuard on 443 — indistinguishable from HTTPS. Ghost mode: daemon appears as [kworker/u4:2], hidden from ps / top / netstat."},
  {n:"L4", lbl:"WireGuard tunnel",    col:"#4db8e8",
   det:"SSH and all management traffic run encrypted inside the WireGuard tunnel. Activate: orbithost -wake / -ghost."},
  {n:"L3", lbl:"Ed25519 + mTLS",      col:"#3da8d0",
   det:"Ed25519 keypair generated on install. mTLS enforced between all internal services — no password auth anywhere."},
  {n:"L2", lbl:"fail2ban",            col:"#3090b8",
   det:"Aggressive rate limiting. IPs banned on repeated failed attempts. Threshold configurable per preset tier."},
  {n:"L1", lbl:"Custom SSH port",     col:"#2878a0",
   det:"SSH moved to a randomly chosen port 10000–65535. Eliminates the vast majority of automated scanner hits."},
];

const DOC_SECTIONS = [
  "Getting Started","Installation","Presets",
  "CLI Reference","VPS Setup","Static Site Setup","Attestation",
];

// ── CSS ───────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

:root{
  --bg:#0b0c10;
  --glass:rgba(255,255,255,0.055);
  --glass2:rgba(255,255,255,0.085);
  --brd:rgba(255,255,255,0.09);
  --brd2:rgba(255,255,255,0.15);
  --text:#f2f2f7;
  --t2:#8e8e93;
  --t3:#3a3a3c;
  --accent:#5ac8fa;
  --accent-dim:rgba(90,200,250,0.12);
  --green:#30d158;
  --green-dim:rgba(48,209,88,0.12);
  --blur:blur(28px);
  --sat:saturate(180%);
  --f:-apple-system,BlinkMacSystemFont,'Helvetica Neue','Segoe UI',sans-serif;
  --mono:'SF Mono','Fira Code','IBM Plex Mono',monospace;
  --r:18px; --r-md:12px; --r-sm:8px; --r-xs:6px;
}

html{scroll-behavior:smooth;}
body{background:var(--bg);overflow-x:hidden;}

.root{
  background:var(--bg);
  color:var(--text);
  font-family:var(--f);
  min-height:100vh;
  -webkit-font-smoothing:antialiased;
  position:relative;
}
.root::before{
  content:'';position:fixed;inset:0;pointer-events:none;z-index:0;
  background:
    radial-gradient(ellipse 80% 50% at 5% 0%,   rgba(90,200,250,.07) 0%,transparent 55%),
    radial-gradient(ellipse 60% 60% at 95% 100%, rgba(48,209,88,.04)  0%,transparent 55%),
    radial-gradient(ellipse 50% 40% at 50% 40%,  rgba(90,200,250,.03) 0%,transparent 60%);
}

/* ── NAV ── */
.nav{
  position:sticky;top:0;z-index:100;
  display:flex;align-items:center;justify-content:space-between;
  padding:0 clamp(20px,4vw,48px);height:52px;
  background:rgba(11,12,16,0.72);
  backdrop-filter:var(--blur) var(--sat);
  -webkit-backdrop-filter:var(--blur) var(--sat);
  border-bottom:1px solid var(--brd);
}
.nav-logo{
  font-family:var(--mono);font-size:14px;font-weight:600;
  letter-spacing:.06em;color:var(--text);cursor:pointer;
}
.nav-logo small{
  font-weight:400;font-size:11px;color:var(--t2);
  margin-left:8px;letter-spacing:.04em;
}
.nav-right{display:flex;align-items:center;gap:4px;}
.nav-btn{
  font-family:var(--f);font-size:13px;font-weight:400;
  background:none;border:none;color:var(--t2);cursor:pointer;
  padding:6px 12px;border-radius:var(--r-sm);transition:color .15s,background .15s;
}
.nav-btn:hover{color:var(--text);background:rgba(255,255,255,.06);}
.nav-btn.on{color:var(--accent);}
.nav-gh{
  font-family:var(--mono);font-size:11px;font-weight:500;
  color:var(--accent);text-decoration:none;margin-left:6px;
  background:var(--accent-dim);
  border:1px solid rgba(90,200,250,.25);
  padding:6px 14px;border-radius:50px;transition:background .15s;
}
.nav-gh:hover{background:rgba(90,200,250,.2);}

/* ── MOBILE TAB BAR ── */
.tabbar{
  display:none;position:fixed;bottom:0;left:0;right:0;z-index:100;
  background:rgba(11,12,16,0.82);
  backdrop-filter:var(--blur) var(--sat);
  -webkit-backdrop-filter:var(--blur) var(--sat);
  border-top:1px solid var(--brd);
  padding:8px 0 max(12px,env(safe-area-inset-bottom));
  justify-content:space-around;
}
.tab{
  display:flex;flex-direction:column;align-items:center;gap:3px;
  background:none;border:none;cursor:pointer;padding:4px 14px;min-width:60px;
}
.tab-ic{font-size:18px;line-height:1.2;}
.tab-lbl{font-family:var(--f);font-size:10px;font-weight:500;color:var(--t2);}
.tab.on .tab-lbl{color:var(--accent);}

/* ── PAGE WRAP ── */
.page{position:relative;z-index:1;}
.wrap{max-width:1080px;margin:0 auto;padding:0 clamp(20px,4vw,48px);}
.sec{padding:clamp(56px,8vw,88px) 0;}
.divider{border:none;border-top:1px solid var(--brd);}

/* ── TYPOGRAPHY ── */
.eyebrow{
  font-family:var(--mono);font-size:10px;letter-spacing:.2em;
  color:var(--accent);text-transform:uppercase;margin-bottom:12px;
}
.h1{
  font-family:'Instrument Serif',serif;font-style:italic;
  font-size:clamp(72px,12vw,120px);line-height:.92;
  letter-spacing:-.02em;color:var(--text);
  margin-bottom:clamp(14px,2.5vw,22px);
}
.h2{
  font-family:'Instrument Serif',serif;font-style:italic;
  font-size:clamp(28px,4vw,42px);line-height:1.1;
  color:var(--text);margin-bottom:10px;
}
.lead{font-size:clamp(15px,1.8vw,17px);line-height:1.72;color:var(--t2);}
.sm{font-size:13px;line-height:1.72;color:var(--t2);}

/* ── GLASS CARD ── */
.card{
  background:var(--glass);
  backdrop-filter:var(--blur) var(--sat);
  -webkit-backdrop-filter:var(--blur) var(--sat);
  border:1px solid var(--brd);border-radius:var(--r);
}

/* ── BUTTONS ── */
.btn-p{
  font-family:var(--f);font-size:15px;font-weight:600;
  background:var(--accent);color:#0b0c10;
  border:none;padding:13px 26px;border-radius:50px;
  cursor:pointer;transition:opacity .15s;
  text-decoration:none;display:inline-block;
}
.btn-p:hover{opacity:.86;}
.btn-s{
  font-family:var(--f);font-size:15px;font-weight:400;
  background:rgba(255,255,255,.07);color:var(--text);
  border:1px solid var(--brd2);padding:12px 26px;border-radius:50px;
  cursor:pointer;transition:background .15s;
  text-decoration:none;display:inline-block;
}
.btn-s:hover{background:rgba(255,255,255,.12);}
.brow{display:flex;flex-wrap:wrap;gap:10px;align-items:center;}

/* ── CODE BLOCK ── */
.cb{
  background:rgba(0,0,0,.38);
  border:1px solid var(--brd);border-radius:var(--r-md);overflow:hidden;
}
.cb-bar{
  display:flex;justify-content:space-between;align-items:center;
  padding:9px 16px;border-bottom:1px solid var(--brd);
}
.cb-lbl{font-family:var(--mono);font-size:10px;letter-spacing:.12em;color:var(--t2);}
.cb-cp{
  font-family:var(--mono);font-size:10px;color:var(--accent);
  background:none;border:none;cursor:pointer;padding:3px 8px;
  border-radius:var(--r-xs);transition:background .15s;
}
.cb-cp:hover{background:var(--accent-dim);}
.cb-body{padding:clamp(12px,2vw,16px) clamp(14px,2.5vw,20px);}
.cb-row{display:flex;gap:10px;margin-bottom:5px;}
.cb-row:last-child{margin-bottom:0;}
.cb-pr{font-family:var(--mono);font-size:13px;color:var(--accent);user-select:none;flex-shrink:0;}
.cb-cd{font-family:var(--mono);font-size:clamp(11px,1.4vw,13px);color:var(--text);line-height:1.6;word-break:break-all;}
.cb-dim{color:var(--t2);}

/* ── HERO ── */
.hero{
  padding:clamp(80px,11vw,116px) 0 clamp(60px,8vw,88px);
  animation:up .55s ease both;
}
@keyframes up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
.hero-sub{max-width:480px;margin-bottom:clamp(36px,5vw,48px);}
.hero-cb{max-width:clamp(280px,55vw,520px);margin-bottom:clamp(22px,4vw,30px);}

/* ── STATS ── */
.stats{
  display:grid;grid-template-columns:repeat(4,1fr);
  gap:1px;background:var(--brd);border-radius:var(--r);overflow:hidden;
  margin-bottom:clamp(40px,6vw,60px);
}
.stat{
  background:var(--glass);padding:clamp(18px,3vw,26px);text-align:center;
  backdrop-filter:var(--blur);-webkit-backdrop-filter:var(--blur);
}
.stat-n{
  font-family:'Instrument Serif',serif;font-style:italic;
  font-size:clamp(32px,5vw,46px);color:var(--accent);display:block;line-height:1;
}
.stat-l{font-family:var(--mono);font-size:10px;letter-spacing:.12em;color:var(--t2);display:block;margin-top:4px;}

/* ── OVERVIEW BODY ── */
.overview-body{font-size:clamp(15px,1.8vw,17px);line-height:1.8;color:var(--t2);}
.overview-body strong{color:var(--text);font-weight:500;}

/* ── FACES ── */
.faces-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.face-card{padding:clamp(22px,3.5vw,32px);}
.face-pill{
  font-family:var(--mono);font-size:10px;letter-spacing:.12em;
  color:var(--accent);background:var(--accent-dim);
  border:1px solid rgba(90,200,250,.22);
  padding:3px 10px;border-radius:50px;display:inline-block;margin-bottom:14px;
}
.face-name{font-size:clamp(18px,2.5vw,22px);font-weight:600;color:var(--text);margin-bottom:10px;}
.face-desc{font-size:13px;line-height:1.75;color:var(--t2);margin-bottom:20px;}
.face-rows{list-style:none;display:flex;flex-direction:column;}
.face-rows li{
  display:flex;align-items:baseline;gap:10px;
  padding:9px 0;border-bottom:1px solid var(--brd);
  font-size:12px;color:var(--t2);
}
.face-rows li:last-child{border-bottom:none;padding-bottom:0;}
.face-n{font-family:var(--mono);font-size:10px;color:var(--accent);flex-shrink:0;}

/* ── PRESETS ── */
.presets-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}
.preset-card{padding:clamp(18px,3vw,26px);transition:border-color .2s;}
.preset-card:hover{border-color:var(--brd2);}
.preset-card.cert{border-color:rgba(48,209,88,.3);}
.cert-pill{
  font-family:var(--mono);font-size:9px;letter-spacing:.12em;
  color:var(--green);background:var(--green-dim);
  border:1px solid rgba(48,209,88,.25);
  border-radius:50px;padding:2px 9px;display:inline-block;margin-bottom:10px;
}
.p-tier{font-family:var(--mono);font-size:10px;color:var(--t2);margin-bottom:4px;}
.p-name{font-size:clamp(18px,2.5vw,22px);font-weight:600;color:var(--text);margin-bottom:4px;}
.p-scope{font-family:var(--mono);font-size:10px;color:var(--t2);margin-bottom:14px;}
.p-items{list-style:none;display:flex;flex-direction:column;gap:5px;}
.p-items li{
  font-size:clamp(11px,1.2vw,12px);color:var(--t2);
  padding-left:14px;position:relative;line-height:1.5;
}
.p-items li::before{content:'—';position:absolute;left:0;color:var(--t3);}

/* ── ATTESTATION ── */
.att-grid{display:grid;grid-template-columns:1fr 1fr;gap:clamp(24px,5vw,56px);align-items:start;}
.att-block{
  background:rgba(0,0,0,.28);
  border:1px solid var(--brd);border-left:2px solid var(--accent);
  border-radius:var(--r-md);padding:clamp(16px,3vw,22px) clamp(18px,3vw,26px);
}
.att-lbl{font-family:var(--mono);font-size:10px;letter-spacing:.12em;color:var(--t2);margin-bottom:14px;}
.att-ln{font-family:var(--mono);font-size:12px;margin-bottom:8px;line-height:1.6;}
.att-k{color:var(--t2);}
.att-v{color:var(--text);}

/* ── CTA ── */
.cta{
  text-align:center;padding:clamp(56px,8vw,84px) 0;
  background:rgba(90,200,250,.025);
  border-top:1px solid var(--brd);border-bottom:1px solid var(--brd);
}
.cta h2{font-family:'Instrument Serif',serif;font-style:italic;font-size:clamp(26px,4vw,40px);color:var(--text);margin-bottom:8px;}
.cta p{font-size:14px;color:var(--t2);margin-bottom:22px;}

/* ── FOOTER ── */
.footer{
  padding:clamp(26px,4vw,38px) 0;
  display:flex;align-items:center;justify-content:space-between;
  flex-wrap:wrap;gap:12px;border-top:1px solid var(--brd);
}
.foot-brand{font-family:var(--mono);font-size:13px;font-weight:600;color:var(--text);}
.foot-note{font-size:11px;color:var(--t2);margin-top:3px;font-style:italic;}
.foot-r{font-family:var(--mono);font-size:11px;color:var(--t2);}

/* ── DOCS ── */
.docs-shell{
  display:grid;grid-template-columns:220px 1fr;
  min-height:calc(100vh - 52px);position:relative;z-index:1;
}
.docs-side{
  border-right:1px solid var(--brd);padding:24px 0;
  position:sticky;top:52px;height:calc(100vh - 52px);overflow-y:auto;
}
.side-lbl{
  font-family:var(--mono);font-size:10px;letter-spacing:.18em;text-transform:uppercase;
  color:var(--t3);padding:10px 20px 6px;display:block;
}
.side-btn{
  font-family:var(--f);font-size:13px;font-weight:400;color:var(--t2);
  background:none;border:none;cursor:pointer;padding:9px 20px;
  width:100%;text-align:left;transition:color .15s,background .15s;
}
.side-btn:hover{color:var(--text);background:rgba(255,255,255,.05);}
.side-btn.on{color:var(--accent);background:var(--accent-dim);font-weight:500;}
.docs-body{padding:clamp(28px,5vw,52px) clamp(22px,4vw,52px);max-width:740px;}

.doc-h2{font-family:'Instrument Serif',serif;font-style:italic;font-size:clamp(22px,3vw,32px);color:var(--text);margin-bottom:12px;}
.doc-h3{font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--text);margin:24px 0 8px;font-weight:600;}
.doc-p{font-size:14px;line-height:1.8;color:var(--t2);margin-bottom:12px;}
.doc-p strong{color:var(--text);font-weight:500;}
.doc-p code{font-family:var(--mono);font-size:11px;color:var(--accent);background:var(--accent-dim);padding:1px 7px;border-radius:var(--r-xs);}
.doc-p a{color:var(--accent);text-decoration:none;}
.doc-rule{border:none;border-top:1px solid var(--brd);margin:32px 0;}

.cli-tbl{width:100%;border-collapse:collapse;border-radius:var(--r-md);overflow:hidden;}
.cli-tbl th{font-family:var(--mono);font-size:10px;letter-spacing:.12em;text-align:left;padding:10px 16px;color:var(--t2);background:rgba(255,255,255,.04);border-bottom:1px solid var(--brd);}
.cli-tbl td{font-family:var(--mono);font-size:12px;padding:12px 16px;border-bottom:1px solid var(--brd);}
.cli-tbl tr:last-child td{border-bottom:none;}
.cli-tbl tr{background:var(--glass);transition:background .15s;}
.cli-tbl tr:hover{background:rgba(255,255,255,.08);}
.cli-cmd{color:var(--accent);}
.cli-desc{color:var(--t2);font-size:11px;}

.steps{display:flex;flex-direction:column;gap:2px;}
.step{display:grid;grid-template-columns:36px 1fr;border-radius:var(--r-sm);overflow:hidden;}
.step-n{background:var(--glass);display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:11px;color:var(--accent);}
.step-body{background:rgba(0,0,0,.2);padding:14px 18px;}
.step-title{font-size:13px;font-weight:500;color:var(--text);margin-bottom:4px;}
.step-desc{font-size:12px;line-height:1.7;color:var(--t2);}

/* ── ARCH ── */
.arch-wrap{padding:clamp(40px,6vw,68px) 0;position:relative;z-index:1;}
.arch-stack{display:flex;flex-direction:column;gap:2px;margin:18px 0 32px;}
.al{display:grid;grid-template-columns:46px 1fr;border-radius:var(--r-sm);overflow:hidden;}
.al-n{background:var(--glass);display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:10px;font-weight:600;padding:16px 0;}
.al-body{background:var(--glass);border-left:2px solid transparent;padding:14px 18px;display:flex;flex-direction:column;gap:3px;}
.al-lbl{font-family:var(--mono);font-size:12px;font-weight:600;}
.al-det{font-size:12px;color:var(--t2);line-height:1.6;}

.flow-tbl{border:1px solid var(--brd);border-radius:var(--r);overflow:hidden;margin-top:16px;}
.fr{display:grid;grid-template-columns:150px 1fr;border-bottom:1px solid var(--brd);}
.fr:last-child{border-bottom:none;}
.fr-lbl{background:var(--glass);font-family:var(--mono);font-size:11px;color:var(--t2);padding:16px 18px;display:flex;align-items:center;border-right:1px solid var(--brd);}
.fr-det{padding:16px 20px;font-size:13px;color:var(--t2);line-height:1.65;}
.fr-det code{font-family:var(--mono);font-size:11px;color:var(--accent);background:var(--accent-dim);padding:1px 6px;border-radius:var(--r-xs);}
.fr-det strong{color:var(--text);font-weight:500;}

.att-blk{
  background:rgba(0,0,0,.28);
  border:1px solid var(--brd);border-left:2px solid var(--accent);
  border-radius:var(--r-md);padding:clamp(16px,3vw,22px) clamp(18px,3vw,26px);
  margin-top:16px;
}

/* ── RESPONSIVE ── */
@media(max-width:900px){
  .tabbar{display:flex;}
  .nav-right{display:none;}
  .page{padding-bottom:84px;}
  .faces-grid{grid-template-columns:1fr;}
  .presets-grid{grid-template-columns:1fr 1fr;}
  .att-grid{grid-template-columns:1fr;}
  .stats{grid-template-columns:repeat(2,1fr);}
  .docs-shell{grid-template-columns:1fr;}
  .docs-side{
    position:static;height:auto;border-right:none;
    border-bottom:1px solid var(--brd);
    display:flex;flex-wrap:wrap;gap:4px;
    padding:12px clamp(20px,4vw,48px);
  }
  .side-btn{width:auto;padding:6px 12px;border-radius:50px;font-size:12px;}
  .fr{grid-template-columns:1fr;}
  .fr-lbl{border-right:none;border-bottom:1px solid var(--brd);padding:10px 16px;}
}
@media(max-width:600px){
  .presets-grid{grid-template-columns:1fr;}
  .footer{flex-direction:column;}
  .al{grid-template-columns:38px 1fr;}
}
`;

// ── SHARED COMPONENTS ─────────────────────────────────────────────────────
function CopyBlock({ label, lines, canCopy = true }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(lines.filter(l => l.t).map(l => l.t).join("\n"));
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="cb">
      <div className="cb-bar">
        <span className="cb-lbl">{label}</span>
        {canCopy && <button className="cb-cp" onClick={copy}>{copied ? "copied ✓" : "copy"}</button>}
      </div>
      <div className="cb-body">
        {lines.map((l, i) => (
          <div key={i} className="cb-row">
            {l.p !== undefined && <span className="cb-pr">{l.p}</span>}
            <span className={`cb-cd${l.dim ? " cb-dim" : ""}`}>{l.t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AttHeaders() {
  return (
    <div className="att-block">
      <p className="att-lbl">HTTP RESPONSE HEADERS — example</p>
      {[
        ["X-Powered-By",      "DSwebTEAM-OZON-v1.0"],
        ["X-Ozon-Fingerprint","8f4e2c1a9b3d5e7f0a2c4e6b8d0f2a4c…"],
        ["X-Ozon-Attestation","3b9a0f7c2d1e8a5f4c6b3a9d2e1f8c7b…"],
        ["X-Ozon-PublicKey",  "base64(ed25519_pubkey)"],
      ].map(([k,v]) => (
        <div key={k} className="att-ln">
          <span className="att-k">{k}: </span>
          <span className="att-v">{v}</span>
        </div>
      ))}
    </div>
  );
}

function Nav({ page, go }) {
  return (
    <nav className="nav">
      <div className="nav-logo" onClick={() => go("home")}>
        OZON <small>by DSwebTEAM</small>
      </div>
      <div className="nav-right">
        {[["home","Home"],["docs","Docs"],["arch","Architecture"]].map(([id,lbl]) => (
          <button key={id} className={`nav-btn${page===id?" on":""}`} onClick={() => go(id)}>{lbl}</button>
        ))}
        <a className="nav-gh" href={GH} target="_blank" rel="noreferrer">GitHub ↗</a>
      </div>
    </nav>
  );
}

function TabBar({ page, go }) {
  const tabs = [
    {id:"home", ic:"⊙", lbl:"Home"},
    {id:"docs", ic:"≡",  lbl:"Docs"},
    {id:"arch", ic:"◈",  lbl:"Arch"},
  ];
  return (
    <div className="tabbar">
      {tabs.map(t => (
        <button key={t.id} className={`tab${page===t.id?" on":""}`} onClick={() => go(t.id)}>
          <span className="tab-ic" style={{color: page===t.id?"var(--accent)":"var(--t2)"}}>{t.ic}</span>
          <span className="tab-lbl">{t.lbl}</span>
        </button>
      ))}
      <a className="tab" href={GH} target="_blank" rel="noreferrer">
        <span className="tab-ic" style={{color:"var(--t2)"}}>↗</span>
        <span className="tab-lbl">GitHub</span>
      </a>
    </div>
  );
}

// ── HOME ─────────────────────────────────────────────────────────────────
function HomePage({ go }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(CURL);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="page">
      {/* HERO */}
      <div className="wrap">
        <div className="hero">
          <p className="eyebrow">// Open Source Security Protocol · MIT · DSwebTEAM</p>
          <h1 className="h1">OZON</h1>
          <p className="lead hero-sub">
            The protective layer for every DSwebTEAM deployment.
            Two faces. Four tiers. One named standard.
          </p>
          <div className="hero-cb">
            <div className="cb">
              <div className="cb-bar">
                <span className="cb-lbl">INSTALL — Linux · Debian · Ubuntu</span>
                <button className="cb-cp" onClick={copy}>{copied ? "copied ✓" : "copy"}</button>
              </div>
              <div className="cb-body">
                <div className="cb-row">
                  <span className="cb-pr">$</span>
                  <span className="cb-cd">{CURL}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="brow">
            <button className="btn-p" onClick={copy}>Copy installer</button>
            <button className="btn-s" onClick={() => go("docs")}>Read the docs</button>
            <a className="btn-s" href={GH} target="_blank" rel="noreferrer">GitHub ↗</a>
          </div>
        </div>
      </div>

      <hr className="divider" />

      {/* OVERVIEW */}
      <div className="wrap sec">
        <div className="stats">
          {[["2","Faces"],["4","Tiers"],["1","Standard"],["0","Cost"]].map(([n,l]) => (
            <div key={l} className="stat">
              <span className="stat-n">{n}</span>
              <span className="stat-l">{l}</span>
            </div>
          ))}
        </div>
        <p className="overview-body">
          OZON is a <strong>cross-project security protocol</strong> built by DSwebTEAM.
          Named after the ozone layer — the thing that keeps UV out.
          UV here means <strong>Unauthorised Visitors.</strong> It ships in two faces:
          one hardens the channel between an operator and their server,
          the other encrypts credential delivery between a hosted site and the end-user browser.
          Both set up with one command. Both verified with one audit.
        </p>
      </div>

      <hr className="divider" />

      {/* TWO FACES */}
      <div className="wrap sec">
        <p className="eyebrow">// Architecture</p>
        <h2 className="h2">Two faces. One protocol.</h2>
        <p className="lead" style={{maxWidth:520,marginBottom:"clamp(28px,4vw,40px)"}}>
          Admin Face hardens your server. Edge Face protects your users.
          Deploy one or both depending on your stack.
        </p>
        <div className="faces-grid">
          {FACES.map(f => (
            <div key={f.label} className="card face-card">
              <span className="face-pill">{f.badge}</span>
              <h3 className="face-name">{f.label}</h3>
              <p className="face-desc">{f.desc}</p>
              <ul className="face-rows">
                {f.layers.map(l => (
                  <li key={l.n}>
                    <span className="face-n">{l.n}</span>{l.t}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{marginTop:16,textAlign:"right"}}>
          <button className="btn-s" onClick={() => go("arch")}>Full architecture →</button>
        </div>
      </div>

      <hr className="divider" />

      {/* PRESETS */}
      <div style={{background:"rgba(90,200,250,.02)",borderBottom:"1px solid var(--brd)"}}>
        <div className="wrap sec">
          <p className="eyebrow">// Security Tiers</p>
          <h2 className="h2">Four tiers. One gold standard.</h2>
          <p className="lead" style={{maxWidth:520,marginBottom:"clamp(28px,4vw,40px)"}}>
            Each tier is additive. Sovereign is the DSwebTEAM certified level.
          </p>
          <div className="presets-grid">
            {PRESETS.map(p => (
              <div key={p.tier} className={`card preset-card${p.cert?" cert":""}`}>
                {p.cert && <span className="cert-pill">DSWEBTEAM CERTIFIED</span>}
                <p className="p-tier">TIER {p.tier}</p>
                <p className="p-name">{p.name}</p>
                <p className="p-scope">{p.scope}</p>
                <ul className="p-items">
                  {p.items.map((it,i) => <li key={i}>{it}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ATTESTATION */}
      <div className="wrap sec">
        <p className="eyebrow">// X-Ozon-Attestation</p>
        <h2 className="h2">Hardware-bound identity.</h2>
        <div className="att-grid">
          <p className="sm" style={{color:"var(--t2)"}}>
            Every OZON deployment generates a <strong style={{color:"var(--text)",fontWeight:500}}>unique Ed25519 keypair</strong> from
            hardware facts — CPU serial, MAC address, install timestamp.
            The resulting signature is injected into every HTTP response as three verifiable headers.
            <br/><br/>
            No central validator required. Anyone can verify the attestation locally
            using the public key present in the header.
            <br/><br/>
            <strong style={{color:"var(--text)",fontWeight:500}}>UV = Unauthorised Visitor.</strong> A UV on the same
            network running Wireshark sees only standard TLSv1.3 —
            the inner OZON layer is invisible.
          </p>
          <AttHeaders />
        </div>
      </div>

      {/* CTA */}
      <div className="cta">
        <h2>Get the protocol running.</h2>
        <p>One command. Any Debian or Ubuntu machine.</p>
        <div className="brow" style={{justifyContent:"center"}}>
          <button className="btn-p" onClick={() => go("docs")}>Read the docs</button>
          <a className="btn-s" href={GH} target="_blank" rel="noreferrer">View on GitHub ↗</a>
        </div>
      </div>

      {/* FOOTER */}
      <div className="wrap">
        <footer className="footer">
          <div>
            <div className="foot-brand">OZON · Protocol · v1.0 · MIT</div>
            <div className="foot-note">Named after the ozone layer. UV = Unauthorised Visitors.</div>
          </div>
          <div className="foot-r">© DSwebTEAM</div>
        </footer>
      </div>
    </div>
  );
}

// ── DOCS ─────────────────────────────────────────────────────────────────
function DocsPage() {
  const [active, setActive] = useState("Getting Started");
  const ic = (t) => `doc-p`;
  const Code = ({children}) => <code style={{fontFamily:"var(--mono)",fontSize:"11px",color:"var(--accent)",background:"var(--accent-dim)",padding:"1px 7px",borderRadius:"var(--r-xs)"}}>{children}</code>;

  return (
    <div className="docs-shell">
      <aside className="docs-side">
        <span className="side-lbl">// OZON Docs</span>
        {DOC_SECTIONS.map(s => (
          <button key={s} className={`side-btn${active===s?" on":""}`} onClick={() => setActive(s)}>{s}</button>
        ))}
      </aside>

      <div className="docs-body">
        {active === "Getting Started" && <>
          <h2 className="doc-h2">Getting Started</h2>
          <p className="doc-p">OZON is a cross-project security protocol for VPS servers and static sites. It ships in two independent faces — <strong>Admin Face</strong> for server hardening and <strong>Edge Face</strong> for frontend credential protection.</p>
          <p className="doc-p">You can deploy one or both depending on your infrastructure. For a standard VPS, the Admin Face is the starting point. For a Cloudflare Pages or Netlify site, deploy the Edge Face only.</p>
          <h3 className="doc-h3">System Requirements</h3>
          <CopyBlock label="SUPPORTED SYSTEMS" canCopy={false} lines={[
            {t:"Debian 11 / 12"},{t:"Ubuntu 20.04 / 22.04 / 24.04"},
            {t:"Any systemd-based Linux distro"},{t:"Root or sudo access required"},
          ]} />
          <h3 className="doc-h3">Quick start</h3>
          <p className="doc-p">Run the installer → choose a preset → verify with <Code>ozon audit</Code>. The whole setup takes under three minutes on Sentinel tier.</p>
        </>}

        {active === "Installation" && <>
          <h2 className="doc-h2">Installation</h2>
          <p className="doc-p">Two installation methods are supported. Both are equally valid.</p>
          <h3 className="doc-h3">Method 1 — curl installer</h3>
          <p className="doc-p">Downloads the installer over HTTPS and runs it interactively.</p>
          <CopyBlock label="CURL INSTALL" lines={[{p:"$", t:CURL}]} />
          <hr className="doc-rule" />
          <h3 className="doc-h3">Method 2 — Git clone + manual run</h3>
          <p className="doc-p">For auditing the installer before running, or air-gapped setups.</p>
          <CopyBlock label="GIT INSTALL" lines={GIT_STEPS.map(t => ({p:"$", t}))} />
          <hr className="doc-rule" />
          <h3 className="doc-h3">What the installer does</h3>
          <div className="steps">
            {[
              ["01","ToS acknowledgement","Displays the DSwebTEAM terms. Accepts on keypress Y. Logs acceptance timestamp and hardware fingerprint to /etc/ozon/tos_accepted."],
              ["02","Keypair generation","Generates an Ed25519 keypair in /etc/ozon/device.key and /etc/ozon/device.pub, bound to your hardware fingerprint."],
              ["03","Preset selection","Interactive prompt — choose Sentinel through Sovereign. All tiers are additive."],
              ["04","Layer provisioning","Applies the selected preset: SSH config, fail2ban, WireGuard (Blacksite+), firewall rules, and OZON header injection."],
              ["05","Verification","Runs ozon audit automatically. Reports which layers are active."],
            ].map(([n,title,desc]) => (
              <div key={n} className="step">
                <div className="step-n">{n}</div>
                <div className="step-body">
                  <div className="step-title">{title}</div>
                  <div className="step-desc">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </>}

        {active === "Presets" && <>
          <h2 className="doc-h2">Presets</h2>
          <p className="doc-p">Each preset is additive — higher tiers include all layers from lower tiers. Upgrade any time with <Code>ozon preset upgrade</Code>.</p>
          {PRESETS.map(p => (
            <div key={p.tier} style={{marginBottom:28}}>
              <h3 className="doc-h3">
                Tier {p.tier} — {p.name}
                {p.cert && <span style={{fontSize:"10px",color:"var(--green)",fontFamily:"var(--mono)",marginLeft:10,background:"var(--green-dim)",border:"1px solid rgba(48,209,88,.25)",padding:"2px 8px",borderRadius:"50px"}}>CERTIFIED</span>}
              </h3>
              <p className="doc-p" style={{marginBottom:8}}>Scope: <strong>{p.scope}</strong></p>
              <ul style={{listStyle:"none",display:"flex",flexDirection:"column",gap:5}}>
                {p.items.map((it,i) => <li key={i} style={{fontFamily:"var(--mono)",fontSize:"12px",color:"var(--t2)",paddingLeft:16,position:"relative"}}><span style={{position:"absolute",left:0,color:"var(--t3)"}}>—</span>{it}</li>)}
              </ul>
            </div>
          ))}
        </>}

        {active === "CLI Reference" && <>
          <h2 className="doc-h2">CLI Reference</h2>
          <p className="doc-p">All commands available via the <Code>ozon</Code> CLI after installation.</p>
          <table className="cli-tbl">
            <thead><tr><th>COMMAND</th><th>DESCRIPTION</th></tr></thead>
            <tbody>
              {CLI_CMDS.map(c => (
                <tr key={c.cmd}>
                  <td><span className="cli-cmd">{c.cmd}</span></td>
                  <td><span className="cli-desc">{c.desc}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </>}

        {active === "VPS Setup" && <>
          <h2 className="doc-h2">VPS Setup (Admin Face)</h2>
          <p className="doc-p">For any Debian or Ubuntu machine — your own VPS, a home server, or a ReCloud node.</p>
          <h3 className="doc-h3">1. Run the installer</h3>
          <CopyBlock label="INSTALL" lines={[{p:"$", t:CURL}]} />
          <h3 className="doc-h3">2. Select preset and VPN type</h3>
          <p className="doc-p">At Blacksite tier and above, the installer prompts for your preferred VPN tunnel.</p>
          <CopyBlock label="VPN PROMPT (BLACKSITE+)" canCopy={false} lines={[
            {t:"Remote access tunnel:"},
            {t:"  [1] WireGuard  — faster, kernel-native (recommended)"},
            {t:"  [2] OpenVPN    — more compatible with restrictive ISPs"},
            {t:"> _"},
          ]} />
          <h3 className="doc-h3">3. Connect to your server</h3>
          <CopyBlock label="SSH CONNECTION" canCopy={false} lines={[
            {p:"$", t:"# Connect via WireGuard first, then:", dim:true},
            {p:"$", t:"ssh user@your-server -p [randomised-port]"},
          ]} />
        </>}

        {active === "Static Site Setup" && <>
          <h2 className="doc-h2">Static Site Setup (Edge Face)</h2>
          <p className="doc-p">For Cloudflare Pages, Netlify, and any static site. No server required — the Edge Face runs entirely as a Cloudflare Worker or edge function.</p>
          <h3 className="doc-h3">Cloudflare Pages</h3>
          <CopyBlock label="EDGE INIT — CLOUDFLARE" lines={[{p:"$", t:"npx ozon-edge init --platform cloudflare"}]} />
          <h3 className="doc-h3">Netlify</h3>
          <CopyBlock label="EDGE INIT — NETLIFY" lines={[{p:"$", t:"npx ozon-edge init --platform netlify"}]} />
          <h3 className="doc-h3">What gets deployed</h3>
          <p className="doc-p">A Cloudflare Worker sits between your site and all outbound API/DB calls. It holds real API keys in <strong>Worker environment variables</strong> — they never reach the browser.</p>
          <CopyBlock label="ozon.config.json" canCopy={false} lines={[
            {t:"{"},{t:'  "platform": "cloudflare",'},
            {t:'  "edge": {'},{t:'    "inject_script": true,'},
            {t:'    "security_headers": true,'},{t:'    "credential_encryption": true'},
            {t:"  }"},{t:"}"},
          ]} />
        </>}

        {active === "Attestation" && <>
          <h2 className="doc-h2">Attestation</h2>
          <p className="doc-p">Every OZON installation generates a hardware-bound Ed25519 keypair. The keypair signs a SHA-256 fingerprint of your hardware — CPU serial, MAC address, install timestamp.</p>
          <p className="doc-p">Anyone interacting over the OZON protocol can verify the traffic is from a genuine, untampered deployment — no central validator, no API call required.</p>
          <h3 className="doc-h3">Key storage</h3>
          <CopyBlock label="KEY PATHS" canCopy={false} lines={[
            {t:"/etc/ozon/device.key     ← private key (root-only)"},
            {t:"/etc/ozon/device.pub     ← public key"},
            {t:"/etc/ozon/fingerprint    ← hardware SHA-256"},
            {t:"/etc/ozon/tos_accepted   ← ToS log with timestamp"},
          ]} />
          <h3 className="doc-h3">Response headers</h3>
          <AttHeaders />
        </>}
      </div>
    </div>
  );
}

// ── ARCHITECTURE ──────────────────────────────────────────────────────────
function ArchPage() {
  return (
    <div className="wrap arch-wrap">
      <p className="eyebrow">// Architecture</p>
      <h2 className="h2">How OZON is built.</h2>
      <p className="lead" style={{maxWidth:540,marginBottom:"clamp(32px,5vw,52px)"}}>
        OZON splits into two independent faces. Each solves a different cryptographic problem on a different part of your stack.
      </p>

      <h3 className="doc-h3">Admin Face — 5-Layer Stack</h3>
      <p className="sm" style={{marginBottom:4}}>Layers are stacked bottom-up. Each tier activates all layers below it.</p>
      <div className="arch-stack">
        {ARCH_LAYERS.map(l => (
          <div key={l.n} className="al">
            <div className="al-n" style={{color:l.col}}>{l.n}</div>
            <div className="al-body" style={{borderLeftColor:l.col}}>
              <span className="al-lbl" style={{color:l.col}}>{l.lbl}</span>
              <span className="al-det">{l.det}</span>
            </div>
          </div>
        ))}
      </div>

      <hr className="doc-rule" />

      <h3 className="doc-h3">Edge Face — Proxy Flow</h3>
      <p className="sm" style={{marginBottom:4}}>All traffic between the browser and your APIs is routed through the OZON Edge Worker.</p>
      <div className="flow-tbl">
        {[
          ["Browser",             "Makes calls to <code>/ozon/*</code> only. No keys, no DB URLs, nothing sensitive is present in the frontend bundle."],
          ["OZON Edge Worker",    "<strong>Intercepts every request.</strong> Holds real <code>API_KEY</code> and <code>DB_URL</code> in Worker env vars (server-side only). Signs outbound requests."],
          ["API / Database",      "Only accepts requests signed by the OZON Worker. A direct browser request without the OZON signature is rejected."],
          ["Response path",       "Worker strips internal headers, re-encrypts credentials using the ozon-edge.min.js app-layer key before returning to the browser."],
          ["UV on Wireshark",     "Sees only standard TLSv1.3. The inner OZON encryption layer is invisible. Credentials are not recoverable from the network stream."],
        ].map(([lbl, det]) => (
          <div key={lbl} className="fr">
            <div className="fr-lbl">{lbl}</div>
            <div className="fr-det" dangerouslySetInnerHTML={{__html: det}} />
          </div>
        ))}
      </div>

      <hr className="doc-rule" />

      <h3 className="doc-h3">Attestation Pipeline</h3>
      <div className="flow-tbl">
        {[
          ["Hardware facts",    "CPU serial + MAC address + install timestamp are read from /sys and /etc."],
          ["SHA-256 fingerprint","The three values are concatenated and hashed. Stored in /etc/ozon/fingerprint."],
          ["Ed25519 signature", "The fingerprint is signed with the device private key. Becomes the X-Ozon-Attestation value."],
          ["Header injection",  "The local nginx / reverse proxy reads the signature at startup and injects all four OZON headers into every HTTP response."],
          ["Verification",      "Anyone with X-Ozon-PublicKey can verify the attestation locally — no registry, no API call required."],
        ].map(([lbl, det]) => (
          <div key={lbl} className="fr">
            <div className="fr-lbl">{lbl}</div>
            <div className="fr-det">{det}</div>
          </div>
        ))}
      </div>

      <hr className="doc-rule" />

      <h3 className="doc-h3">Full Stack Summary</h3>
      <CopyBlock label="OZON PROTOCOL LAYOUT" canCopy={false} lines={[
        {t:"OZON Protocol"},
        {t:"├── Admin Face (VPS / bare metal)"},
        {t:"│   ├── L1  Custom SSH port"},{t:"│   ├── L2  fail2ban"},
        {t:"│   ├── L3  Ed25519 + mTLS"},{t:"│   ├── L4  WireGuard tunnel"},
        {t:"│   └── L5  Port 443 masquerade + ghost mode"},
        {t:"│"},
        {t:"├── Edge Face (static site / CF Pages / Netlify)"},
        {t:"│   ├── ozon-edge.min.js injection"},
        {t:"│   ├── Worker proxy (API keys + DB URL)"},
        {t:"│   ├── App-layer encryption"},
        {t:"│   └── Request signing"},
        {t:"│"},
        {t:"└── Attestation (both faces)"},
        {t:"    ├── Ed25519 device keypair on install"},
        {t:"    ├── Hardware-bound SHA-256 fingerprint"},
        {t:"    └── X-Ozon-* headers on every response"},
      ]} />

      <footer className="footer" style={{marginTop:"clamp(40px,6vw,64px)"}}>
        <div>
          <div className="foot-brand">OZON · Protocol · v1.0 · MIT</div>
          <div className="foot-note">Named after the ozone layer. UV = Unauthorised Visitors.</div>
        </div>
        <div className="foot-r">© DSwebTEAM</div>
      </footer>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────
export default function OzonSite() {
  const [page, setPage] = useState("home");
  const go = (p) => { setPage(p); window.scrollTo({top:0,behavior:"smooth"}); };
  return (
    <div className="root">
      <style>{CSS}</style>
      <Nav page={page} go={go} />
      <TabBar page={page} go={go} />
      {page === "home" && <HomePage go={go} />}
      {page === "docs" && <DocsPage />}
      {page === "arch" && <ArchPage />}
    </div>
  );
}
