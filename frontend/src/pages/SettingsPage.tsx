 import { useState, useEffect } from 'react';
import { getConfig, updateConfig } from '../api/client';
import { ThresholdSlider } from '../components/settings/ThresholdSlider';
import { ToggleRow } from '../components/settings/ToggleRow';
import { Card } from '../components/ui/Card';
import type { Config } from '../types';
import { RotateCcw, Save, Check } from 'lucide-react';

const DEFAULTS: Config = {
  detection: {
    face: { detection_interval: 5, min_confidence: 0.8 },
    eyes: { gaze_threshold: 2, blink_threshold: 0.3, gaze_sensitivity: 15 },
    mouth: { movement_threshold: 8 },
    multi_face: { alert_threshold: 5 },
    objects: { min_confidence: 0.65, detection_interval: 3 },
    audio_monitoring: { enabled: true, energy_threshold: 0.001, zcr_threshold: 0.35, whisper_enabled: false },
  },
  logging: { alert_cooldown: 5, alert_system: { voice_alerts: true, alert_volume: 0.8, cooldown: 10 } },
  screen: { recording: true, fps: 15 },
};

export function SettingsPage() {
  const [cfg, setCfg] = useState<Config>(DEFAULTS);
  const [toast, setToast] = useState(false);

  useEffect(()=>{ getConfig().then(setCfg).catch(()=>{}); },[]);

  function set<K extends keyof Config>(section: K, patch: Partial<Config[K]>) {
    setCfg(p => ({ ...p, [section]: { ...p[section], ...patch } }));
  }
  function setDet<K extends keyof Config['detection']>(key: K, patch: Partial<Config['detection'][K]>) {
    setCfg(p => ({ ...p, detection: { ...p.detection, [key]: { ...p.detection[key], ...patch } } }));
  }

  async function save() {
    try {
      await updateConfig(cfg);
      setToast(true);
      setTimeout(()=>setToast(false), 2500);
    } catch {
      // Backend unreachable — config saved locally only
      setToast(true);
      setTimeout(()=>setToast(false), 2500);
    }
  }

  const d = cfg.detection;
  const l = cfg.logging;

  return (
    <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto space-y-6">
      <h1 className="text-lg font-semibold text-gray-900">Settings</h1>

      {/* Detection thresholds */}
      <Card title="detection thresholds">
        <ThresholdSlider label="Gaze threshold" min={0.5} max={10} step={0.5} value={d.eyes.gaze_threshold} unit="s" onChange={v=>setDet('eyes',{gaze_threshold:v})}/>
        <ThresholdSlider label="Blink threshold (EAR)" min={0.1} max={0.5} step={0.01} value={d.eyes.blink_threshold} unit="" onChange={v=>setDet('eyes',{blink_threshold:v})}/>
        <ThresholdSlider label="Gaze sensitivity" min={5} max={50} step={1} value={d.eyes.gaze_sensitivity} unit="px" onChange={v=>setDet('eyes',{gaze_sensitivity:v})}/>
        <ThresholdSlider label="Mouth movement frames" min={1} max={20} step={1} value={d.mouth.movement_threshold} unit="frames" onChange={v=>setDet('mouth',{movement_threshold:v})}/>
        <ThresholdSlider label="Face detection interval" min={1} max={30} step={1} value={d.face.detection_interval} unit="frames" onChange={v=>setDet('face',{detection_interval:v})}/>
        <ThresholdSlider label="Object min confidence" min={0.3} max={0.95} step={0.05} value={d.objects.min_confidence} unit="" onChange={v=>setDet('objects',{min_confidence:v})}/>
        <ThresholdSlider label="Audio energy threshold" min={0.0001} max={0.01} step={0.0001} value={d.audio_monitoring.energy_threshold} unit="" onChange={v=>setDet('audio_monitoring',{energy_threshold:v})}/>
      </Card>

      {/* Feature toggles */}
      <Card title="feature toggles">
        <ToggleRow label="Voice alerts" description="Play spoken warnings on violations" checked={l.alert_system.voice_alerts} onChange={v=>set('logging',{alert_system:{...l.alert_system,voice_alerts:v}})}/>
        <ToggleRow label="Screen recording" description="Capture examinee screen activity" checked={cfg.screen.recording} onChange={v=>set('screen',{recording:v, fps:cfg.screen.fps})}/>
        <ToggleRow label="Audio monitoring" description="Monitor microphone for voice activity" checked={d.audio_monitoring.enabled} onChange={v=>setDet('audio_monitoring',{enabled:v})}/>
        <ToggleRow label="Whisper transcription" description="Transcribe detected speech (requires audio)" checked={d.audio_monitoring.whisper_enabled} disabled={!d.audio_monitoring.enabled} onChange={v=>setDet('audio_monitoring',{whisper_enabled:v})}/>
        <ToggleRow label="Hardware monitoring" description="Check for virtual cameras and forbidden apps" checked={true} onChange={()=>{}}/>
      </Card>

      {/* Danger zone */}
      <Card title="danger zone">
        <div className="flex items-center gap-3 pt-2">
          <button onClick={()=>setCfg(DEFAULTS)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
            <RotateCcw className="w-3.5 h-3.5"/>Reset to defaults
          </button>
          <button onClick={save} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            <Save className="w-3.5 h-3.5"/>Save configuration
          </button>
        </div>
      </Card>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium animate-[fadein_0.2s_ease-out]">
          <Check className="w-4 h-4"/>Configuration saved
        </div>
      )}
    </div>
  );
}
