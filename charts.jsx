// charts.jsx, hand-built SVG/CSS chart primitives for the GreenLeaf dashboard
const { useState, useRef, useCallback } = React;

// palette constants shared by charts
const C = {
  forest:'#1B3A2F', teal:'#2E8B8B', tealBright:'#3FB3AB', amber:'#E8A23D',
  clay:'#C44536', bone:'#F4F1EA', slate:'#3D4548', slateSoft:'#6B7378', line:'#DAD4C6'
};
const ALERT_COLORS = {
  'High VPD':'#C44536',
  'High Canopy Temp':'#E8A23D',
  'Low Moisture':'#2E8B8B',
  'High Pest Pressure':'#1B3A2F',
  '':'#6B7378'
};
const alertColor = t => ALERT_COLORS[t] || C.slateSoft;
const alertLabel = t => t===''? 'Unclassified' : t;

// ---- shared tooltip hook ----
function useTip(){
  const [tip,setTip]=useState(null);
  const show=(e,content)=>{ setTip({x:e.clientX,y:e.clientY,content}); };
  const move=(e)=>setTip(t=>t?{...t,x:e.clientX,y:e.clientY}:t);
  const hide=()=>setTip(null);
  const node = tip ? (
    <div className="gl-tip" style={{left:Math.min(tip.x+14, window.innerWidth-250), top:tip.y+14}}>{tip.content}</div>
  ) : null;
  return {show,move,hide,node};
}

/* ============================================================
   TRIAGE MATRIX, scatter (variant A)
   x = impact (avg stress delta, more negative = right/better)
   y = response rate %
   size = open alerts ; color = type
   ============================================================ */
function TriageScatter({types, tip}){
  const W=620,H=380, padL=58,padR=24,padT=24,padB=52;
  const iw=W-padL-padR, ih=H-padT-padB;
  // x axis: impact magnitude 0 .. max|impact|  (right = higher impact)
  const maxImpact = Math.max(...types.map(t=>Math.abs(t.avgImpact)), 0.09);
  const xFor = v => padL + (Math.abs(v)/maxImpact)*iw;       // |impact|
  const yFor = r => padT + (1-r)*ih;                          // response rate 0..1
  const maxOpen = Math.max(...types.map(t=>t.open));
  const rFor = o => 10 + (Math.sqrt(o)/Math.sqrt(maxOpen))*34;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'auto',display:'block'}}>
      {/* quadrant shading: bottom-right = high impact + low response = ACT HERE */}
      <rect x={padL+iw*0.5} y={padT+ih*0.5} width={iw*0.5} height={ih*0.5} fill="rgba(196,69,54,.07)"/>
      <text x={padL+iw-8} y={padT+ih-12} textAnchor="end" fontSize="11" fontWeight="700" fill={C.clay} letterSpacing=".06em">ACT HERE FIRST →</text>
      {/* grid */}
      {[0,.25,.5,.75,1].map(g=>(
        <g key={g}>
          <line x1={padL} x2={padL+iw} y1={yFor(g)} y2={yFor(g)} stroke={C.line} strokeWidth="1"/>
          <text x={padL-9} y={yFor(g)+4} textAnchor="end" fontSize="10.5" fill={C.slateSoft}>{Math.round(g*100)}%</text>
        </g>
      ))}
      {/* axis titles */}
      <text x={padL-44} y={padT+ih/2} fontSize="11" fontWeight="600" fill={C.slate} transform={`rotate(-90 ${padL-44} ${padT+ih/2})`} textAnchor="middle">RESPONSE RATE</text>
      <text x={padL+iw/2} y={H-10} fontSize="11" fontWeight="600" fill={C.slate} textAnchor="middle">INTERVENTION IMPACT  (avg stress drop when acted) →</text>
      {/* points */}
      {types.filter(t=>t.fired>3).map((t,i)=>{
        const x=xFor(t.avgImpact), y=yFor(t.responseRate), r=rFor(t.open);
        return (
          <g key={i} style={{cursor:'pointer'}}
             onMouseEnter={e=>tip.show(e,<div><div className="tt">{alertLabel(t.type)}</div>
               <div className="tr"><span>Open alerts</span><span>{t.open.toLocaleString()}</span></div>
               <div className="tr"><span>Response rate</span><span>{(t.responseRate*100).toFixed(0)}%</span></div>
               <div className="tr"><span>Avg stress drop</span><span>{t.avgImpact.toFixed(3)}</span></div></div>)}
             onMouseMove={tip.move} onMouseLeave={tip.hide}>
            <circle cx={x} cy={y} r={r} fill={alertColor(t.type)} fillOpacity="0.82" stroke="#fff" strokeWidth="2"/>
            {(t.type==='High VPD'||t.type==='High Pest Pressure') &&
              <text x={x} y={y-r-6} textAnchor="middle" fontSize="11" fontWeight="700" fill={C.slate}>{alertLabel(t.type)}</text>}
          </g>
        );
      })}
    </svg>
  );
}

/* TRIAGE, quadrant bubble grid (variant B): clean 2x2 framing */
function TriageQuadrant({types, tip}){
  const W=620,H=380, padL=58,padR=24,padT=30,padB=52;
  const iw=W-padL-padR, ih=H-padT-padB;
  const maxImpact=Math.max(...types.map(t=>Math.abs(t.avgImpact)),0.09);
  const xFor=v=>padL+(Math.abs(v)/maxImpact)*iw;
  const yFor=r=>padT+(1-r)*ih;
  const maxOpen=Math.max(...types.map(t=>t.open));
  const rFor=o=>9+(Math.sqrt(o)/Math.sqrt(maxOpen))*30;
  const mx=padL+iw*0.5, my=padT+ih*0.5;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'auto',display:'block'}}>
      <rect x={mx} y={my} width={iw*0.5} height={ih*0.5} fill="rgba(196,69,54,.09)"/>
      <rect x={mx} y={padT} width={iw*0.5} height={ih*0.5} fill="rgba(46,139,139,.06)"/>
      <line x1={mx} x2={mx} y1={padT} y2={padT+ih} stroke={C.line} strokeDasharray="4 4"/>
      <line x1={padL} x2={padL+iw} y1={my} y2={my} stroke={C.line} strokeDasharray="4 4"/>
      <text x={mx+8} y={padT+13} fontSize="10" fontWeight="700" fill={C.teal} letterSpacing=".05em">HIGH IMPACT · HANDLED</text>
      <text x={mx+8} y={padT+ih-9} fontSize="10" fontWeight="700" fill={C.clay} letterSpacing=".05em">HIGH IMPACT · IGNORED</text>
      <text x={padL+6} y={padT+13} fontSize="10" fontWeight="700" fill={C.slateSoft} letterSpacing=".05em">LOW IMPACT</text>
      {[0,.5,1].map(g=>(
        <text key={g} x={padL-9} y={yFor(g)+4} textAnchor="end" fontSize="10.5" fill={C.slateSoft}>{Math.round(g*100)}%</text>
      ))}
      <text x={padL-44} y={padT+ih/2} fontSize="11" fontWeight="600" fill={C.slate} transform={`rotate(-90 ${padL-44} ${padT+ih/2})`} textAnchor="middle">RESPONSE RATE</text>
      <text x={padL+iw/2} y={H-10} fontSize="11" fontWeight="600" fill={C.slate} textAnchor="middle">INTERVENTION IMPACT →</text>
      {types.filter(t=>t.fired>3).map((t,i)=>{
        const x=xFor(t.avgImpact),y=yFor(t.responseRate),r=rFor(t.open);
        return(
          <g key={i} style={{cursor:'pointer'}}
            onMouseEnter={e=>tip.show(e,<div><div className="tt">{alertLabel(t.type)}</div>
              <div className="tr"><span>Open</span><span>{t.open.toLocaleString()}</span></div>
              <div className="tr"><span>Response</span><span>{(t.responseRate*100).toFixed(0)}%</span></div></div>)}
            onMouseMove={tip.move} onMouseLeave={tip.hide}>
            <circle cx={x} cy={y} r={r} fill={alertColor(t.type)} fillOpacity="0.8" stroke="#fff" strokeWidth="2"/>
          </g>
        );
      })}
    </svg>
  );
}

/* ============================================================
   SPEED BARS, ≤1 day vs >1 day stress delta with 4.2× annotation
   ============================================================ */
function SpeedBars({speed, big}){
  const fast=Math.abs(speed.fast), slow=Math.abs(speed.slow);
  const max=fast;
  const fastPct=fast/max*100, slowPct=slow/max*100;
  return (
    <div>
      <div style={{display:'flex',alignItems:'flex-end',gap:18,marginBottom:8}}>
        <div style={{fontSize:big?58:44,fontWeight:800,color:C.teal,lineHeight:1,letterSpacing:'-.03em'}}>{speed.ratio.toFixed(1)}×</div>
        <div style={{fontSize:13,color:C.slateSoft,paddingBottom:8,lineHeight:1.4}}>more plant-stress relief<br/>when acting <strong style={{color:C.forest}}>within a day</strong></div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:11,marginTop:14}}>
        <div>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4}}><span style={{fontWeight:600,color:C.forest}}>≤ 1 day <span className="muted">(n={speed.fastN.toLocaleString()})</span></span><span style={{fontWeight:700,color:C.teal}}>{speed.fast.toFixed(4)}</span></div>
          <div style={{height:16,background:C.bone,borderRadius:5}}><div style={{height:'100%',width:fastPct+'%',background:C.teal,borderRadius:5,transition:'width .6s'}}></div></div>
        </div>
        <div>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4}}><span style={{fontWeight:600,color:C.forest}}>&gt; 1 day <span className="muted">(n={speed.slowN.toLocaleString()})</span></span><span style={{fontWeight:700,color:C.slateSoft}}>{speed.slow.toFixed(4)}</span></div>
          <div style={{height:16,background:C.bone,borderRadius:5}}><div style={{height:'100%',width:slowPct+'%',background:C.slateSoft,borderRadius:5,transition:'width .6s'}}></div></div>
        </div>
      </div>
      <div style={{fontSize:11.5,color:C.slateSoft,marginTop:10,lineHeight:1.4}}>More negative = larger stress reduction. Same plot, same alert type. Speed alone.</div>
    </div>
  );
}

/* ============================================================
   ALERT FUNNEL, fired → acted per type
   ============================================================ */
function AlertFunnel({types}){
  const sorted=[...types].filter(t=>t.fired>3).sort((a,b)=>b.fired-a.fired);
  const max=Math.max(...sorted.map(t=>t.fired));
  return (
    <div style={{display:'flex',flexDirection:'column',gap:13}}>
      {sorted.map((t,i)=>(
        <div key={i}>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:5}}>
            <span className="atype-tag"><i className="atype-dot" style={{background:alertColor(t.type)}}></i>{alertLabel(t.type)}</span>
            <span style={{color:C.slateSoft}}>{t.acted.toLocaleString()} / {t.fired.toLocaleString()} acted · <strong style={{color:t.responseRate<0.2?C.clay:C.forest}}>{(t.responseRate*100).toFixed(0)}%</strong></span>
          </div>
          <div style={{height:22,background:C.bone,borderRadius:6,position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',inset:0,width:(t.fired/max*100)+'%',background:'rgba(27,58,47,.13)',borderRadius:6}}></div>
            <div style={{position:'absolute',top:0,bottom:0,left:0,width:(t.acted/max*100)+'%',background:alertColor(t.type),borderRadius:6,transition:'width .6s'}}></div>
          </div>
        </div>
      ))}
      <div style={{fontSize:11.5,color:C.slateSoft,lineHeight:1.4,marginTop:2}}>Faded bar = alerts fired · solid bar = acted on. <strong className="tx-clay">High Canopy Temp & High VPD: barely touched.</strong></div>
    </div>
  );
}

window.Charts1 = { TriageScatter, TriageQuadrant, SpeedBars, AlertFunnel, useTip, alertColor, alertLabel, C, useCountUp, CountUp };

// ---- animated number (count-up) ----
// Robust against paused rAF (backgrounded tab): always converges to the target.
// Animates smoothly when the document is visible; snaps otherwise.
function useCountUp(target, ms=850){
  const [v,setV]=React.useState(target);
  const ref=React.useRef(target);
  React.useEffect(()=>{
    const from=ref.current, to=target;
    if(from===to || isNaN(to)){ ref.current=to; setV(to); return; }
    if(typeof document!=='undefined' && document.hidden){ ref.current=to; setV(to); return; }
    let raf; const t0=performance.now();
    const tick=now=>{
      const p=Math.min(1,(now-t0)/ms);
      const e=1-Math.pow(1-p,3);
      const cur=from+(to-from)*e;
      ref.current=cur; setV(cur);
      if(p<1) raf=requestAnimationFrame(tick); else { ref.current=to; setV(to); }
    };
    raf=requestAnimationFrame(tick);
    const safety=setTimeout(()=>{ ref.current=to; setV(to); }, ms+300); // converge even if rAF stalls
    return ()=>{ cancelAnimationFrame(raf); clearTimeout(safety); };
  },[target,ms]);
  return v;
}
function CountUp({value, fmt}){ const v=useCountUp(value); return fmt?fmt(v):Math.round(v); }
