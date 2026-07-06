// charts2.jsx, Tab 2 & Tab 3 chart primitives
const C2 = window.Charts1.C;
const fmtMoney = v => '$'+Math.round(v).toLocaleString();
const fmtPct = (v,d=1) => (v*100).toFixed(d)+'%';

/* ============================================================
   DUMBBELL, routine vs precision outcome per treatment
   ============================================================ */
function Dumbbell({treatments, tip, metric}){
  // metric: 'profit' uses avgProfit & routine = avgProfit-avgBenefit ; 'roi' uses roi
  const rows=[...treatments].sort((a,b)=>b[metric==='roi'?'roi':'avgProfit']-a[metric==='roi'?'roi':'avgProfit']);
  const useRoi = metric==='roi';
  const actual = r => useRoi? r.roi : r.avgProfit;
  const routine = r => useRoi? (r.roi - r.avgBenefit/ (r.avgProfit/r.roi || 1)) : (r.avgProfit - r.avgBenefit);
  const W=620, rowH=40, padL=120, padR=70, padT=14;
  const H=padT*2+rows.length*rowH;
  const allVals=rows.flatMap(r=>[actual(r),routine(r)]);
  const min=Math.min(...allVals,0), max=Math.max(...allVals);
  const xFor=v=>padL+((v-min)/(max-min))*(W-padL-padR);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'auto',display:'block'}}>
      {rows.map((r,i)=>{
        const y=padT+i*rowH+rowH/2;
        const xa=xFor(actual(r)), xr=xFor(routine(r));
        return (
          <g key={i} style={{cursor:'pointer'}}
            onMouseEnter={e=>tip.show(e,<div><div className="tt">{r.treatment}</div>
              <div className="tr"><span>Actual (precision)</span><span>{useRoi?fmtPct(r.roi):fmtMoney(r.avgProfit)}</span></div>
              <div className="tr"><span>Routine-only</span><span>{useRoi?fmtPct(routine(r)):fmtMoney(routine(r))}</span></div>
              <div className="tr"><span>Precision benefit</span><span>+{fmtMoney(r.avgBenefit)}</span></div></div>)}
            onMouseMove={tip.move} onMouseLeave={tip.hide}>
            <text x={padL-12} y={y+4} textAnchor="end" fontSize="12.5" fontWeight="600" fill={C2.forest}>{r.treatment}</text>
            <line x1={xr} x2={xa} y1={y} y2={y} stroke={C2.teal} strokeWidth="3" opacity="0.55"/>
            <circle cx={xr} cy={y} r="6" fill="#fff" stroke={C2.slateSoft} strokeWidth="2.5"/>
            <circle cx={xa} cy={y} r="7" fill={C2.teal} stroke="#fff" strokeWidth="2"/>
            <text x={xa+12} y={y+4} fontSize="11.5" fontWeight="700" fill={C2.teal}>{useRoi?fmtPct(r.roi,0):fmtMoney(r.avgProfit)}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ============================================================
   ROI BARS, treatments, teal gradient, clickable
   ============================================================ */
function RoiBars({treatments, active, onPick}){
  const rows=[...treatments].sort((a,b)=>b.roi-a.roi);
  const max=Math.max(...rows.map(r=>r.roi));
  return (
    <div style={{display:'flex',flexDirection:'column',gap:9}}>
      {rows.map((r,i)=>{
        const sel = active===r.treatment;
        const dim = active && !sel;
        return (
          <div key={i} onClick={()=>onPick(sel?null:r.treatment)} style={{cursor:'pointer',opacity:dim?0.4:1,transition:'opacity .2s'}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:12.5,marginBottom:4}}>
              <span style={{fontWeight:sel?700:600,color:C2.forest}}>{r.treatment} <span className="muted" style={{fontWeight:400}}>· n={r.n}</span></span>
              <span style={{fontWeight:700,color:C2.teal}}>{fmtPct(r.roi)}</span>
            </div>
            <div style={{height:14,background:C2.bone,borderRadius:5}}>
              <div style={{height:'100%',width:(r.roi/max*100)+'%',borderRadius:5,
                background:i===0?`linear-gradient(90deg,${C2.teal},${C2.tealBright})`:C2.teal,
                opacity:0.45+0.55*(r.roi/max),transition:'width .6s'}}></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   HEATMAP, crop × climate zone, avg ROI
   ============================================================ */
function Heatmap({heat, crops, zones, tip}){
  const max=Math.max(...heat.map(h=>h.roi));
  const min=Math.min(...heat.map(h=>h.roi));
  const cellFor=(c,z)=>heat.find(h=>h.crop===c&&h.zone===z);
  const color=v=>{
    const t=(v-min)/(max-min);
    // bone -> teal -> deep teal ; hottest = full teal
    if(t>0.85) return C2.teal;
    const r=Math.round(244-(244-46)*t), g=Math.round(241-(241-139)*t), b=Math.round(234-(234-139)*t);
    return `rgb(${r},${g},${b})`;
  };
  const colW=92, rowH=46, padL=86, padT=26;
  return (
    <div style={{overflowX:'auto'}}>
      <table style={{borderCollapse:'separate',borderSpacing:5,fontSize:12}}>
        <thead><tr><th></th>{zones.map(z=><th key={z} style={{fontSize:10.5,fontWeight:700,letterSpacing:'.04em',textTransform:'uppercase',color:C2.slateSoft,padding:'0 4px 6px',textAlign:'center'}}>{z}</th>)}</tr></thead>
        <tbody>
          {crops.map(c=>(
            <tr key={c}>
              <td style={{fontSize:12.5,fontWeight:600,color:C2.forest,paddingRight:10,whiteSpace:'nowrap'}}>{c}</td>
              {zones.map(z=>{
                const cell=cellFor(c,z);
                if(!cell) return <td key={z} style={{width:colW,height:rowH,background:'#F4F1EA',borderRadius:8,textAlign:'center',color:'#C7C0B0',fontSize:11}}>-</td>;
                const hot=cell.roi===max;
                const light=(cell.roi-min)/(max-min)>0.55;
                return (
                  <td key={z} style={{width:colW,height:rowH,background:color(cell.roi),borderRadius:8,textAlign:'center',
                    color:light?'#fff':C2.forest,fontWeight:hot?800:600,cursor:'pointer',
                    boxShadow:hot?'0 0 0 2px #E8A23D':'none',transition:'transform .12s'}}
                    onMouseEnter={e=>tip.show(e,<div><div className="tt">{c} · {z}</div>
                      <div className="tr"><span>Avg ROI</span><span>{fmtPct(cell.roi)}</span></div>
                      <div className="tr"><span>Plots</span><span>{cell.n}</span></div></div>)}
                    onMouseMove={tip.move} onMouseLeave={tip.hide}>
                    {fmtPct(cell.roi,0)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ============================================================
   COST-EFFICIENCY SCATTER, precision spend vs benefit, break-even line
   ============================================================ */
function CostScatter({plotData, tip}){
  const W=620,H=380,padL=58,padR=24,padT=20,padB=50;
  const iw=W-padL-padR, ih=H-padT-padB;
  const pts=plotData.filter(d=>d.spend!=null);
  const maxX=Math.max(...pts.map(d=>d.spend))*1.05;
  const maxY=Math.max(...pts.map(d=>d.benefit))*1.05;
  const minY=Math.min(0,...pts.map(d=>d.benefit));
  const xFor=v=>padL+(v/maxX)*iw;
  const yFor=v=>padT+(1-(v-minY)/(maxY-minY))*ih;
  // break-even line y=x in data space
  const beEnd=Math.min(maxX,maxY);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'auto',display:'block'}}>
      {/* break-even diagonal */}
      <line x1={xFor(0)} y1={yFor(0)} x2={xFor(beEnd)} y2={yFor(beEnd)} stroke={C2.slateSoft} strokeDasharray="5 5" strokeWidth="1.5"/>
      <text x={xFor(beEnd)-4} y={yFor(beEnd)-7} fontSize="10.5" fill={C2.slateSoft} textAnchor="end">break-even (1×)</text>
      {[0,.5,1].map(g=>(
        <g key={g}>
          <text x={padL-8} y={yFor(minY+(maxY-minY)*g)+4} textAnchor="end" fontSize="10" fill={C2.slateSoft}>{fmtMoney(minY+(maxY-minY)*g)}</text>
        </g>
      ))}
      <line x1={padL} x2={padL+iw} y1={yFor(0)} y2={yFor(0)} stroke={C2.line}/>
      <text x={padL-44} y={padT+ih/2} fontSize="11" fontWeight="600" fill={C2.slate} transform={`rotate(-90 ${padL-44} ${padT+ih/2})`} textAnchor="middle">PRECISION BENEFIT</text>
      <text x={padL+iw/2} y={H-8} fontSize="11" fontWeight="600" fill={C2.slate} textAnchor="middle">PRECISION SPEND →</text>
      {pts.map((d,i)=>{
        const below=d.benefit<=0;
        return (
          <circle key={i} cx={xFor(d.spend)} cy={yFor(d.benefit)} r={below?6:4.5}
            fill={below?C2.clay:C2.teal} fillOpacity={below?0.95:0.5} stroke={below?'#fff':'none'} strokeWidth="1.5"
            style={{cursor:'pointer'}}
            onMouseEnter={e=>tip.show(e,<div><div className="tt">{d.plot} · {d.treatment}</div>
              <div className="tr"><span>Spend</span><span>{fmtMoney(d.spend)}</span></div>
              <div className="tr"><span>Benefit</span><span>{fmtMoney(d.benefit)}</span></div>
              <div className="tr"><span>Return</span><span>{d.ratio?d.ratio+'×':'-'}</span></div></div>)}
            onMouseMove={tip.move} onMouseLeave={tip.hide}/>
        );
      })}
    </svg>
  );
}

/* ============================================================
   RADIAL GAUGE (variant A), score 0..100
   ============================================================ */
function Gauge({score, target, size=300}){
  const cx=size/2, cy=size/2, r=size*0.40, sw=size*0.085;
  const start=135, end=405; // 270° sweep
  const ang = v => (start + (end-start)*(v/100)) * Math.PI/180;
  const pt = (a,rr)=>[cx+rr*Math.cos(a), cy+rr*Math.sin(a)];
  const arc=(v0,v1,rr)=>{
    const a0=ang(v0),a1=ang(v1);
    const [x0,y0]=pt(a0,rr),[x1,y1]=pt(a1,rr);
    const large=(a1-a0)>Math.PI?1:0;
    return `M ${x0} ${y0} A ${rr} ${rr} 0 ${large} 1 ${x1} ${y1}`;
  };
  const needleA=ang(score);
  const [nx,ny]=pt(needleA,r-sw/2);
  const bands=[{a:0,b:50,c:C2.clay},{a:50,b:75,c:C2.amber},{a:75,b:100,c:C2.teal}];
  const tA=ang(target); const [tx,ty]=pt(tA,r+sw*0.7); const [tx2,ty2]=pt(tA,r-sw*0.7);
  return (
    <svg viewBox={`${-size*0.13} ${-size*0.03} ${size*1.26} ${size*0.93}`} style={{width:'100%',maxWidth:size*1.16,height:'auto',display:'block',margin:'0 auto'}}>
      <path d={arc(0,100,r)} fill="none" stroke={C2.bone} strokeWidth={sw} strokeLinecap="round"/>
      {bands.map((b,i)=><path key={i} d={arc(b.a,b.b,r)} fill="none" stroke={b.c} strokeWidth={sw} opacity="0.9"/>)}
      {/* target tick */}
      <line x1={tx} y1={ty} x2={tx2} y2={ty2} stroke={C2.forest} strokeWidth="2.5"/>
      <text x={pt(tA,r+sw*1.45)[0]} y={pt(tA,r+sw*1.45)[1]+4} fontSize="12.5" fontWeight="700" fill={C2.forest} textAnchor="middle">{target}</text>
      {/* needle */}
      <g transform={`rotate(${start + (end-start)*(score/100)} ${cx} ${cy})`} style={{transition:'transform .4s cubic-bezier(.34,1.1,.64,1)'}}>
        <line x1={cx} y1={cy} x2={cx+(r-sw/2)} y2={cy} stroke={C2.forest} strokeWidth="3.5" strokeLinecap="round"/>
      </g>
      <circle cx={cx} cy={cy} r={size*0.045} fill={C2.forest}/>
      {/* center value */}
      <text x={cx} y={cy-size*0.02} textAnchor="middle" fontSize={size*0.24} fontWeight="800" fill={C2.forest} style={{letterSpacing:'-.02em'}}>{score.toFixed(0)}</text>
      <text x={cx} y={cy+size*0.10} textAnchor="middle" fontSize={size*0.05} fontWeight="600" fill={C2.slateSoft} letterSpacing=".08em">/ 100</text>
    </svg>
  );
}

/* LINEAR METER (variant B), horizontal score bar with bands */
function LinearMeter({score, target}){
  return (
    <div style={{padding:'8px 0'}}>
      <div style={{display:'flex',alignItems:'flex-end',gap:14,marginBottom:14}}>
        <div style={{fontSize:72,fontWeight:800,lineHeight:.9,color:score>=75?C2.teal:C2.amber,letterSpacing:'-.03em'}}>{score.toFixed(0)}</div>
        <div style={{paddingBottom:10}}>
          <div className="tag" style={{background:score>=75?'rgba(46,139,139,.15)':'rgba(232,162,61,.18)',color:score>=75?C2.teal:'#B97A1C'}}>{score>=75?'Loan-ready':score>=50?'Conditional':'Not ready'}</div>
          <div style={{fontSize:12.5,color:C2.slateSoft,marginTop:6}}>Target {target} · {(target-score).toFixed(1)} to go</div>
        </div>
      </div>
      <div style={{position:'relative',height:26,borderRadius:8,overflow:'hidden',display:'flex'}}>
        <div style={{width:'50%',background:C2.clay,opacity:.85}}></div>
        <div style={{width:'25%',background:C2.amber,opacity:.85}}></div>
        <div style={{width:'25%',background:C2.teal,opacity:.85}}></div>
        <div style={{position:'absolute',top:-4,bottom:-4,left:score+'%',width:3,background:C2.forest,boxShadow:'0 0 0 2px #fff'}}></div>
        <div style={{position:'absolute',top:-4,bottom:-4,left:target+'%',width:2,background:C2.forest,opacity:.5}}></div>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:10.5,color:C2.slateSoft,marginTop:6}}>
        <span>0 · Not ready</span><span>50 · Conditional</span><span>75 · Loan-ready</span><span>100</span>
      </div>
    </div>
  );
}

/* ============================================================
   SCORE WATERFALL, baseline + each component contribution
   ============================================================ */
function ScoreWaterfall({contributions, score}){
  const items=[
    {label:'Profitability',v:contributions.profitability,c:C2.teal},
    {label:'Responsiveness',v:contributions.responsiveness,c:C2.amber},
    {label:'Precision ROI',v:contributions.precisionROI,c:C2.teal},
    {label:'Consistency',v:contributions.consistency,c:C2.teal},
  ];
  const W=620,H=240,padL=20,padR=20,padT=16,padB=44;
  const iw=W-padL-padR, ih=H-padT-padB;
  const maxScore=100;
  const yFor=v=>padT+(1-v/maxScore)*ih;
  const barW=iw/(items.length+1)*0.62;
  const gap=iw/(items.length+1);
  let cum=0;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'auto',display:'block'}}>
      <line x1={padL} x2={padL+iw} y1={yFor(75)} y2={yFor(75)} stroke={C2.forest} strokeDasharray="4 4" strokeWidth="1.5"/>
      <text x={padL+iw} y={yFor(75)-5} fontSize="10.5" fontWeight="700" fill={C2.forest} textAnchor="end">loan-ready · 75</text>
      {items.map((it,i)=>{
        const x=padL+gap*(i+0.5)-barW/2+gap*0.2;
        const yTop=yFor(cum+it.v), yBot=yFor(cum);
        const seg=<g key={i}>
          {i>0 && <line x1={x-gap*0.4} x2={x} y1={yBot} y2={yBot} stroke={C2.line} strokeDasharray="3 3"/>}
          <rect x={x} y={yTop} width={barW} height={Math.max(2,yBot-yTop)} fill={it.c} rx="3" opacity={it.label==='Responsiveness'?1:0.82}/>
          <text x={x+barW/2} y={yTop-6} textAnchor="middle" fontSize="11.5" fontWeight="700" fill={it.c==C2.amber?'#B97A1C':C2.forest}>+{it.v.toFixed(1)}</text>
          <text x={x+barW/2} y={H-26} textAnchor="middle" fontSize="10.5" fill={C2.slateSoft}>{it.label}</text>
          {it.label==='Responsiveness' && <text x={x+barW/2} y={H-13} textAnchor="middle" fontSize="9.5" fontWeight="700" fill={C2.clay}>weakest</text>}
        </g>;
        cum+=it.v;
        return seg;
      })}
      {/* final total */}
      <rect x={padL+gap*(items.length+0.5)-barW/2+gap*0.2} y={yFor(score)} width={barW} height={yFor(0)-yFor(score)} fill={C2.forest} rx="3"/>
      <text x={padL+gap*(items.length+0.5)+gap*0.2} y={yFor(score)-6} textAnchor="middle" fontSize="13" fontWeight="800" fill={C2.forest}>{score.toFixed(0)}</text>
      <text x={padL+gap*(items.length+0.5)+gap*0.2} y={H-26} textAnchor="middle" fontSize="10.5" fontWeight="700" fill={C2.forest}>SCORE</text>
    </svg>
  );
}

/* PROGRESS RING, for component cards */
function Ring({pct, color, size=56, label}){
  const r=size/2-6, c=2*Math.PI*r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{flex:`0 0 ${size}px`}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#ECE7DB" strokeWidth="6"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c*(1-pct)} transform={`rotate(-90 ${size/2} ${size/2})`} style={{transition:'stroke-dashoffset .6s'}}/>
      <text x={size/2} y={size/2+4} textAnchor="middle" fontSize="13" fontWeight="800" fill={color}>{Math.round(pct*100)}</text>
    </svg>
  );
}

/* SPARKLINE, sensor trend in drill card */
function Sparkline({data, color=C2.teal, w=150, h=30}){
  const min=Math.min(...data),max=Math.max(...data);
  const pts=data.map((v,i)=>`${(i/(data.length-1))*w},${h-((v-min)/((max-min)||1))*h}`).join(' ');
  return <svg width={w} height={h} style={{display:'block'}}><polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

window.Charts2 = { Dumbbell, RoiBars, Heatmap, CostScatter, Gauge, LinearMeter, ScoreWaterfall, Ring, Sparkline, fmtMoney, fmtPct };
