// tab2.jsx, "Proof of Value" (Use Case B)
const { Dumbbell, RoiBars, Heatmap, CostScatter, fmtMoney, fmtPct } = window.Charts2;
const { CountUp } = window.Charts1;
const T2C = window.Charts1.C;
const KpiCard2 = window.KpiCard;

function Tab2({data, tip, tweaks}){
  const {tab2} = data;
  const [activeTreat,setActiveTreat]=React.useState(null);

  // filter plotData by active treatment for the scatter
  const scatterData = activeTreat ? tab2.plotData.filter(d=>d.treatment===activeTreat) : tab2.plotData;
  const best = tab2.bestPlot;
  const perPlot = Math.round(tab2.totalBenefit/tab2.total);

  return (
    <div className="fade-in">
      <div className="tab-head">
        <h1>Proof of Value</h1>
        <p>Did precision actually pay, over and above the growing strategy? Across {tab2.total} microplots we isolate precision's contribution, name our best bets, and show our misses honestly.</p>
      </div>

      <div className="kpi-band" style={{gridTemplateColumns:'repeat(5,1fr)'}}>
        <div className="kpi hero-kpi">
          <div className="k-label">Total precision benefit</div>
          <div className="k-val tnum"><CountUp value={tab2.totalBenefit} fmt={v=>fmtMoney(v)}/></div>
          <div className="k-ctx">{fmtMoney(perPlot)}/plot · {tab2.profitable}/{tab2.total} profitable · vs routine baseline</div>
        </div>
        <KpiCard2 label="Profitable plots" val={`${tab2.profitable}/${tab2.total}`} ctx={`${Math.round(tab2.profitable/tab2.total*100)}% of portfolio`} cls="teal" accent={T2C.teal}/>
        <KpiCard2 label="Avg ROI" num={tab2.avgRoi*100} fmt={v=>v.toFixed(1)+'%'} ctx="season, portfolio-wide" accent={T2C.teal}/>
        <KpiCard2 label="Best treatment" val={tab2.bestTreatment.treatment} ctx={`${fmtPct(tab2.bestTreatment.roi,1)} ROI vs ${tab2.worstTreatment.treatment} ${fmtPct(tab2.worstTreatment.roi,0)}`} cls="teal" accent={T2C.teal}/>
        <KpiCard2 label="Return on precision spend" num={best.ratio} fmt={v=>v.toFixed(2)+'×'} ctx={`best plot (${best.plot}) · ${fmtMoney(best.benefit)} on ${fmtMoney(best.spend)}`} cls="amber" accent={T2C.amber}/>
      </div>

      {/* hero dumbbell */}
      <div className="panel" style={{marginBottom:20}}>
        <div className="panel-head">
          <h3>Precision vs Routine: the gap is the justification</h3>
          <span className="sub">{tweaks.dumbbellMetric==='roi'?'ROI':'profit/plot'} · ○ routine-only ● actual (precision)</span>
        </div>
        <Dumbbell treatments={tab2.treatments} tip={tip} metric={tweaks.dumbbellMetric}/>
        <div className="callout teal" style={{marginTop:6}}>
          Each treatment shows its routine-only outcome (hollow) vs actual outcome with precision (solid). <strong>The connecting gap is precision's contribution</strong>, isolated from the growing strategy. High Light shows the widest gap.
        </div>
      </div>

      {/* ROI bars + heatmap */}
      <div className="grid" style={{gridTemplateColumns:'1fr 1.15fr',marginBottom:20}}>
        <div className="panel">
          <div className="panel-head"><h3>Treatment ROI</h3><span className="sub">{activeTreat?`filtering: ${activeTreat}`:'click to filter scatter'}</span></div>
          <RoiBars treatments={tab2.treatments} active={activeTreat} onPick={setActiveTreat}/>
        </div>
        <div className="panel">
          <div className="panel-head"><h3>Crop × climate: where ROI concentrates</h3><span className="sub">avg ROI per cohort</span></div>
          <Heatmap heat={tab2.heat} crops={tab2.crops} zones={tab2.zones} tip={tip}/>
          {(()=>{ const hot=[...tab2.heat].sort((a,b)=>b.roi-a.roi)[0];
            return !data.filtered ? (
              <div className="callout teal" style={{marginTop:14,fontSize:12.5}}>
                Hottest cell: <strong>Interior strawberries</strong>. Under High Light specifically they hit <strong>77.8% ROI (n=7)</strong>, the most bankable combination we found for B.C.
              </div>
            ) : hot ? (
              <div className="callout teal" style={{marginTop:14,fontSize:12.5}}>
                Hottest cohort in view: <strong>{hot.zone} {hot.crop.toLowerCase()}</strong> at <strong>{fmtPct(hot.roi)} ROI</strong> (n={hot.n}).
              </div>
            ) : null; })()}
        </div>
      </div>

      {/* cost scatter */}
      <div className="panel">
        <div className="panel-head">
          <h3>Cost-efficiency, and our honest misses</h3>
          <span className="sub">{activeTreat?activeTreat:'all treatments'} · {scatterData.length} plots</span>
        </div>
        <div className="grid" style={{gridTemplateColumns:'1.6fr 1fr',alignItems:'center'}}>
          <CostScatter plotData={scatterData} tip={tip}/>
          <div>
            <div className="legend" style={{marginBottom:14}}>
              <span className="li"><i style={{background:T2C.teal}}></i>profitable precision</span>
              <span className="li"><i style={{background:T2C.clay}}></i>zero / negative benefit</span>
            </div>
            <div className="callout clay" style={{background:'rgba(196,69,54,.08)',border:'1px solid rgba(196,69,54,.3)',color:'#8a2f24'}}>
              <strong>{tab2.zeroBenefit} plots in clay</strong> spent on precision and returned nothing. Interventions hit the wrong alerts, too late. <strong>A precision program that can't name its failures shouldn't be financed. Ours can.</strong>
            </div>
            <div style={{marginTop:14,padding:'13px 15px',background:T2C.bone,borderRadius:10,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div className="eyebrow">Input discipline</div>
                <div style={{fontSize:13,color:T2C.forest,fontWeight:600,marginTop:3}}>Fertilizer purchased <strong className="tx-teal">5% under market</strong></div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:20,fontWeight:800,color:T2C.teal}}>$1.95</div>
                <div style={{fontSize:11,color:T2C.slateSoft}}>vs $2.05 market</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
window.Tab2 = Tab2;
