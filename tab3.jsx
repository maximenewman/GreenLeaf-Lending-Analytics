// tab3.jsx, "Loan Readiness Score" (Use Case C), the climax
// The Banker/Farmer toggle reframes the ENTIRE tab. Every number stays identical;
// only framing, labels, copy, emphasis and accent change.
const { Gauge, LinearMeter, ScoreWaterfall, Ring, fmtMoney, fmtPct } = window.Charts2;
const T3C = window.Charts1.C;

function Tab3({data, tweaks, frame, setFrame}){
  const {loan, tab1, tab2} = data;
  const baseResp = loan.respRate;
  const [resp,setResp]=React.useState(Math.round(baseResp*100)); // %

  // ── live score (mechanics unchanged) ──
  const P=loan.sub.profitability, PR=loan.sub.precisionROI, Cc=loan.sub.consistency;
  const liveR = resp/100;
  const liveScore = 30*P + 25*liveR + 25*PR + 20*Cc;
  const uplift = Math.round(((liveR-baseResp)*tab1.totalAlerts*loan.perAlertBenefit)/100)*100;
  const ready = liveScore>=loan.target;
  const fteGain = fmtMoney(Math.round((0.9-baseResp)*tab1.totalAlerts*loan.perAlertBenefit/100)*100);

  // ── framing ──
  const isBank = frame==='banker';
  const accent = isBank ? T3C.forest : T3C.teal;
  const accentSoft = isBank ? 'rgba(27,58,47,.10)' : 'rgba(46,139,139,.12)';

  const head = isBank
    ? { h1:'Loan Readiness: Underwriting View',
        p:'Where the borrower sits against the approval band, the principal risk, and the documented remediation path, the one number a credit officer needs.' }
    : { h1:'Your Score: What to Fix and What It’s Worth',
        p:'How loan-ready you are, the one change that moves the needle, and the dollars it puts back in your pocket.' };

  const lens = isBank
    ? { tag:'Banker view', desc:'Underwriting lens: risk, debt-service capacity, and the path to approval.' }
    : { tag:'Farmer view', desc:'Plain-language lens: what to fix first, and what it pays back.' };

  // component cards, same pct/weight, reframed labels
  const comps = isBank ? [
    {label:'Profitability → debt-service capacity', weight:'30%', pct:P, detail:`${loan.details.profitable}/${loan.details.total} profitable · ${fmtPct(loan.details.avgRoi)} ROI`},
    {label:'Responsiveness → principal operational risk', weight:'25%', pct:liveR, detail:`${(liveR*100).toFixed(1)}% alert response`, risk:true},
    {label:'Precision ROI → return on deployed capital', weight:'25%', pct:PR, detail:`${loan.medianRatio}× median return on spend`},
    {label:'Consistency → downside ROI variance', weight:'20%', pct:Cc, detail:`yield/ROI variance · ${tab2.zeroBenefit} zero-benefit plots`},
  ] : [
    {label:'Are you making money?', weight:'30%', pct:P, detail:`${loan.details.profitable}/${loan.details.total} plots in the black · ${fmtPct(loan.details.avgRoi)} ROI`},
    {label:'Do you act on alerts?', weight:'25%', pct:liveR, detail:`${(liveR*100).toFixed(1)}% of alerts answered`, risk:true},
    {label:'Does precision pay off?', weight:'25%', pct:PR, detail:`${loan.medianRatio}× back on every $1 you spend`},
    {label:'Are results steady?', weight:'20%', pct:Cc, detail:`${tab2.zeroBenefit} plots returned nothing`},
  ];
  const ringColor = c => (c.risk && c.pct<0.85) ? T3C.amber : accent;

  const liveContrib={profitability:30*P, responsiveness:25*liveR, precisionROI:25*PR, consistency:20*Cc};

  // prescription, same dollars, reframed
  const rxTitle = isBank ? 'Remediation path, risk-ranked' : 'Your to-do list, biggest payback first';
  const rx = isBank ? [
    {t:`Lift alert response ${(baseResp*100).toFixed(1)}% → 90%`, d:<>Primary covenant target. <span className="rv">+{fteGain}/yr</span> incremental margin, a self-funding one-FTE condition of approval.</>},
    {t:'Action the 0% / 11% alert types', d:<>High Canopy Temp & High VPD. Cuts operational risk and lifts profitability at negligible cost.</>},
    {t:'Concentrate capital in Interior strawberry · High Light', d:<>77.8% ROI cohort, strengthens return on deployed capital.</>},
    {t:'Re-site sensors before adding collateral', d:<>Density 2 underperforms density 1, no incremental capex required.</>},
  ] : [
    {t:<><span className="rv">+{fteGain}/yr</span>, answer more alerts ({(baseResp*100).toFixed(1)}% → 90%)</>, d:<>Your biggest win. Put one person on the alert queue and they pay for themselves.</>},
    {t:'Act on the alerts you skip', d:<>High Canopy Temp & High VPD, barely touched today. Easy points, almost free.</>},
    {t:'Plant more Interior strawberry under High Light', d:<>Your best-paying combo at 77.8% ROI.</>},
    {t:'Move your sensors, don’t buy more', d:<>Better placement beats more hardware.</>},
  ];

  const farmerText = (
    <>You're a <strong>{liveScore.toFixed(0)}</strong>. {ready
      ? <>You've crossed the line, <strong className="rv">loan-ready</strong>. Keep one person on the alert queue and that score holds.</>
      : <>Hire one person to chase alerts → push response to 90% and you're a <strong className="rv">{(30*P+25*0.9+25*PR+20*Cc).toFixed(0)}</strong>. That person pays for themselves with <strong className="rv">+{fteGain}</strong> more profit a season.</>}</>
  );
  const bankerText = (
    <>{ready
      ? <><strong>Loan-ready borrower</strong>, score {liveScore.toFixed(0)}, clears the {loan.target} approval band. 95% profitable plots and a documented precision ROI give a clean debt-service story.</>
      : <><strong>Conditional borrower</strong>, {(loan.target-liveScore).toFixed(1)} points from the approval band. Primary risk is operational responsiveness, with a documented, <strong className="rv">self-funding</strong> remediation path. De-risks on execution.</>}</>
  );

  const Toggle = (
    <div className="frame-toggle">
      <button className={isBank?'on':''} style={isBank?{color:accent}:null} onClick={()=>setFrame('banker')}>Banker view</button>
      <button className={!isBank?'on':''} style={!isBank?{color:accent}:null} onClick={()=>setFrame('farmer')}>Farmer view</button>
    </div>
  );

  return (
    <div className="fade-in" style={{'--lens':accent}}>
      <div className="tab-head">
        <h1>{head.h1}</h1>
        <p>{head.p}</p>
      </div>

      {/* lens banner, announces the active view + houses the toggle */}
      <div className="lens-banner" style={{borderColor:accent, background:accentSoft}}>
        <span className="lens-chip" style={{background:accent}}>{lens.tag}</span>
        <span className="lens-desc">{lens.desc}</span>
        <div className="lens-toggle">{Toggle}</div>
      </div>

      {/* hero gauge + component rings */}
      <div className="grid" style={{gridTemplateColumns:'1fr 1.1fr',marginBottom:20}}>
        <div className="panel" style={{display:'flex',flexDirection:'column'}}>
          <div className="panel-head">
            <h3>GreenLeaf CEA</h3>
            <span className="eyebrow" style={{color:accent}}>{isBank?'Underwriting score':'Your score'}</span>
          </div>
          {tweaks.scoreStyle==='linear'
            ? <LinearMeter score={liveScore} target={loan.target}/>
            : <Gauge score={liveScore} target={loan.target} size={300}/>}
          {tweaks.scoreStyle!=='linear' && (
            <div style={{textAlign:'center',marginTop:-6}}>
              <span className="tag" style={{background:ready?'rgba(46,139,139,.15)':'rgba(232,162,61,.18)',color:ready?T3C.teal:'#B97A1C',fontSize:12,padding:'5px 12px'}}>
                {ready?'Loan-ready':liveScore>=50?'Conditional':'Not ready'}
              </span>
              <div style={{fontSize:13,color:T3C.slateSoft,marginTop:8}}>Target {loan.target} · <strong style={{color:ready?T3C.teal:'#B97A1C'}}>{ready?'cleared':`+${(loan.target-liveScore).toFixed(1)} → loan-ready`}</strong></div>
            </div>
          )}
        </div>

        <div className="grid" style={{gridTemplateColumns:'1fr 1fr',gridAutoRows:'1fr',gap:14}}>
          {comps.map(c=>(
            <div className="comp-card" key={c.label}>
              <Ring pct={c.pct} color={ringColor(c)}/>
              <div className="cc-body">
                <div className="cc-weight" style={{color:accent}}>{c.weight}</div>
                <div className="cc-label">{c.label}</div>
                <div className="cc-detail">{c.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* waterfall + prescription */}
      <div className="grid" style={{gridTemplateColumns:'1.3fr 1fr',marginBottom:20}}>
        <div className="panel">
          <div className="panel-head">
            <h3>{isBank?'Score composition: where the points sit':'What’s holding your score down'}</h3>
            <span className="sub">weighted contribution to score</span>
          </div>
          <ScoreWaterfall contributions={liveContrib} score={liveScore}/>
        </div>
        <div className="panel dark">
          <div className="panel-head"><h3 style={{color:T3C.bone}}>{rxTitle}</h3></div>
          <div className="prescription">
            {rx.map((r,i)=>(
              <div className="rx-item" key={i}>
                <div className="rx-num" style={{background:T3C.teal}}>{i+1}</div>
                <div className="rx-body"><div className="rt">{r.t}</div><div className="rd">{r.d}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* what-if */}
      <div className="panel">
        <div className="panel-head"><h3>{isBank?'Stress test: move responsiveness, watch the file clear the band':'What-if: move one number, watch your score climb'}</h3></div>
        <div className="whatif">
          <div style={{display:'flex',alignItems:'center',gap:14,flexWrap:'wrap'}}>
            <span className="eyebrow" style={{flex:'0 0 auto'}}>Alert response rate</span>
            <span style={{fontSize:24,fontWeight:800,color:accent,fontVariantNumeric:'tabular-nums',flex:'0 0 70px'}}>{resp}%</span>
            <input type="range" min={Math.round(baseResp*100)} max="100" value={resp} onChange={e=>setResp(+e.target.value)} className="gl" style={{flex:'1 1 220px'}}/>
            <button className="reset-btn" style={{flex:'0 0 auto',width:'auto',padding:'7px 14px',border:'1px solid '+T3C.line,color:T3C.slateSoft}} onClick={()=>setResp(Math.round(baseResp*100))}>reset</button>
          </div>
          <div className="whatif-readout">
            <div className="wr"><span className="wl">{isBank?'Underwriting score':'Where you stand'}</span><span className="wv" style={{color:ready?accent:T3C.forest}}>{liveScore.toFixed(1)} {ready && '✓'}</span></div>
            <div className="wr"><span className="wl">{isBank?'Approval status':'Status'}</span><span className="wv" style={{color:ready?T3C.teal:'#B97A1C',fontSize:22}}>{ready?'Loan-ready':'Conditional'}</span></div>
            <div className="wr"><span className="wl">{isBank?'Incremental debt-service margin':'Extra profit if you do this'}</span><span className="wv" style={{color:accent}}>{uplift>0?'+'+fmtMoney(uplift):'$0'}<span style={{fontSize:13,fontWeight:500,color:T3C.slateSoft}}>/season</span></span></div>
          </div>
        </div>
        <div className="callout" style={{marginTop:16, background:accentSoft, border:'1px solid '+accent, color: isBank?'#16332a':'#1d5b5b'}}>
          <strong>{isBank?'Underwriting summary: ':'Bottom line: '}</strong> {isBank?bankerText:farmerText}
        </div>
      </div>
    </div>
  );
}
window.Tab3 = Tab3;
