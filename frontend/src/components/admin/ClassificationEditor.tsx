/**
 * Classification Editor - Inline editor for item classification fields
 * Allows admin to modify content_type, category, tasks, scene, educational_value
 */
import { useState } from 'react';
import { Save, RotateCcw, Loader2, Lock } from 'lucide-react';
import type { GalleryItem, ContentType, ApplicationCategory, DeploymentMaturity } from '../../types/gallery';
import {
  CONTENT_TYPE_INFO,
  CATEGORY_INFO,
  SCENE_INFO,
  SPECIFIC_TASK_INFO,
  EDUCATIONAL_VALUE_INFO,
} from '../../types/gallery';

interface ClassificationEditorProps {
  item: GalleryItem;
  onSave: (updates: ClassificationUpdate) => Promise<boolean>;
  compact?: boolean;
}

export interface ClassificationUpdate {
  content_type?: ContentType;
  application_category?: ApplicationCategory;
  deployment_maturity?: DeploymentMaturity;
  specific_tasks?: string[];
  scene_type?: string | null;
  educational_value?: number;
  ai_summary?: string;
}

const ALL_CONTENT_TYPES = Object.keys(CONTENT_TYPE_INFO) as ContentType[];
const ALL_CATEGORIES = Object.keys(CATEGORY_INFO) as ApplicationCategory[];
const ALL_SCENES = Object.keys(SCENE_INFO);
const ALL_DEPLOYMENT = ['production', 'pilot', 'prototype', 'concept', 'unknown'] as DeploymentMaturity[];

export default function ClassificationEditor({ item, onSave, compact = false }: ClassificationEditorProps) {
  const [contentType, setContentType] = useState<ContentType>(item.content_type);
  const [category, setCategory] = useState<ApplicationCategory>(item.application_category);
  const [maturity, setMaturity] = useState<DeploymentMaturity>(item.deployment_maturity || 'unknown');
  const [tasks, setTasks] = useState<string[]>(item.specific_tasks || []);
  const [sceneType, setSceneType] = useState<string | null>(item.scene_type || null);
  const [eduValue, setEduValue] = useState<number>(item.educational_value || 3);
  const [summary, setSummary] = useState<string>(item.ai_summary || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const hasChanges =
    contentType !== item.content_type ||
    category !== item.application_category ||
    maturity !== (item.deployment_maturity || 'unknown') ||
    JSON.stringify(tasks) !== JSON.stringify(item.specific_tasks || []) ||
    sceneType !== (item.scene_type || null) ||
    eduValue !== (item.educational_value || 3) ||
    summary !== (item.ai_summary || '');

  const handleSave = async () => {
    setSaving(true);
    const updates: ClassificationUpdate = {};

    if (contentType !== item.content_type) updates.content_type = contentType;
    if (category !== item.application_category) updates.application_category = category;
    if (maturity !== (item.deployment_maturity || 'unknown')) updates.deployment_maturity = maturity;
    if (JSON.stringify(tasks) !== JSON.stringify(item.specific_tasks || [])) updates.specific_tasks = tasks;
    if (sceneType !== (item.scene_type || null)) updates.scene_type = sceneType;
    if (eduValue !== (item.educational_value || 3)) updates.educational_value = eduValue;
    if (summary !== (item.ai_summary || '')) updates.ai_summary = summary;

    const success = await onSave(updates);
    setSaving(false);
    if (success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleReset = () => {
    setContentType(item.content_type);
    setCategory(item.application_category);
    setMaturity(item.deployment_maturity || 'unknown');
    setTasks(item.specific_tasks || []);
    setSceneType(item.scene_type || null);
    setEduValue(item.educational_value || 3);
    setSummary(item.ai_summary || '');
  };

  // Get tasks relevant to current category
  const relevantTasks = Object.entries(SPECIFIC_TASK_INFO)
    .filter(([, info]) => info.category === category || tasks.includes(info.label.toLowerCase().replace(/ /g, '_')))
    .map(([key]) => key);

  // All task keys for the dropdown
  const allTaskKeys = Object.keys(SPECIFIC_TASK_INFO);

  const toggleTask = (task: string) => {
    setTasks(prev =>
      prev.includes(task) ? prev.filter(t => t !== task) : [...prev, task].slice(0, 5)
    );
  };

  if (compact) {
    return (
      <div className="space-y-3">
        {/* Compact: content_type + category + edu_value in one row */}
        <div className="flex gap-2 flex-wrap">
          <select
            value={contentType}
            onChange={e => setContentType(e.target.value as ContentType)}
            className="px-2 py-1 text-xs border rounded bg-white"
          >
            {ALL_CONTENT_TYPES.map(ct => (
              <option key={ct} value={ct}>{CONTENT_TYPE_INFO[ct].icon} {CONTENT_TYPE_INFO[ct].label}</option>
            ))}
          </select>
          <select
            value={category}
            onChange={e => setCategory(e.target.value as ApplicationCategory)}
            className="px-2 py-1 text-xs border rounded bg-white"
          >
            {ALL_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{CATEGORY_INFO[cat].icon} {CATEGORY_INFO[cat].label}</option>
            ))}
          </select>
          <select
            value={eduValue}
            onChange={e => setEduValue(Number(e.target.value))}
            className="px-2 py-1 text-xs border rounded bg-white"
          >
            {[5,4,3,2,1].map(v => (
              <option key={v} value={v}>{EDUCATIONAL_VALUE_INFO[v].stars} {EDUCATIONAL_VALUE_INFO[v].label}</option>
            ))}
          </select>
          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Save
            </button>
          )}
          {saved && <span className="text-xs text-green-600 py-1">Saved</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <Lock className="w-4 h-4 text-gray-400" />
          Classification Editor
        </h4>
        <span className="font-mono text-xs text-gray-400">#{item.id.slice(0, 8)}</span>
      </div>

      {/* Content Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
        <select
          value={contentType}
          onChange={e => setContentType(e.target.value as ContentType)}
          className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
        >
          {ALL_CONTENT_TYPES.map(ct => (
            <option key={ct} value={ct}>{CONTENT_TYPE_INFO[ct].icon} {CONTENT_TYPE_INFO[ct].label} — {CONTENT_TYPE_INFO[ct].description}</option>
          ))}
        </select>
      </div>

      {/* Category + Maturity row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Application Category</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value as ApplicationCategory)}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
          >
            {ALL_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{CATEGORY_INFO[cat].icon} {CATEGORY_INFO[cat].label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deployment Maturity</label>
          <select
            value={maturity}
            onChange={e => setMaturity(e.target.value as DeploymentMaturity)}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
          >
            {ALL_DEPLOYMENT.map(dm => (
              <option key={dm} value={dm}>{dm.charAt(0).toUpperCase() + dm.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Scene Type + Educational Value row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Scene Type</label>
          <select
            value={sceneType || ''}
            onChange={e => setSceneType(e.target.value || null)}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
          >
            <option value="">None</option>
            {ALL_SCENES.map(s => (
              <option key={s} value={s}>{SCENE_INFO[s].label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Educational Value</label>
          <select
            value={eduValue}
            onChange={e => setEduValue(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
          >
            {[5,4,3,2,1].map(v => (
              <option key={v} value={v}>{EDUCATIONAL_VALUE_INFO[v].stars} {EDUCATIONAL_VALUE_INFO[v].label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Specific Tasks */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Specific Tasks <span className="text-gray-400 font-normal">(click to toggle, max 5)</span>
        </label>
        {/* Selected tasks */}
        {tasks.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {tasks.map(t => (
              <button
                key={t}
                onClick={() => toggleTask(t)}
                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 hover:line-through"
              >
                {SPECIFIC_TASK_INFO[t]?.label || t.replace(/_/g, ' ')} ×
              </button>
            ))}
          </div>
        )}
        {/* Category-relevant tasks */}
        <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto border rounded p-2 bg-gray-50">
          {(relevantTasks.length > 0 ? relevantTasks : allTaskKeys.slice(0, 20)).map(t => (
            <button
              key={t}
              onClick={() => toggleTask(t)}
              className={`px-2 py-0.5 text-xs rounded transition-colors ${
                tasks.includes(t)
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border text-gray-600 hover:bg-blue-50'
              }`}
            >
              {SPECIFIC_TASK_INFO[t]?.label || t.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* AI Summary */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">AI Summary</label>
        <textarea
          value={summary}
          onChange={e => setSummary(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
          rows={2}
          placeholder="Brief summary of this content..."
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t">
        <button
          onClick={handleReset}
          disabled={!hasChanges}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-30"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
        <div className="flex items-center gap-2">
          {saved && <span className="text-sm text-green-600">Saved successfully</span>}
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
