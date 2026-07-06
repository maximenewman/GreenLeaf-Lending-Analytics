// app.jsx, shell: rail filters, tabs, tweaks panel
const { useState } = React;
const APPC = window.Charts1.C;

class ErrorBoundary extends React.Component {
  constructor(p){ super(p); this.state={err:null}; }
  static getDerivedStateFromError(err){ return {err}; }
  componentDidCatch(err, info){ console.error('TAB ERROR:', err, info); }
  render(){
    if(this.state.err){
      return <div style={{padding:24,fontFamily:'monospace',color:'#C44536',whiteSpace:'pre-wrap',fontSize:13}}>
        <strong>Render error:</strong>{'\n'}{String(this.state.err && this.state.err.stack || this.state.err)}
      </div>;
    }
    return this.props.children;
  }
}

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "triageStyle": "scatter",
  "scoreStyle": "gauge",
  "dumbbellMetric": "profit",
  "accent": "#2E8B8B"
}/*EDITMODE-END*/;

const FARMS = ['BC Harvest 1','BC Harvest 2','BC Harvest 3','BC Harvest 4','BC Harvest 5','BC Harvest 6','BC Harvest 7','BC Harvest 8'];
const CROPS = ['Tomato','Pepper','Cucumber','Strawberry'];
const TREATMENTS = ['High Light','Shade','High N','Low N','Control','Integrated Pest','Reduced Pest'];
const ZONES = ['Coastal','Interior','Fraser Valley'];

function ChipRow({options, sel, onToggle, amber}){
  return (
    <div className="chip-row">
      {options.map(o=>(
        <button key={o} className={"chip"+(amber?' act-amber':'')+(sel.includes(o)?' active':'')} onClick={()=>onToggle(o)}>{o.replace('BC Harvest ','Farm ')}</button>
      ))}
    </div>
  );
}

function Rail({collapsed,setCollapsed,filters,setFilters}){
  const toggle=(key,val)=>setFilters(f=>{
    const cur=f[key]; const next=cur.includes(val)?cur.filter(x=>x!==val):[...cur,val];
    return {...f,[key]:next};
  });
  const reset=()=>setFilters({farm:[],crop:[],treatment:[],zone:[]});
  const anyActive=Object.values(filters).some(a=>a.length);
  return (
    <aside className={"rail"+(collapsed?' collapsed':'')}>
      <div className="brand">
        <div className="brand-mark">G</div>
        <div className="brand-txt"><span className="b1">GreenLeaf</span><span className="b2">Loan Readiness</span></div>
        <button className="rail-toggle" onClick={()=>setCollapsed(c=>!c)}>{collapsed?'›':'‹'}</button>
      </div>
      <div className="filters">
        <div className="filter-grp"><span className="eyebrow">Farm <span style={{opacity:.6}}>· 8</span></span><ChipRow options={FARMS} sel={filters.farm} onToggle={v=>toggle('farm',v)}/></div>
        <div className="filter-grp"><span className="eyebrow">Crop <span style={{opacity:.6}}>· 4</span></span><ChipRow options={CROPS} sel={filters.crop} onToggle={v=>toggle('crop',v)}/></div>
        <div className="filter-grp"><span className="eyebrow">Treatment <span style={{opacity:.6}}>· 7</span></span><ChipRow options={TREATMENTS} sel={filters.treatment} onToggle={v=>toggle('treatment',v)}/></div>
        <div className="filter-grp"><span className="eyebrow">Climate zone <span style={{opacity:.6}}>· 3</span></span><ChipRow options={ZONES} sel={filters.zone} onToggle={v=>toggle('zone',v)} amber/></div>
      </div>
      <div className="rail-foot">
        <button className="reset-btn" onClick={reset} disabled={!anyActive} style={{opacity:anyActive?1:.5}}>Reset filters</button>
        <div className="scope-note">Filters are persistent across all tabs. Charts read the live season tables. What-if sliders recompute against real data.</div>
      </div>
    </aside>
  );
}

function App(){
  const [tab,setTab]=useState(0);
  const [collapsed,setCollapsed]=useState(false);
  const [filters,setFilters]=useState({farm:[],crop:[],treatment:[],zone:[]});
  const [frame,setFrame]=useState('banker');
  const [t,setTweak]=useTweaks(TWEAK_DEFAULTS);
  const tip = window.Charts1.useTip();
  const data = React.useMemo(()=>window.buildView(filters),[filters]);
  const clearFilters=()=>setFilters({farm:[],crop:[],treatment:[],zone:[]});

  const TABS=[
    {no:'01',name:'Monday Morning'},
    {no:'02',name:'Proof of Value'},
    {no:'03',name:'Loan Readiness'},
  ];

  return (
    <div className="app" style={{'--teal':t.accent}}>
      <Rail collapsed={collapsed} setCollapsed={setCollapsed} filters={filters} setFilters={setFilters}/>
      <div className="main">
        <div className="topbar">
          <div className="tabs">
            {TABS.map((tb,i)=>(
              <button key={i} className={"tab"+(tab===i?' active':'')} onClick={()=>setTab(i)} data-screen-label={tb.no}>
                <span className="t-no">TAB {tb.no}</span><span className="t-name">{tb.name}</span>
              </button>
            ))}
          </div>
          <div className="topbar-right">
            {data.filtered && (
              <div className="filter-pill">
                <span className="fp-dot"></span>
                <span><b>{data.n}</b>/120 plots</span>
                <span className="fp-label">{data.label}</span>
                <button className="fp-x" onClick={clearFilters} aria-label="Clear filters">✕</button>
              </div>
            )}
          </div>
        </div>
        <div className="canvas" data-screen-label={TABS[tab].name}>
          {data.n===0 ? (
            <div className="empty-state">
              <div className="es-mark">∅</div>
              <h2>No plots match these filters</h2>
              <p>Loosen a filter to bring the season data back into view.</p>
              <button className="es-btn" onClick={clearFilters}>Clear all filters</button>
            </div>
          ) : (
            <ErrorBoundary key={tab}>
            {tab===0 && <window.Tab1 data={data} tip={tip} tweaks={t}/>}
            {tab===1 && <window.Tab2 data={data} tip={tip} tweaks={t}/>}
            {tab===2 && <window.Tab3 data={data} tweaks={t} frame={frame} setFrame={setFrame}/>}
            </ErrorBoundary>
          )}
        </div>
      </div>
      {tip.node}

      <TweaksPanel>
        <TweakSection label="Hero visuals"/>
        <TweakRadio label="Triage matrix (Tab 1)" value={t.triageStyle} options={[{value:'scatter',label:'Scatter'},{value:'quadrant',label:'Quadrant'}]} onChange={v=>setTweak('triageStyle',v)}/>
        <TweakRadio label="Score (Tab 3)" value={t.scoreStyle} options={[{value:'gauge',label:'Radial'},{value:'linear',label:'Linear'}]} onChange={v=>setTweak('scoreStyle',v)}/>
        <TweakRadio label="Dumbbell (Tab 2)" value={t.dumbbellMetric} options={[{value:'profit',label:'Profit'},{value:'roi',label:'ROI'}]} onChange={v=>setTweak('dumbbellMetric',v)}/>
        <TweakSection label="Theme"/>
        <TweakColor label="Accent" value={t.accent} options={['#2E8B8B','#1B3A2F','#E8A23D','#3FB3AB']} onChange={v=>setTweak('accent',v)}/>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
