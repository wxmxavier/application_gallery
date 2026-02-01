import { useEffect, useState } from 'react';
import { X, ExternalLink, Eye, Calendar, Clock, ArrowRight, CheckCircle, Target, TrendingUp } from 'lucide-react';
import type { GalleryItem } from '../types/gallery';
import { CATEGORY_INFO, SCENE_INFO, CONTENT_TYPE_INFO, EDUCATIONAL_VALUE_INFO } from '../types/gallery';
import { incrementViewCount, getRelatedItems } from '../services/gallery-service';
import GalleryCard from './GalleryCard';

interface GalleryDetailModalProps {
  item: GalleryItem;
  onClose: () => void;
}

export default function GalleryDetailModal({ item, onClose }: GalleryDetailModalProps) {
  const [relatedItems, setRelatedItems] = useState<GalleryItem[]>([]);

  const categoryInfo = CATEGORY_INFO[item.application_category];
  const sceneInfo = item.scene_type ? SCENE_INFO[item.scene_type] : null;
  const contentTypeInfo = item.content_type ? CONTENT_TYPE_INFO[item.content_type] : null;
  const educationalInfo = item.educational_value ? EDUCATIONAL_VALUE_INFO[item.educational_value] : null;

  // Increment view count and fetch related items
  useEffect(() => {
    incrementViewCount(item.id);
    getRelatedItems(item, 4).then(setRelatedItems);
  }, [item]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Format duration
  const formatDuration = (seconds?: number) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format deployment scale
  const formatDeploymentScale = (scale?: string) => {
    const scaleLabels: Record<string, string> = {
      single_unit: 'Single Unit',
      small_fleet: 'Small Fleet (2-10)',
      large_fleet: 'Large Fleet (10+)',
      facility_wide: 'Facility-Wide',
      multi_site: 'Multi-Site'
    };
    return scale ? scaleLabels[scale] || scale.replace(/_/g, ' ') : null;
  };

  // Format problem solved
  const formatProblemSolved = (problem?: string) => {
    const problemLabels: Record<string, string> = {
      labor_shortage: 'Labor Shortage',
      safety_hazard: 'Safety Hazard Reduction',
      quality_consistency: 'Quality Consistency',
      cost_reduction: 'Cost Reduction',
      throughput: 'Throughput Improvement',
      '24x7_operation': '24/7 Operation',
      hazardous_environment: 'Hazardous Environment'
    };
    return problem ? problemLabels[problem] || problem.replace(/_/g, ' ') : null;
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-start z-10">
          <div className="flex-1 pr-4">
            {/* Content Type & Educational Value Badges */}
            <div className="flex items-center gap-2 mb-2">
              {contentTypeInfo && (
                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded border ${contentTypeInfo.color}`}>
                  {contentTypeInfo.icon} {contentTypeInfo.label}
                </span>
              )}
              {educationalInfo && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-yellow-50 text-yellow-700 border border-yellow-200" title={`Educational Value: ${educationalInfo.label}`}>
                  {educationalInfo.stars}
                </span>
              )}
              {item.deployment_maturity && item.deployment_maturity !== 'unknown' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-gray-100 text-gray-600">
                  {item.deployment_maturity === 'production' ? '🚀' : item.deployment_maturity === 'pilot' ? '🧪' : '🔬'}
                  {item.deployment_maturity.charAt(0).toUpperCase() + item.deployment_maturity.slice(1)}
                </span>
              )}
            </div>
            <h2 className="text-xl font-semibold text-gray-900 line-clamp-2">
              {item.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Media Player */}
          <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-6">
            {item.media_type === 'video' && item.content_url ? (
              <iframe
                src={item.content_url}
                title={item.title}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            ) : item.thumbnail_url ? (
              <img
                src={item.thumbnail_url}
                alt={item.title}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                No preview available
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              {item.description && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600 whitespace-pre-line">{item.description}</p>
                </div>
              )}

              {/* AI Summary */}
              {item.ai_summary && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">AI Summary</h3>
                  <p className="text-blue-800">{item.ai_summary}</p>
                </div>
              )}

              {/* Application Context (V2) */}
              {item.application_context && (Object.keys(item.application_context).length > 0) && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Application Context
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {item.application_context.problem_solved && (
                      <div>
                        <div className="text-purple-600 mb-1">Problem Solved</div>
                        <div className="text-purple-900 font-medium">
                          {formatProblemSolved(item.application_context.problem_solved)}
                        </div>
                      </div>
                    )}
                    {item.application_context.deployment_scale && (
                      <div>
                        <div className="text-purple-600 mb-1">Deployment Scale</div>
                        <div className="text-purple-900 font-medium">
                          {formatDeploymentScale(item.application_context.deployment_scale)}
                        </div>
                      </div>
                    )}
                    {item.application_context.customer_identified && (
                      <div className="flex items-center gap-2 text-purple-800">
                        <CheckCircle className="w-4 h-4 text-purple-600" />
                        Customer Identified
                      </div>
                    )}
                    {item.application_context.has_metrics && (
                      <div className="flex items-center gap-2 text-purple-800">
                        <TrendingUp className="w-4 h-4 text-purple-600" />
                        Results/Metrics Included
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Source Link */}
              <a
                href={item.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="w-4 h-4" />
                View original on {item.source_name}
              </a>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Application Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Application Details</h3>

                {/* Category */}
                <div className="mb-4">
                  <div className="text-sm text-gray-500 mb-1">Category</div>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${categoryInfo.color}`}>
                    {categoryInfo.icon} {categoryInfo.label}
                  </span>
                </div>

                {/* Scene Type */}
                {sceneInfo && (
                  <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-1">Scene Type</div>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-700">
                      {sceneInfo.label}
                    </span>
                  </div>
                )}

                {/* Specific Tasks (V2) */}
                {item.specific_tasks && item.specific_tasks.length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-1">Specific Tasks</div>
                    <div className="flex flex-wrap gap-1">
                      {item.specific_tasks.map((task) => (
                        <span
                          key={task}
                          className="px-2 py-1 bg-indigo-100 text-indigo-700 text-sm rounded"
                        >
                          {task.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Task Types (fallback) */}
                {(!item.specific_tasks || item.specific_tasks.length === 0) && item.task_types && item.task_types.length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-1">Tasks Demonstrated</div>
                    <div className="flex flex-wrap gap-1">
                      {item.task_types.map((task) => (
                        <span
                          key={task}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded"
                        >
                          {task.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Functional Requirements */}
                {item.functional_requirements && item.functional_requirements.length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-1">Functional Requirements</div>
                    <div className="flex flex-wrap gap-1">
                      {item.functional_requirements.map((req) => (
                        <span
                          key={req}
                          className="px-2 py-1 bg-green-100 text-green-700 text-sm rounded"
                        >
                          {req.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Environment */}
                {item.environment_setting && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Environment</div>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700">
                      {item.environment_setting}
                    </span>
                  </div>
                )}
              </div>

              {/* RSIP Configuration Hints */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">
                  Build Similar in RSIP
                </h3>
                <ul className="text-sm text-green-800 space-y-2">
                  <li className="flex items-start gap-2">
                    <span>1.</span>
                    <span>Select "{categoryInfo.label}" category</span>
                  </li>
                  {(item.specific_tasks?.[0] || item.task_types?.[0]) && (
                    <li className="flex items-start gap-2">
                      <span>2.</span>
                      <span>Choose "{(item.specific_tasks?.[0] || item.task_types?.[0]).replace(/_/g, ' ')}" task</span>
                    </li>
                  )}
                  {item.functional_requirements?.[0] && (
                    <li className="flex items-start gap-2">
                      <span>3.</span>
                      <span>Enable "{item.functional_requirements[0].replace(/_/g, ' ')}"</span>
                    </li>
                  )}
                </ul>
                <a
                  href="https://rsip-platform.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-sm text-green-700 hover:text-green-900"
                >
                  Open in RSIP <ArrowRight className="w-4 h-4" />
                </a>
              </div>

              {/* Metadata */}
              <div className="text-sm text-gray-500 space-y-2">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  {item.view_count} views
                </div>
                {item.duration_seconds && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {formatDuration(item.duration_seconds)}
                  </div>
                )}
                {item.published_at && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(item.published_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Related Items */}
          {relatedItems.length > 0 && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Similar Applications</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relatedItems.map((related) => (
                  <GalleryCard
                    key={related.id}
                    item={related}
                    onClick={() => {
                      // Navigate to related item
                      window.location.reload(); // Simple reload for now
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
