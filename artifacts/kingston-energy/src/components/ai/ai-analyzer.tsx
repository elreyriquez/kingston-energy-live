import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Input, Label, Button } from '../ui/all';
import { Activity, Flame, Zap, Home, Leaf, AlertCircle } from 'lucide-react';
import { formatEnergy } from '@/lib/utils';
import { motion } from 'framer-motion';

const ENERGY_FACTORS = {
  organic: { kwh: 2.1, label: 'Organic' },
  paper: { kwh: 4.2, label: 'Paper' },
  plastic: { kwh: 8.8, label: 'Plastic' },
  metal: { kwh: 0.3, label: 'Metal' },
  other: { kwh: 1.5, label: 'Other' }
};

export function AiAnalyzer() {
  const [weight, setWeight] = useState(15000);
  const [comp, setComp] = useState({ organic: 45, paper: 20, plastic: 25, metal: 5, other: 5 });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSlider = (key: keyof typeof comp, value: number) => {
    setComp(prev => ({ ...prev, [key]: value }));
  };

  const analyze = () => {
    setIsAnalyzing(true);
    
    // Normalize percentages if they don't equal 100
    const total = Object.values(comp).reduce((a,b) => a+b, 0);
    const normalized = {
      organic: comp.organic / total,
      paper: comp.paper / total,
      plastic: comp.plastic / total,
      metal: comp.metal / total,
      other: comp.other / total,
    };

    setTimeout(() => {
      let totalKwh = 0;
      const breakdown: Record<string, {weight: number, kwh: number}> = {};

      Object.keys(normalized).forEach(k => {
        const key = k as keyof typeof comp;
        const w = weight * normalized[key];
        const e = w * ENERGY_FACTORS[key].kwh;
        totalKwh += e;
        breakdown[key] = { weight: w, kwh: e };
      });

      const bestMethod = normalized.organic > 0.4 ? 'Anaerobic Digestion' : 
                         normalized.plastic > 0.3 ? 'Incineration' : 'Gasification';

      setResult({
        totalKwh,
        electricity: totalKwh * 0.35, // 35% efficiency
        homes: Math.round((totalKwh * 0.35) / 30), // 30kWh per home per day
        co2Offset: weight * 0.4, // rough estimate kg offset
        method: bestMethod,
        breakdown
      });
      setIsAnalyzing(false);
    }, 800);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Activity className="w-5 h-5 text-primary" />
            Waste Composition Input
          </CardTitle>
          <p className="text-sm text-muted-foreground">Adjust expected waste loads to calculate energy potential.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Total Estimated Weight (kg)</Label>
            <Input 
              type="number" 
              value={weight} 
              onChange={e => setWeight(Number(e.target.value))}
              className="text-lg font-mono"
            />
          </div>

          <div className="space-y-4 pt-2">
            <Label>Composition Mix</Label>
            {Object.entries(comp).map(([key, val]) => (
              <div key={key} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="capitalize text-muted-foreground">{key}</span>
                  <span className="font-mono">{val}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={val} 
                  onChange={e => handleSlider(key as keyof typeof comp, Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            ))}
            
            <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t border-border">
              <span>Total sum (will auto-normalize):</span>
              <span className={Object.values(comp).reduce((a,b)=>a+b,0) !== 100 ? "text-amber-500 font-bold" : ""}>
                {Object.values(comp).reduce((a,b)=>a+b,0)}%
              </span>
            </div>
          </div>

          <Button onClick={analyze} disabled={isAnalyzing} className="w-full">
            {isAnalyzing ? "Processing Matrix..." : "Calculate Energy Output"}
            <Zap className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      {result ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="border-primary/30 bg-primary/5 h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl text-primary">
                <Flame className="w-5 h-5" />
                Projection Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card border border-border p-4 rounded-xl">
                  <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1"><Zap className="w-3 h-3"/> Chemical Energy</div>
                  <div className="text-2xl font-bold font-mono text-foreground">{formatEnergy(result.totalKwh)}</div>
                </div>
                <div className="bg-card border border-border p-4 rounded-xl">
                  <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1"><Zap className="w-3 h-3"/> Usable Electricity</div>
                  <div className="text-2xl font-bold font-mono text-primary">{formatEnergy(result.electricity)}</div>
                </div>
                <div className="bg-card border border-border p-4 rounded-xl">
                  <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1"><Home className="w-3 h-3"/> Homes Powered (24h)</div>
                  <div className="text-2xl font-bold font-mono text-amber-500">{result.homes.toLocaleString()}</div>
                </div>
                <div className="bg-card border border-border p-4 rounded-xl">
                  <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1"><Leaf className="w-3 h-3"/> CO2 Offset</div>
                  <div className="text-2xl font-bold font-mono text-emerald-400">{Math.round(result.co2Offset).toLocaleString()} kg</div>
                </div>
              </div>

              <div className="bg-card border border-border p-4 rounded-xl flex gap-3">
                <AlertCircle className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <h4 className="font-bold text-sm mb-1 text-primary">Recommended Processing: {result.method}</h4>
                  <p className="text-xs text-muted-foreground">Based on the high ratio of specific materials, this method yields the maximum thermodynamic efficiency for the given matrix.</p>
                </div>
              </div>

            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <Card className="border-dashed border-2 flex items-center justify-center bg-transparent">
          <div className="text-center p-6 text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>Input parameters and calculate to see energy yield projections.</p>
          </div>
        </Card>
      )}
    </div>
  );
}
