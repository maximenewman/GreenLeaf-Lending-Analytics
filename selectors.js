// selectors.js, live aggregation. buildView(plots, filters) -> {tab1, tab2, loan, meta, n, filtered, label}
// Reproduces the exact aggregate shapes the tab components consume, recomputed for any filter set.
(function(){
  const RAW = window.GREENLEAF_DATA;
  const CFG = RAW.config, META = RAW.meta;

  const mean = a => a.length ? a.reduce((x,y)=>x+y,0)/a.length : 0;
  const median = a => {
    if(!a.length) return 0;
    const s=[...a].sort((x,y)=>x-y); const m=Math.floor(s.length/2);
    return s.length%2 ? s[m] : (s[m-1]+s[m])/2;
  };

  function matches(p, f){
    return (!f.farm.length      || f.farm.includes(p.farm))
        && (!f.crop.length      || f.crop.includes(p.crop))
        && (!f.treatment.length || f.treatment.includes(p.treatment))
        && (!f.zone.length      || f.zone.includes(p.zone));
  }

  function buildView(filters){
    const f = { farm:[], crop:[], treatment:[], zone:[], ...filters };
    const plots = RAW.plots.filter(p=>matches(p,f));
    const n = plots.length;
    const filtered = Object.values(f).some(a=>a.length);

    // ---------- TAB 1 : alerts ----------
    const typeAgg = {};
    let fS=0,fN=0,sS=0,sN=0, openTot=0;
    plots.forEach(p=>{
      Object.entries(p.a.t).forEach(([k,v])=>{
        const o = typeAgg[k] || (typeAgg[k]={fired:0,acted:0,imp:0,open:0});
        o.fired+=v.f; o.acted+=v.a; o.imp+=v.imp; o.open+=v.o;
      });
      fS+=p.a.fS; fN+=p.a.fN; sS+=p.a.sS; sN+=p.a.sN; openTot+=p.a.open;
    });
    const order = CFG.alertOrder;
    const alertTypes = Object.keys(typeAgg)
      .sort((a,b)=> (order.indexOf(a)+99)%100 - (order.indexOf(b)+99)%100 || typeAgg[b].fired-typeAgg[a].fired)
      .map(k=>{
        const o=typeAgg[k];
        return { type:k, fired:o.fired, acted:o.acted, open:o.open,
          responseRate: o.fired? o.acted/o.fired : 0,
          avgImpact: o.acted? o.imp/o.acted : 0 };
      });
    const impMap = {}; alertTypes.forEach(t=>impMap[t.type]=t.avgImpact);
    const fast = fN? fS/fN : 0, slow = sN? sS/sN : 0;
    const speed = { fast, slow, fastN:fN, slowN:sN, ratio: slow? Math.abs(fast/slow) : 0 };
    const totalAlerts = alertTypes.reduce((a,t)=>a+t.fired,0);
    const totalActed  = alertTypes.reduce((a,t)=>a+t.acted,0);

    const queue = plots.filter(p=>p.a.open>0).map(p=>{
      let dom=null, domN=-1, ben=0;
      Object.entries(p.a.t).forEach(([k,v])=>{
        if(v.o>domN){domN=v.o;dom=k;}
        ben += v.o * Math.abs(impMap[k]||0);
      });
      return { plot:p.id, farm:p.farm, farmId:p.farmId, crop:p.crop, treatment:p.treatment,
        zone:p.zone, open:p.a.open, domType:dom||'', benefit:+ben.toFixed(4) };
    }).sort((a,b)=>b.benefit-a.benefit);

    const tab1 = { alertTypes, speed, queue, totalAlerts, acted:totalActed, open:openTot,
      respRate: totalAlerts? totalActed/totalAlerts : 0 };

    // ---------- TAB 2 : value ----------
    const plotData = plots.map(p=>({ plot:p.id, crop:p.crop, treatment:p.treatment, zone:p.zone,
      farm:p.farm, profit:p.profit, roi:p.roi, benefit:p.benefit, spend:p.spend, ratio:p.ratio,
      yield:p.yld, density:p.density }));
    const byTreat = {};
    plotData.forEach(d=>{ (byTreat[d.treatment]=byTreat[d.treatment]||[]).push(d); });
    const treatments = Object.entries(byTreat).map(([t,arr])=>({
      treatment:t, n:arr.length, roi:mean(arr.map(d=>d.roi)),
      avgProfit:mean(arr.map(d=>d.profit)), avgBenefit:mean(arr.map(d=>d.benefit))
    })).sort((a,b)=>b.roi-a.roi);
    const presentCrops = META.crops.filter(c=>plotData.some(d=>d.crop===c));
    const presentZones = META.zones.filter(z=>plotData.some(d=>d.zone===z));
    const heat=[];
    presentCrops.forEach(c=>presentZones.forEach(z=>{
      const cell=plotData.filter(d=>d.crop===c&&d.zone===z);
      if(cell.length) heat.push({crop:c,zone:z,roi:mean(cell.map(d=>d.roi)),n:cell.length});
    }));
    const totalBenefit = plotData.reduce((a,d)=>a+d.benefit,0);
    const totalSpend = plotData.reduce((a,d)=>a+d.spend,0);
    const profitable = plotData.filter(d=>d.profit>0).length;
    const avgRoi = mean(plotData.map(d=>d.roi));
    const zeroBenefit = plotData.filter(d=>d.benefit<=0).length;
    const spent = plotData.filter(d=>d.spend>0);
    const bestPlot = spent.length ? spent.reduce((b,d)=>d.ratio>b.ratio?d:b) : {plot:'-',ratio:0,benefit:0,spend:0};
    const tab2 = { plotData, treatments, heat, crops:presentCrops, zones:presentZones,
      totalBenefit, totalSpend, profitable, total:plotData.length, avgRoi,
      bestPlot:{plot:bestPlot.plot,ratio:bestPlot.ratio,benefit:bestPlot.benefit,spend:bestPlot.spend},
      bestTreatment: treatments[0]||{treatment:'-',roi:0},
      worstTreatment: treatments[treatments.length-1]||{treatment:'-',roi:0},
      zeroBenefit };

    // ---------- TAB 3 : loan readiness ----------
    const W = CFG.weights;
    const subProfit = tab2.total ? profitable/tab2.total : 0;
    const respRate = tab1.respRate;
    const medianRatio = median(spent.map(d=>d.ratio));
    const subPrecROI = Math.min(1, medianRatio/CFG.ratioTarget);
    let dsum=0; plotData.forEach(d=>{const dev=Math.min(0,d.roi-avgRoi);dsum+=dev*dev;});
    const downStd = plotData.length? Math.sqrt(dsum/plotData.length) : 0;
    const downCV = avgRoi>0 ? downStd/avgRoi : 1;
    const subCons = Math.max(0, 1-downCV);
    const score = (W.profitability*subProfit + W.responsiveness*respRate
                 + W.precisionROI*subPrecROI + W.consistency*subCons);
    const loan = {
      weights:W, target:CFG.target, respRate, medianRatio, perAlertBenefit:CFG.perAlertBenefit,
      score,
      sub:{ profitability:subProfit, responsiveness:respRate, precisionROI:subPrecROI, consistency:subCons },
      details:{ profitable, total:tab2.total, avgRoi, zeroBenefit } };

    // ---------- filter label ----------
    const parts=[];
    if(f.farm.length) parts.push(f.farm.map(x=>x.replace('BC Harvest ','Farm ')).join('/'));
    if(f.crop.length) parts.push(f.crop.join('/'));
    if(f.treatment.length) parts.push(f.treatment.join('/'));
    if(f.zone.length) parts.push(f.zone.join('/'));
    const label = parts.join(' · ');

    return { tab1, tab2, loan, meta:META, n, filtered, label };
  }

  window.buildView = buildView;
})();
