// tab1.jsx, "Monday Morning" (Use Case A)
const { TriageScatter, TriageQuadrant, SpeedBars, AlertFunnel, alertColor, alertLabel, CountUp } = window.Charts1;
const { Sparkline } = window.Charts2;
const T1C = window.Charts1.C;

// pseudo sensor sparkline generator (seeded by plot id, for drill detail)
function seedSpark(seed, n=14, base=0.4, amp=0.15){
  let x=0; for(const ch of seed) x+=ch.charCodeAt(0);
  const out=[];
  for(let i=0;i<n;i++){ x=(x*9301+49297)%233280; out.push(base+amp*Math.sin(i/2+ x/233280*6)); }
  return out;
}

function KpiCard({label,val,num,fmt,ctx,cls,accent}){
  const shown = num!=null ? (fmt?fmt(num):String(Math.round(num))) : String(val);
  const display = num!=null ? <CountUp value={num} fmt={fmt}/> : val;
  return (
    <div className={"kpi "+(cls||"")}>
      {accent && <div className="k-accent" style={{background:accent}}></div>}
      <div className="k-label">{label}</div>
      <div className={"k-val tnum "+(shown.length>6?'sm':'')}>{display}</div>
      <div className="k-ctx">{ctx}</div>
    </div>
  );
}

function Tab1({data, tip, tweaks}){
  const {tab1} = data;
  const [crew,setCrew]=React.useState(6);
  const [selId,setSelId]=React.useState(null);

  const perCrew=3; // plots a crew member can clear in a morning
  const capacity=crew*perCrew;
  const queue=tab1.queue;
  const inScope=queue.slice(0,capacity);
  const scopeBenefit=inScope.reduce((a,r)=>a+r.benefit,0);
  const totalBenefit=queue.reduce((a,r)=>a+r.benefit,0) || 1;
  const maxBenefit=queue.length ? Math.max(...queue.map(r=>r.benefit)) : 1;
  const sel = (selId && queue.find(q=>q.plot===selId)) || queue[0];

  const ignored = tab1.alertTypes.filter(t=>t.fired>3 && t.acted>0 && t.responseRate<0.6)
    .sort((a,b)=>Math.abs(b.avgImpact)-Math.abs(a.avgImpact))[0];
  const respPct = (tab1.respRate*100).toFixed(1)+'%';

  return (
    <div className="fade-in">
      <div className="tab-head">
        <h1>Monday Morning</h1>
        <p>It's 7am. A limited crew, a screen full of alerts. This board turns a noisy inbox into a payoff-ranked work order, so the most valuable plots get worked first, not the loudest.</p>
      </div>

      <div className="kpi-band" style={{gridTemplateColumns:'repeat(5,1fr)'}}>
        <KpiCard label="Open alerts" num={tab1.open} fmt={v=>Math.round(v).toLocaleString()} ctx="unactioned this season" cls="warn" accent={T1C.clay}/>
        <KpiCard label="Alert response rate" num={tab1.respRate*100} fmt={v=>v.toFixed(1)+'%'} ctx="target ≥ 90%" accent={T1C.amber}/>
        <KpiCard label="Speed payoff" num={tab1.speed.ratio} fmt={v=>v.toFixed(1)+'×'} ctx={`faster = ${tab1.speed.ratio.toFixed(1)}× more stress relief`} cls="hero-kpi"/>
        <KpiCard label="Highest-value ignored" val={ignored?alertLabel(ignored.type):'None'} ctx={ignored?`acted on only ${(ignored.responseRate*100).toFixed(0)}% of the time`:'key alerts acted on'} cls="warn" accent={T1C.clay}/>
        <KpiCard label="Crew capacity used" val={`${Math.min(capacity,queue.length)}/${queue.length}`} ctx={`${crew} crew → top ${capacity} plots queued`} cls="teal" accent={T1C.teal}/>
      </div>

      {/* hero + supporting */}
      <div className="grid" style={{gridTemplateColumns:'1.5fr 1fr',marginBottom:20}}>
        <div className="panel">
          <div className="panel-head">
            <h3>Triage Matrix: impact vs response</h3>
            <span className="sub">bubble = open alerts</span>
          </div>
          {tweaks.triageStyle==='quadrant'
            ? <TriageQuadrant types={tab1.alertTypes} tip={tip}/>
            : <TriageScatter types={tab1.alertTypes} tip={tip}/>}
          <div className="legend" style={{marginTop:10}}>
            {tab1.alertTypes.filter(t=>t.fired>3).map(t=>(
              <span className="li" key={t.type}><i style={{background:alertColor(t.type)}}></i>{alertLabel(t.type)}</span>
            ))}
          </div>
          {!data.filtered ? (
            <div className="callout clay" style={{marginTop:14,background:'rgba(196,69,54,.08)',border:'1px solid rgba(196,69,54,.3)',color:'#8a2f24'}}>
              <strong>High VPD</strong> sits bottom-right, the single most effective intervention in the dataset, acted on just <strong>11%</strong> of the time. <strong>High Canopy Temp: 0% acted</strong> all season.
            </div>
          ) : (
            <div className="callout" style={{marginTop:14,background:'var(--bone)',border:'1px solid var(--line)',color:'var(--slate-soft)'}}>
              Showing <strong style={{color:T1C.forest}}>{data.n}</strong> plot{data.n!==1?'s':''} · {data.label}. Bubbles and ranking recomputed live from this selection.
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-head"><h3>Speed is the lever</h3></div>
          <SpeedBars speed={tab1.speed} big/>
        </div>
      </div>

      {/* crew slider + queue + detail */}
      <div className="panel" style={{marginBottom:20}}>
        <div className="panel-head">
          <h3>Priority queue: value-ranked work order</h3>
          <span className="sub">click a row for plot detail</span>
        </div>
        <div className="crew-control" style={{marginBottom:20,padding:'12px 14px',background:T1C.bone,borderRadius:10}}>
          <span className="eyebrow">Crew size</span>
          <span className="crew-val">{crew}</span>
          <input type="range" min="1" max="12" value={crew} onChange={e=>setCrew(+e.target.value)} className="gl" style={{flex:'1 1 200px'}}/>
          <div style={{fontSize:12.5,color:T1C.slateSoft}}>Queue trims to the top <strong style={{color:T1C.forest}}>{capacity}</strong> plots, capturing <strong style={{color:T1C.teal}}>{(scopeBenefit/totalBenefit*100).toFixed(0)}%</strong> of total recoverable stress benefit.</div>
        </div>

        <div className="grid" style={{gridTemplateColumns:'1.6fr 1fr'}}>
          <div style={{maxHeight:360,overflowY:'auto'}}>
            <table className="qtable">
              <thead><tr><th style={{width:34}}>#</th><th>Plot</th><th>Farm</th><th>Alert type</th><th className="num">Open</th><th className="num">Stress benefit</th></tr></thead>
              <tbody>
                {queue.slice(0,40).map((r,i)=>{
                  const out = i>=capacity;
                  return (
                    <tr key={r.plot} className={sel&&sel.plot===r.plot?'sel':''} onClick={()=>setSelId(r.plot)} style={{opacity:out?0.4:1}}>
                      <td><span className={"rank-pill"+(i<3?' top':'')}>{i+1}</span></td>
                      <td style={{fontWeight:700,color:T1C.forest}}>{r.plot}</td>
                      <td className="muted">{r.farm}</td>
                      <td><span className="atype-tag"><i className="atype-dot" style={{background:alertColor(r.domType)}}></i>{alertLabel(r.domType)}</span></td>
                      <td className="num">{r.open}</td>
                      <td className="num"><span className="benefit-bar" style={{width:Math.max(4,r.benefit/maxBenefit*54)+'px'}}></span>{r.benefit.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* drill detail */}
          {sel && (
            <div className="detail-card">
              <div className="dc-head">
                <div>
                  <div className="pid">{sel.plot}</div>
                  <div style={{fontSize:12,color:T1C.slateSoft}}>{sel.farm} · {sel.crop} · {sel.treatment} · {sel.zone}</div>
                </div>
                <span className="tag clay">{sel.open} open</span>
              </div>
              {[
                {l:'VPD (kPa)',c:T1C.clay,seed:sel.plot+'vpd',base:1.3,amp:0.4,v:'1.42'},
                {l:'Substrate moisture',c:T1C.teal,seed:sel.plot+'moi',base:0.42,amp:0.08,v:'0.39'},
                {l:'Canopy temp (°C)',c:T1C.amber,seed:sel.plot+'can',base:24,amp:3,v:'25.8'},
                {l:'Stress index',c:T1C.forest,seed:sel.plot+'str',base:0.4,amp:0.18,v:'0.46'},
              ].map(s=>(
                <div className="spark-row" key={s.l}>
                  <span className="sl">{s.l}</span>
                  <Sparkline data={seedSpark(s.seed,14,s.base,s.amp)} color={s.c} w={120} h={26}/>
                  <span className="sv" style={{color:s.c}}>{s.v}</span>
                </div>
              ))}
              <div className="callout teal" style={{marginTop:12,fontSize:12.5}}>
                Recommended: <strong>{sel.domType==='High Pest Pressure'?'scout & spot-treat':'vent / mist to drop VPD'}</strong> today. Expected stress relief if acted within 1 day: <strong>4.2× greater</strong>.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* funnel */}
      <div className="panel">
        <div className="panel-head"><h3>Alert funnel: fired vs acted, by type</h3><span className="sub">where attention actually went</span></div>
        <AlertFunnel types={tab1.alertTypes}/>
      </div>
    </div>
  );
}
window.Tab1 = Tab1;
window.KpiCard = KpiCard;
