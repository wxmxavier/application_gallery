/**
 * Add Content By URL - Admin tool to manually add content from a URL
 * Fetches YouTube metadata via oEmbed, allows editing before saving
 */
import { useState } from 'react';
import { Link, Loader2, CheckCircle, AlertTriangle, Plus, ExternalLink } from 'lucide-react';
import ClassificationEditor, { type ClassificationUpdate } from './ClassificationEditor';
import type { GalleryItem } from '../../types/gallery';
import { addContentByUrl, updateClassification } from '../../services/moderation-service';

type AddStep = 'input' | 'preview' | 'saved';

export default function AddContentByUrl() {
  const [url, setUrl] = useState('');
  const [step, setStep] = useState<AddStep>('input');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<GalleryItem | null>(null);

  const detectPlatform = (inputUrl: string): string => {
    if (inputUrl.includes('youtube.com') || inputUrl.includes('youtu.be')) return 'YouTube';
    if (inputUrl.includes('tiktok.com')) return 'TikTok';
    if (inputUrl.includes('linkedin.com')) return 'LinkedIn';
    if (inputUrl.includes('twitter.com') || inputUrl.includes('x.com')) return 'X/Twitter';
    if (inputUrl.includes('instagram.com')) return 'Instagram';
    if (inputUrl.includes('facebook.com')) return 'Facebook';
    return 'Website';
  };

  const handleFetch = async () => {
    if (!url.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await addContentByUrl(url.trim());
      if (result.error) {
        setError(result.error);
      } else if (result.item) {
        setPreviewItem(result.item);
        setStep('preview');
      }
    } catch (err) {
      setError('Failed to fetch content. Please check the URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClassification = async (updates: ClassificationUpdate): Promise<boolean> => {
    if (!previewItem) return false;
    const result = await updateClassification(previewItem.id, updates);
    if (result.success) {
      setPreviewItem(prev => prev ? { ...prev, ...updates } as GalleryItem : null);
    }
    return result.success;
  };

  const handleDone = () => {
    setUrl('');
    setStep('input');
    setPreviewItem(null);
    setError(null);
  };

  const handleAddAnother = () => {
    setUrl('');
    setStep('input');
    setPreviewItem(null);
    setError(null);
  };

  const platform = url ? detectPlatform(url) : null;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <Plus className="w-5 h-5 text-blue-600" />
          Add Content by URL
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          Paste a YouTube video URL, article link, or social media post to add it to the gallery.
        </p>

        {step === 'input' && (
          <div className="space-y-4">
            {/* URL Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content URL</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onKeyDown={e => e.key === 'Enter' && handleFetch()}
                  />
                </div>
                <button
                  onClick={handleFetch}
                  disabled={!url.trim() || loading}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Fetch & Classify
                </button>
              </div>
              {platform && (
                <p className="text-xs text-gray-400 mt-1">
                  Detected platform: <span className="font-medium text-gray-600">{platform}</span>
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Supported Platforms */}
            <div className="text-xs text-gray-400">
              <p className="mb-1">Supported platforms:</p>
              <div className="flex flex-wrap gap-2">
                {['YouTube', 'TikTok', 'LinkedIn', 'X/Twitter', 'Instagram', 'Facebook', 'Any article URL'].map(p => (
                  <span key={p} className="px-2 py-0.5 bg-gray-100 rounded">{p}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 'preview' && previewItem && (
          <div className="space-y-4">
            {/* Success banner */}
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              <CheckCircle className="w-4 h-4" />
              Content added to gallery. You can adjust the classification below.
            </div>

            {/* Preview card */}
            <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
              {previewItem.thumbnail_url && (
                <img
                  src={previewItem.thumbnail_url}
                  alt=""
                  className="w-40 h-24 object-cover rounded flex-shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-gray-900 text-sm line-clamp-2">{previewItem.title}</h4>
                <p className="text-xs text-gray-500 mt-1">{previewItem.source_name}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="font-mono text-[10px] text-gray-400">#{previewItem.id.slice(0, 8)}</span>
                  <a
                    href={previewItem.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View original
                  </a>
                </div>
              </div>
            </div>

            {/* Classification Editor */}
            <ClassificationEditor
              item={previewItem}
              onSave={handleSaveClassification}
            />

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={handleAddAnother}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Add Another
              </button>
              <button
                onClick={handleDone}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
