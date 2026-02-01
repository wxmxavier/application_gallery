# Application Gallery Integration - Technical Specifications

## Overview

This document provides detailed technical specifications for integrating the Application Gallery (487 items: videos, images, articles) with the RSIP Demo Platform to help users understand real-world robotics applications during their configuration journey.

---

## Proposal 1: "Inspiration Mode" - Gallery at Entrance

### 1.1 Purpose
Allow users to explore real-world robotics applications **before** starting configuration, providing inspiration and reducing "blank canvas" anxiety.

### 1.2 User Flow
```
User authenticates → SceneDefinitionMain loads →
NEW: "How would you like to start?" dialog appears →
  Option A: "Start from scratch" → Normal flow
  Option B: "Browse real examples first" → Gallery overlay →
    User browses/filters gallery → Selects example →
    "Use this configuration" → Pre-fills RSIP settings
```

### 1.3 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        RSIP Demo Platform                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           NEW: StartMethodSelector Component              │   │
│  │  ┌─────────────────────┐  ┌─────────────────────────┐    │   │
│  │  │  Start from Scratch │  │  Browse Examples First  │    │   │
│  │  │  (Quick Setup)      │  │  (Recommended)          │    │   │
│  │  └─────────────────────┘  └─────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           NEW: GalleryBrowserModal Component              │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  Search: [_______________] [Filter ▼]              │  │   │
│  │  ├────────────────────────────────────────────────────┤  │   │
│  │  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │  │   │
│  │  │  │ 📹  │ │ 📷  │ │ 📹  │ │ 📷  │ │ 📹  │ │ 📷  │  │  │   │
│  │  │  │Card1│ │Card2│ │Card3│ │Card4│ │Card5│ │Card6│  │  │   │
│  │  │  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘  │  │   │
│  │  ├────────────────────────────────────────────────────┤  │   │
│  │  │  [Load More...]                                    │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.4 New Components

#### 1.4.1 StartMethodSelector
**File:** `/demo/src/components/scene-definition/StartMethodSelector.tsx`

```typescript
// StartMethodSelector.tsx
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, FileText, Play, Image } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface StartMethodSelectorProps {
  isOpen: boolean;
  onStartFromScratch: () => void;
  onBrowseExamples: () => void;
}

export const StartMethodSelector: React.FC<StartMethodSelectorProps> = ({
  isOpen,
  onStartFromScratch,
  onBrowseExamples,
}) => {
  const { t } = useLanguage();

  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-2xl">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {t('gallery.welcomeTitle')}
          </h2>
          <p className="text-gray-600 mt-2">
            {t('gallery.welcomeSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Option A: Start from Scratch */}
          <Card
            className="cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all"
            onClick={onStartFromScratch}
          >
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <FileText className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">
                {t('gallery.startFromScratch')}
              </h3>
              <p className="text-sm text-gray-500">
                {t('gallery.startFromScratchDesc')}
              </p>
            </CardContent>
          </Card>

          {/* Option B: Browse Examples (Recommended) */}
          <Card
            className="cursor-pointer hover:shadow-lg hover:border-green-300 transition-all border-2 border-green-200 bg-green-50"
            onClick={onBrowseExamples}
          >
            <CardContent className="p-6 text-center">
              <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                {t('gallery.recommended')}
              </div>
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">
                {t('gallery.browseExamples')}
              </h3>
              <p className="text-sm text-gray-500">
                {t('gallery.browseExamplesDesc')}
              </p>
              <div className="flex justify-center gap-2 mt-3">
                <span className="inline-flex items-center text-xs text-gray-500">
                  <Play className="w-3 h-3 mr-1" /> 123 videos
                </span>
                <span className="inline-flex items-center text-xs text-gray-500">
                  <Image className="w-3 h-3 mr-1" /> 194 images
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          {t('gallery.canBrowseLater')}
        </p>
      </DialogContent>
    </Dialog>
  );
};
```

#### 1.4.2 GalleryBrowserModal
**File:** `/demo/src/components/gallery/GalleryBrowserModal.tsx`

```typescript
// GalleryBrowserModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, X, Play, Image, FileText, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { galleryService, GalleryItem, GalleryFilters, ApplicationCategory } from '@/services/gallery-service';
import { GalleryCard } from './GalleryCard';
import { GalleryDetailPanel } from './GalleryDetailPanel';

interface GalleryBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExample: (item: GalleryItem, config: RSIPConfiguration) => void;
}

export const GalleryBrowserModal: React.FC<GalleryBrowserModalProps> = ({
  isOpen,
  onClose,
  onSelectExample,
}) => {
  const { t, language } = useLanguage();

  // State
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ApplicationCategory | 'all'>('all');
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Categories with counts
  const categories = [
    { key: 'all', label: t('gallery.allCategories'), icon: '🌐' },
    { key: 'industrial_automation', label: t('gallery.industrial'), icon: '🏭' },
    { key: 'service_robotics', label: t('gallery.service'), icon: '🤖' },
    { key: 'surveillance_security', label: t('gallery.security'), icon: '🛡️' },
  ];

  // Fetch items
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const filters: GalleryFilters = {};
      if (activeCategory !== 'all') {
        filters.category = activeCategory as ApplicationCategory;
      }
      if (searchQuery) {
        filters.search = searchQuery;
      }

      const response = await galleryService.getItems(filters, 24);
      setItems(response.data);
      setTotalCount(response.count);
    } catch (error) {
      console.error('Failed to fetch gallery items:', error);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, searchQuery]);

  useEffect(() => {
    if (isOpen) {
      fetchItems();
    }
  }, [isOpen, fetchItems]);

  // Handle using an example
  const handleUseExample = (item: GalleryItem) => {
    // Map gallery item to RSIP configuration
    const config: RSIPConfiguration = {
      environmentType: mapSceneTypeToEnvironment(item.scene_type),
      primaryTasks: item.task_types.slice(0, 3),
      functionalRequirements: item.functional_requirements,
      intelligenceLevel: inferIntelligenceLevel(item.functional_requirements),
      // Additional mappings...
    };

    onSelectExample(item, config);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <div className="flex h-[85vh]">
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <DialogHeader className="p-4 border-b">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl">
                  {t('gallery.browseRealApplications')}
                </DialogTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {totalCount} {t('gallery.examples')}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="flex gap-2 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder={t('gallery.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  {t('gallery.filters')}
                </Button>
              </div>
            </DialogHeader>

            {/* Category Tabs */}
            <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as any)} className="flex-1 flex flex-col">
              <TabsList className="w-full justify-start px-4 py-2 bg-gray-50 border-b">
                {categories.map((cat) => (
                  <TabsTrigger key={cat.key} value={cat.key} className="gap-2">
                    <span>{cat.icon}</span>
                    {cat.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value={activeCategory} className="flex-1 mt-0">
                <ScrollArea className="h-full p-4">
                  {loading ? (
                    <div className="flex items-center justify-center h-64">
                      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                    </div>
                  ) : items.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      {t('gallery.noResults')}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-4">
                      {items.map((item) => (
                        <GalleryCard
                          key={item.id}
                          item={item}
                          language={language}
                          onClick={() => setSelectedItem(item)}
                          isSelected={selectedItem?.id === item.id}
                        />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>

          {/* Detail Panel (Right Side) */}
          {selectedItem && (
            <GalleryDetailPanel
              item={selectedItem}
              language={language}
              onClose={() => setSelectedItem(null)}
              onUseExample={() => handleUseExample(selectedItem)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

#### 1.4.3 GalleryCard (Compact Version)
**File:** `/demo/src/components/gallery/GalleryCard.tsx`

```typescript
// GalleryCard.tsx
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Image, FileText, Eye } from 'lucide-react';
import { GalleryItem } from '@/services/gallery-service';
import { CATEGORY_INFO, SCENE_INFO } from '@/types/gallery';

interface GalleryCardProps {
  item: GalleryItem;
  language: 'en' | 'zh';
  onClick: () => void;
  isSelected?: boolean;
}

export const GalleryCard: React.FC<GalleryCardProps> = ({
  item,
  language,
  onClick,
  isSelected,
}) => {
  const title = language === 'zh' && item.title_zh ? item.title_zh : item.title;
  const categoryInfo = CATEGORY_INFO[item.application_category];
  const sceneInfo = item.scene_type ? SCENE_INFO[item.scene_type] : null;

  const MediaIcon = {
    video: Play,
    image: Image,
    article: FileText,
  }[item.media_type] || FileText;

  const formatDuration = (seconds?: number) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card
      className={`cursor-pointer overflow-hidden transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100">
        {item.thumbnail_url ? (
          <img
            src={item.thumbnail_url}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MediaIcon className="w-12 h-12 text-gray-300" />
          </div>
        )}

        {/* Media Type Badge */}
        <div className="absolute top-2 left-2">
          <Badge variant="secondary" className="bg-black/60 text-white text-xs">
            <MediaIcon className="w-3 h-3 mr-1" />
            {item.media_type}
          </Badge>
        </div>

        {/* Duration (for videos) */}
        {item.duration_seconds && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
            {formatDuration(item.duration_seconds)}
          </div>
        )}

        {/* Featured Badge */}
        {item.featured && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-yellow-500 text-white text-xs">Featured</Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-medium text-sm line-clamp-2 mb-2">{title}</h3>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Category */}
          <Badge variant="outline" className={`text-xs ${categoryInfo?.color || ''}`}>
            {categoryInfo?.icon} {language === 'zh' ? categoryInfo?.labelZh : categoryInfo?.label}
          </Badge>

          {/* Scene Type */}
          {sceneInfo && (
            <Badge variant="outline" className="text-xs">
              {sceneInfo.icon} {language === 'zh' ? sceneInfo.labelZh : sceneInfo.label}
            </Badge>
          )}
        </div>

        {/* Task Types */}
        {item.task_types.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {item.task_types.slice(0, 2).map((task) => (
              <span key={task} className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                {task}
              </span>
            ))}
            {item.task_types.length > 2 && (
              <span className="text-xs text-gray-400">+{item.task_types.length - 2}</span>
            )}
          </div>
        )}

        {/* View Count */}
        <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
          <Eye className="w-3 h-3" />
          {item.view_count.toLocaleString()} views
        </div>
      </div>
    </Card>
  );
};
```

#### 1.4.4 GalleryDetailPanel
**File:** `/demo/src/components/gallery/GalleryDetailPanel.tsx`

```typescript
// GalleryDetailPanel.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { X, ExternalLink, Play, CheckCircle2, ArrowRight } from 'lucide-react';
import { GalleryItem } from '@/services/gallery-service';
import { CATEGORY_INFO, SCENE_INFO } from '@/types/gallery';

interface GalleryDetailPanelProps {
  item: GalleryItem;
  language: 'en' | 'zh';
  onClose: () => void;
  onUseExample: () => void;
}

export const GalleryDetailPanel: React.FC<GalleryDetailPanelProps> = ({
  item,
  language,
  onClose,
  onUseExample,
}) => {
  const title = language === 'zh' && item.title_zh ? item.title_zh : item.title;
  const description = language === 'zh' && item.description_zh ? item.description_zh : item.description;
  const aiSummary = language === 'zh' && item.ai_summary_zh ? item.ai_summary_zh : item.ai_summary;
  const categoryInfo = CATEGORY_INFO[item.application_category];

  return (
    <div className="w-96 border-l bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-white flex items-center justify-between">
        <h3 className="font-semibold">Details</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Media Preview */}
          <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden">
            {item.thumbnail_url ? (
              <img src={item.thumbnail_url} alt={title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Play className="w-12 h-12 text-gray-400" />
              </div>
            )}
            {item.media_type === 'video' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/90"
                  onClick={() => window.open(item.content_url, '_blank')}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Watch Video
                </Button>
              </div>
            )}
          </div>

          {/* Title & Source */}
          <div>
            <h4 className="font-semibold text-lg">{title}</h4>
            <p className="text-sm text-gray-500 mt-1">
              Source: {item.source_name}
            </p>
          </div>

          {/* AI Summary */}
          {aiSummary && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
              <p className="text-sm text-blue-800">{aiSummary}</p>
            </div>
          )}

          <Separator />

          {/* Configuration Preview */}
          <div>
            <h5 className="font-medium text-sm mb-3">Configuration from this example:</h5>

            {/* Category */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-500 w-24">Category:</span>
              <Badge className={categoryInfo?.color}>
                {categoryInfo?.icon} {language === 'zh' ? categoryInfo?.labelZh : categoryInfo?.label}
              </Badge>
            </div>

            {/* Scene Type */}
            {item.scene_type && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-500 w-24">Scene:</span>
                <Badge variant="outline">{item.scene_type}</Badge>
              </div>
            )}

            {/* Tasks */}
            <div className="mb-2">
              <span className="text-sm text-gray-500">Tasks:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {item.task_types.map((task) => (
                  <Badge key={task} variant="secondary" className="text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" />
                    {task}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Requirements */}
            <div>
              <span className="text-sm text-gray-500">Requirements:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {item.functional_requirements.map((req) => (
                  <Badge key={req} variant="outline" className="text-xs">
                    {req}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Action Footer */}
      <div className="p-4 border-t bg-white space-y-2">
        <Button className="w-full" onClick={onUseExample}>
          Use This Configuration
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => window.open(item.source_url, '_blank')}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          View Original Source
        </Button>
      </div>
    </div>
  );
};
```

### 1.5 Gallery Service for Demo Platform
**File:** `/demo/src/services/gallery-service.ts`

```typescript
// gallery-service.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export type ApplicationCategory = 'industrial_automation' | 'service_robotics' | 'surveillance_security';
export type MediaType = 'video' | 'image' | 'article';

export interface GalleryItem {
  id: string;
  external_id: string;
  source_type: string;
  source_url: string;
  source_name: string;
  title: string;
  title_zh?: string;
  description?: string;
  description_zh?: string;
  media_type: MediaType;
  thumbnail_url?: string;
  content_url?: string;
  duration_seconds?: number;
  application_category: ApplicationCategory;
  task_types: string[];
  functional_requirements: string[];
  scene_type?: string;
  environment_setting?: string;
  ai_summary?: string;
  ai_summary_zh?: string;
  view_count: number;
  featured: boolean;
  published_at?: string;
  created_at: string;
}

export interface GalleryFilters {
  category?: ApplicationCategory;
  task_types?: string[];
  requirements?: string[];
  scene_type?: string;
  media_type?: MediaType;
  search?: string;
  featured?: boolean;
}

export interface GalleryResponse {
  data: GalleryItem[];
  count: number;
  error?: string;
}

class GalleryService {
  async getItems(
    filters: GalleryFilters = {},
    limit: number = 24,
    offset: number = 0
  ): Promise<GalleryResponse> {
    try {
      let query = supabase
        .from('application_gallery')
        .select('*', { count: 'exact' })
        .eq('status', 'approved')
        .order('featured', { ascending: false })
        .order('view_count', { ascending: false })
        .range(offset, offset + limit - 1);

      if (filters.category) {
        query = query.eq('application_category', filters.category);
      }
      if (filters.task_types?.length) {
        query = query.overlaps('task_types', filters.task_types);
      }
      if (filters.requirements?.length) {
        query = query.overlaps('functional_requirements', filters.requirements);
      }
      if (filters.scene_type) {
        query = query.eq('scene_type', filters.scene_type);
      }
      if (filters.media_type) {
        query = query.eq('media_type', filters.media_type);
      }
      if (filters.search) {
        query = query.textSearch('title', filters.search, { type: 'websearch' });
      }
      if (filters.featured) {
        query = query.eq('featured', true);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Gallery fetch error:', error);
        return { data: [], count: 0, error: error.message };
      }

      return { data: data as GalleryItem[], count: count || 0 };
    } catch (err) {
      console.error('Gallery service error:', err);
      return { data: [], count: 0, error: 'Failed to fetch gallery' };
    }
  }

  async getItem(id: string): Promise<GalleryItem | null> {
    const { data, error } = await supabase
      .from('application_gallery')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Gallery item fetch error:', error);
      return null;
    }

    return data as GalleryItem;
  }

  async getFeaturedItems(limit: number = 6): Promise<GalleryItem[]> {
    const { data, error } = await supabase
      .from('application_gallery')
      .select('*')
      .eq('status', 'approved')
      .eq('featured', true)
      .order('view_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Featured items fetch error:', error);
      return [];
    }

    return data as GalleryItem[];
  }

  async getRelatedItems(item: GalleryItem, limit: number = 4): Promise<GalleryItem[]> {
    const { data, error } = await supabase
      .from('application_gallery')
      .select('*')
      .eq('status', 'approved')
      .eq('application_category', item.application_category)
      .neq('id', item.id)
      .limit(limit);

    if (error) {
      console.error('Related items fetch error:', error);
      return [];
    }

    return data as GalleryItem[];
  }

  async incrementViewCount(itemId: string): Promise<void> {
    await supabase.rpc('increment_gallery_view', { item_id: itemId });
  }

  async getStatistics(): Promise<{ total: number; byCategory: Record<string, number>; byMedia: Record<string, number> }> {
    const { data, error } = await supabase
      .from('application_gallery')
      .select('application_category, media_type')
      .eq('status', 'approved');

    if (error || !data) {
      return { total: 0, byCategory: {}, byMedia: {} };
    }

    const byCategory: Record<string, number> = {};
    const byMedia: Record<string, number> = {};

    data.forEach((item) => {
      byCategory[item.application_category] = (byCategory[item.application_category] || 0) + 1;
      byMedia[item.media_type] = (byMedia[item.media_type] || 0) + 1;
    });

    return { total: data.length, byCategory, byMedia };
  }
}

export const galleryService = new GalleryService();
```

### 1.6 Translation Keys
**Add to:** `/demo/src/contexts/LanguageContext.tsx` translations

```typescript
// English
gallery: {
  welcomeTitle: 'How would you like to start?',
  welcomeSubtitle: 'Choose your preferred way to begin configuring your robotic application',
  startFromScratch: 'Start from Scratch',
  startFromScratchDesc: 'Build your configuration step by step with full control',
  browseExamples: 'Browse Real Examples',
  browseExamplesDesc: 'See how others have configured similar applications',
  recommended: 'Recommended',
  canBrowseLater: 'You can always browse examples later from the navigation menu',
  browseRealApplications: 'Browse Real-World Applications',
  examples: 'examples',
  searchPlaceholder: 'Search applications...',
  filters: 'Filters',
  allCategories: 'All',
  industrial: 'Industrial',
  service: 'Service',
  security: 'Security',
  noResults: 'No examples found. Try different filters.',
},

// Chinese (中文)
gallery: {
  welcomeTitle: '您想如何开始？',
  welcomeSubtitle: '选择您偏好的方式来开始配置机器人应用',
  startFromScratch: '从头开始',
  startFromScratchDesc: '逐步构建配置，完全掌控',
  browseExamples: '浏览真实案例',
  browseExamplesDesc: '查看其他类似应用的配置方式',
  recommended: '推荐',
  canBrowseLater: '您可以稍后从导航菜单浏览案例',
  browseRealApplications: '浏览真实应用案例',
  examples: '个案例',
  searchPlaceholder: '搜索应用...',
  filters: '筛选',
  allCategories: '全部',
  industrial: '工业',
  service: '服务',
  security: '安防',
  noResults: '未找到案例，请尝试其他筛选条件。',
},
```

### 1.7 Integration Point in SceneDefinitionMain
**Modify:** `/demo/src/components/scene-definition/SceneDefinitionMain.tsx`

```typescript
// Add state
const [showStartSelector, setShowStartSelector] = useState(true);
const [showGalleryBrowser, setShowGalleryBrowser] = useState(false);

// Add handlers
const handleStartFromScratch = () => {
  setShowStartSelector(false);
  // Continue to normal mode selection
};

const handleBrowseExamples = () => {
  setShowStartSelector(false);
  setShowGalleryBrowser(true);
};

const handleSelectExample = (item: GalleryItem, config: RSIPConfiguration) => {
  setShowGalleryBrowser(false);
  // Apply configuration to state
  setEnvironmentType(config.environmentType);
  setPrimaryTasks(config.primaryTasks);
  setFunctionalRequirements(config.functionalRequirements);
  // ... apply other settings
  // Then proceed to workspace
};

// Add to render
return (
  <>
    <StartMethodSelector
      isOpen={showStartSelector}
      onStartFromScratch={handleStartFromScratch}
      onBrowseExamples={handleBrowseExamples}
    />

    <GalleryBrowserModal
      isOpen={showGalleryBrowser}
      onClose={() => setShowGalleryBrowser(false)}
      onSelectExample={handleSelectExample}
    />

    {/* Existing content */}
  </>
);
```

### 1.8 Configuration Mapping Utility
**File:** `/demo/src/utils/gallery-config-mapper.ts`

```typescript
// gallery-config-mapper.ts
import { GalleryItem } from '@/services/gallery-service';
import { EnvironmentType, UnifiedTaskType, FunctionalRequirement, IntelligenceLevel } from '@/types';

export interface RSIPConfiguration {
  environmentType: EnvironmentType;
  primaryTasks: UnifiedTaskType[];
  secondaryTasks?: UnifiedTaskType[];
  functionalRequirements: FunctionalRequirement[];
  intelligenceLevel: IntelligenceLevel;
  basicEnvironmentalFeatures?: string[];
}

// Scene type to Environment type mapping
const SCENE_TO_ENVIRONMENT: Record<string, EnvironmentType> = {
  warehouse: 'warehouse',
  manufacturing: 'factory',
  hospital: 'hospital',
  hotel: 'hotel',
  retail: 'retail_store',
  office: 'office',
  outdoor: 'outdoor_campus',
  laboratory: 'laboratory',
  // Add more mappings...
};

// Task type normalization
const NORMALIZE_TASK: Record<string, UnifiedTaskType> = {
  'transportation': 'transport',
  'palletizing': 'palletizing',
  'pick_place': 'picking',
  'inspection': 'inspection',
  'cleaning': 'cleaning',
  'delivery': 'delivery',
  'surveillance': 'patrol',
  'assembly': 'assembly',
  // Add more mappings...
};

export function mapGalleryItemToConfig(item: GalleryItem): RSIPConfiguration {
  // Map scene type to environment
  const environmentType = SCENE_TO_ENVIRONMENT[item.scene_type || ''] || 'warehouse';

  // Normalize and map task types
  const primaryTasks = item.task_types
    .slice(0, 3)
    .map(task => NORMALIZE_TASK[task.toLowerCase()] || task)
    .filter(Boolean) as UnifiedTaskType[];

  // Map functional requirements
  const functionalRequirements = item.functional_requirements as FunctionalRequirement[];

  // Infer intelligence level from requirements
  const intelligenceLevel = inferIntelligenceLevel(functionalRequirements);

  return {
    environmentType,
    primaryTasks,
    functionalRequirements,
    intelligenceLevel,
  };
}

function inferIntelligenceLevel(requirements: string[]): IntelligenceLevel {
  const advancedFeatures = [
    'machine_learning',
    'deep_learning',
    'nlp',
    'computer_vision_advanced',
    'predictive_analytics',
  ];

  const hasAdvanced = requirements.some(req =>
    advancedFeatures.some(adv => req.toLowerCase().includes(adv))
  );

  if (hasAdvanced) return 'advanced';
  if (requirements.length > 5) return 'standard';
  return 'basic';
}
```

---

## Proposal 2: "Contextual Examples" - In-Flow Assistance

### 2.1 Purpose
Show relevant gallery examples **during** configuration when users are making specific decisions about tasks, requirements, or environment settings.

### 2.2 User Flow
```
User in Enhanced Mode → Selects "Warehouse" environment →
System shows: "See 47 warehouse examples" link →
User clicks → Side panel opens with filtered gallery →
User watches video → Returns with understanding →
Continues configuration with confidence
```

### 2.3 Architecture

```
┌───────────────────────────────────────────────────────────────────────────┐
│                        Enhanced Mode Workspace                             │
├───────────────────┬───────────────────────────┬───────────────────────────┤
│   Left Panel      │      Center Canvas        │     Right Panel           │
│                   │                           │                           │
│  Environment:     │                           │  ┌─────────────────────┐  │
│  [Warehouse ▼]    │                           │  │   AI Chatbot        │  │
│  ↳ See examples   │                           │  │                     │  │
│                   │                           │  └─────────────────────┘  │
│  Tasks:           │                           │                           │
│  ☑ Transportation │      [Canvas Area]        │  ┌─────────────────────┐  │
│    ↳ 12 examples  │                           │  │ NEW: Examples Panel │  │
│  ☑ Palletizing    │                           │  │                     │  │
│    ↳ 8 examples   │                           │  │  📹 Example 1       │  │
│                   │                           │  │  📹 Example 2       │  │
│  Requirements:    │                           │  │  📷 Example 3       │  │
│  ☑ Navigation     │                           │  │                     │  │
│    ↳ 23 examples  │                           │  │  [See all 12 →]     │  │
│                   │                           │  └─────────────────────┘  │
└───────────────────┴───────────────────────────┴───────────────────────────┘
```

### 2.4 New Components

#### 2.4.1 ExamplesLink (Inline Trigger)
**File:** `/demo/src/components/gallery/ExamplesLink.tsx`

```typescript
// ExamplesLink.tsx
import React from 'react';
import { Eye } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ExamplesLinkProps {
  count: number;
  onClick: () => void;
  variant?: 'default' | 'compact';
}

export const ExamplesLink: React.FC<ExamplesLinkProps> = ({
  count,
  onClick,
  variant = 'default',
}) => {
  const { t } = useLanguage();

  if (count === 0) return null;

  if (variant === 'compact') {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
      >
        <Eye className="w-3 h-3" />
        {count}
      </button>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 mt-1"
    >
      <Eye className="w-3.5 h-3.5" />
      {t('gallery.seeExamples', { count })}
    </button>
  );
};
```

#### 2.4.2 ContextualExamplesPanel (Side Panel)
**File:** `/demo/src/components/gallery/ContextualExamplesPanel.tsx`

```typescript
// ContextualExamplesPanel.tsx
import React, { useState, useEffect } from 'react';
import { X, ExternalLink, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';
import { galleryService, GalleryItem, GalleryFilters } from '@/services/gallery-service';
import { GalleryCardCompact } from './GalleryCardCompact';
import { GalleryQuickView } from './GalleryQuickView';

export interface ExampleContext {
  type: 'environment' | 'task' | 'requirement' | 'combined';
  environment?: string;
  tasks?: string[];
  requirements?: string[];
  label: string;
}

interface ContextualExamplesPanelProps {
  context: ExampleContext;
  isOpen: boolean;
  onClose: () => void;
  onOpenFullGallery: (filters: GalleryFilters) => void;
}

export const ContextualExamplesPanel: React.FC<ContextualExamplesPanelProps> = ({
  context,
  isOpen,
  onClose,
  onOpenFullGallery,
}) => {
  const { t, language } = useLanguage();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    const fetchExamples = async () => {
      setLoading(true);

      const filters: GalleryFilters = {};

      if (context.environment) {
        filters.scene_type = context.environment;
      }
      if (context.tasks?.length) {
        filters.task_types = context.tasks;
      }
      if (context.requirements?.length) {
        filters.requirements = context.requirements;
      }

      const response = await galleryService.getItems(filters, 6);
      setItems(response.data);
      setTotalCount(response.count);
      setLoading(false);
    };

    fetchExamples();
  }, [isOpen, context]);

  if (!isOpen) return null;

  return (
    <div className="w-80 border-l bg-white flex flex-col shadow-lg">
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between bg-gray-50">
        <div>
          <h4 className="font-medium text-sm">{t('gallery.examplesFor')}</h4>
          <p className="text-xs text-gray-600">{context.label}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">
              {t('gallery.noExamplesFound')}
            </div>
          ) : (
            <>
              {items.map((item) => (
                <GalleryCardCompact
                  key={item.id}
                  item={item}
                  language={language}
                  onClick={() => setSelectedItem(item)}
                />
              ))}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      {totalCount > 6 && (
        <div className="p-3 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onOpenFullGallery({
              scene_type: context.environment,
              task_types: context.tasks,
              requirements: context.requirements,
            })}
          >
            {t('gallery.seeAllExamples', { count: totalCount })}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Quick View Modal */}
      {selectedItem && (
        <GalleryQuickView
          item={selectedItem}
          language={language}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
};
```

#### 2.4.3 GalleryCardCompact
**File:** `/demo/src/components/gallery/GalleryCardCompact.tsx`

```typescript
// GalleryCardCompact.tsx
import React from 'react';
import { Play, Image, FileText, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { GalleryItem } from '@/services/gallery-service';

interface GalleryCardCompactProps {
  item: GalleryItem;
  language: 'en' | 'zh';
  onClick: () => void;
}

export const GalleryCardCompact: React.FC<GalleryCardCompactProps> = ({
  item,
  language,
  onClick,
}) => {
  const title = language === 'zh' && item.title_zh ? item.title_zh : item.title;

  const MediaIcon = {
    video: Play,
    image: Image,
    article: FileText,
  }[item.media_type] || FileText;

  const formatDuration = (seconds?: number) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    return `${mins}min`;
  };

  return (
    <div
      className="flex gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="relative w-24 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
        {item.thumbnail_url ? (
          <img
            src={item.thumbnail_url}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MediaIcon className="w-6 h-6 text-gray-300" />
          </div>
        )}

        {/* Duration badge */}
        {item.duration_seconds && (
          <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1 rounded">
            {formatDuration(item.duration_seconds)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h5 className="text-sm font-medium line-clamp-2 leading-tight">{title}</h5>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            <MediaIcon className="w-2.5 h-2.5 mr-0.5" />
            {item.media_type}
          </Badge>
          <span className="text-[10px] text-gray-400">{item.source_name}</span>
        </div>
      </div>
    </div>
  );
};
```

#### 2.4.4 GalleryQuickView (Inline Modal)
**File:** `/demo/src/components/gallery/GalleryQuickView.tsx`

```typescript
// GalleryQuickView.tsx
import React from 'react';
import { X, ExternalLink, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GalleryItem } from '@/services/gallery-service';

interface GalleryQuickViewProps {
  item: GalleryItem;
  language: 'en' | 'zh';
  onClose: () => void;
}

export const GalleryQuickView: React.FC<GalleryQuickViewProps> = ({
  item,
  language,
  onClose,
}) => {
  const title = language === 'zh' && item.title_zh ? item.title_zh : item.title;
  const description = language === 'zh' && item.description_zh
    ? item.description_zh
    : item.description;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold line-clamp-1">{title}</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Media */}
        <div className="aspect-video bg-black">
          {item.media_type === 'video' && item.content_url ? (
            <iframe
              src={getEmbedUrl(item.content_url)}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          ) : item.thumbnail_url ? (
            <img
              src={item.content_url || item.thumbnail_url}
              alt={title}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Play className="w-16 h-16" />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="p-4">
          {description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-3">{description}</p>
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            {item.task_types.map((task) => (
              <Badge key={task} variant="secondary">{task}</Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.open(item.source_url, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Source
            </Button>
            <Button className="flex-1" onClick={onClose}>
              Continue Setup
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

function getEmbedUrl(url: string): string {
  // YouTube
  const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }
  return url;
}
```

### 2.5 useGalleryExamples Hook
**File:** `/demo/src/hooks/useGalleryExamples.ts`

```typescript
// useGalleryExamples.ts
import { useState, useCallback } from 'react';
import { galleryService, GalleryFilters } from '@/services/gallery-service';
import { ExampleContext } from '@/components/gallery/ContextualExamplesPanel';

export interface UseGalleryExamplesReturn {
  // Panel state
  isPanelOpen: boolean;
  currentContext: ExampleContext | null;

  // Actions
  showExamplesForEnvironment: (environment: string) => void;
  showExamplesForTask: (task: string) => void;
  showExamplesForRequirement: (requirement: string) => void;
  showExamplesForCombined: (environment?: string, tasks?: string[], requirements?: string[]) => void;
  closePanel: () => void;

  // Counts (for displaying links)
  getExampleCount: (filters: GalleryFilters) => Promise<number>;
}

export function useGalleryExamples(): UseGalleryExamplesReturn {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [currentContext, setCurrentContext] = useState<ExampleContext | null>(null);

  const showExamplesForEnvironment = useCallback((environment: string) => {
    setCurrentContext({
      type: 'environment',
      environment,
      label: environment,
    });
    setIsPanelOpen(true);
  }, []);

  const showExamplesForTask = useCallback((task: string) => {
    setCurrentContext({
      type: 'task',
      tasks: [task],
      label: task,
    });
    setIsPanelOpen(true);
  }, []);

  const showExamplesForRequirement = useCallback((requirement: string) => {
    setCurrentContext({
      type: 'requirement',
      requirements: [requirement],
      label: requirement,
    });
    setIsPanelOpen(true);
  }, []);

  const showExamplesForCombined = useCallback((
    environment?: string,
    tasks?: string[],
    requirements?: string[]
  ) => {
    const parts: string[] = [];
    if (environment) parts.push(environment);
    if (tasks?.length) parts.push(tasks.join(', '));

    setCurrentContext({
      type: 'combined',
      environment,
      tasks,
      requirements,
      label: parts.join(' + ') || 'Current selection',
    });
    setIsPanelOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setIsPanelOpen(false);
    setCurrentContext(null);
  }, []);

  const getExampleCount = useCallback(async (filters: GalleryFilters): Promise<number> => {
    const response = await galleryService.getItems(filters, 0);
    return response.count;
  }, []);

  return {
    isPanelOpen,
    currentContext,
    showExamplesForEnvironment,
    showExamplesForTask,
    showExamplesForRequirement,
    showExamplesForCombined,
    closePanel,
    getExampleCount,
  };
}
```

### 2.6 Integration in Enhanced Mode
**Modify:** `/demo/src/components/workspace/EnhancedModeUIv2Improved.tsx`

```typescript
// Add import
import { useGalleryExamples } from '@/hooks/useGalleryExamples';
import { ContextualExamplesPanel } from '@/components/gallery/ContextualExamplesPanel';
import { ExamplesLink } from '@/components/gallery/ExamplesLink';

// In component
const {
  isPanelOpen,
  currentContext,
  showExamplesForEnvironment,
  showExamplesForTask,
  showExamplesForRequirement,
  closePanel,
} = useGalleryExamples();

// In environment selector section
<div className="flex items-center justify-between">
  <label>Environment Type</label>
  <ExamplesLink
    count={environmentExampleCounts[selectedEnvironment] || 0}
    onClick={() => showExamplesForEnvironment(selectedEnvironment)}
  />
</div>

// In task selection section
{selectedTasks.map((task) => (
  <div key={task} className="flex items-center justify-between">
    <span>{task.name}</span>
    <ExamplesLink
      count={taskExampleCounts[task.id] || 0}
      onClick={() => showExamplesForTask(task.id)}
      variant="compact"
    />
  </div>
))}

// Add panel to layout (before closing ResizablePanel)
{isPanelOpen && currentContext && (
  <ContextualExamplesPanel
    context={currentContext}
    isOpen={isPanelOpen}
    onClose={closePanel}
    onOpenFullGallery={(filters) => {
      // Open full gallery modal with filters
    }}
  />
)}
```

### 2.7 Example Counts Cache
**File:** `/demo/src/hooks/useExampleCounts.ts`

```typescript
// useExampleCounts.ts
import { useState, useEffect, useCallback } from 'react';
import { galleryService } from '@/services/gallery-service';

interface ExampleCounts {
  environments: Record<string, number>;
  tasks: Record<string, number>;
  requirements: Record<string, number>;
}

export function useExampleCounts() {
  const [counts, setCounts] = useState<ExampleCounts>({
    environments: {},
    tasks: {},
    requirements: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // Fetch all items once and compute counts client-side
        const response = await galleryService.getItems({}, 1000);

        const envCounts: Record<string, number> = {};
        const taskCounts: Record<string, number> = {};
        const reqCounts: Record<string, number> = {};

        response.data.forEach((item) => {
          // Environment counts
          if (item.scene_type) {
            envCounts[item.scene_type] = (envCounts[item.scene_type] || 0) + 1;
          }

          // Task counts
          item.task_types.forEach((task) => {
            taskCounts[task] = (taskCounts[task] || 0) + 1;
          });

          // Requirement counts
          item.functional_requirements.forEach((req) => {
            reqCounts[req] = (reqCounts[req] || 0) + 1;
          });
        });

        setCounts({
          environments: envCounts,
          tasks: taskCounts,
          requirements: reqCounts,
        });
      } catch (error) {
        console.error('Failed to fetch example counts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  const getEnvironmentCount = useCallback(
    (env: string) => counts.environments[env] || 0,
    [counts.environments]
  );

  const getTaskCount = useCallback(
    (task: string) => counts.tasks[task] || 0,
    [counts.tasks]
  );

  const getRequirementCount = useCallback(
    (req: string) => counts.requirements[req] || 0,
    [counts.requirements]
  );

  return {
    loading,
    counts,
    getEnvironmentCount,
    getTaskCount,
    getRequirementCount,
  };
}
```

---

## Proposal 3: "AI Copilot Integration" - Conversational Discovery

### 3.1 Purpose
Enable the AI chatbot to suggest and display relevant gallery examples within conversation when users ask questions about capabilities or how to achieve specific outcomes.

### 3.2 User Flow
```
User asks: "Can robots handle fragile items?" →
AI responds with explanation + inline gallery cards →
User clicks thumbnail → Watches video in quick view →
AI follows up: "Want me to add gentle-handling to your config?" →
User: "Yes" → AI applies settings
```

### 3.3 Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          AI Chatbot Panel                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  👤 Can robots handle fragile items in warehouses?                      │
│                                                                          │
│  🤖 Yes! Gentle handling is a well-established capability.              │
│     Here are real-world examples:                                        │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  NEW: GalleryExamplesBlock Component                             │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                │   │
│  │  │ 📹          │ │ 📹          │ │ 📷          │                │   │
│  │  │ Soft Robot  │ │ ABB FlexPk  │ │ Berkshire   │                │   │
│  │  │ Egg packing │ │ Glass items │ │ Sorting     │                │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘                │   │
│  │                                              [Browse more →]     │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│     Key requirements: force_sensing, vision_guidance                     │
│                                                                          │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────────┐          │
│  │ Add to config  │ │ Show more      │ │ Ask another question│          │
│  └────────────────┘ └────────────────┘ └────────────────────────┘          │
│                                                                          │
│  [Type your message...]                                        [Send]   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.4 Extended Chat Message Types
**Modify:** `/demo/src/types/chat.ts`

```typescript
// chat.ts - Extended message types

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: string;

  // Existing fields
  analysis_type?: 'gemma3' | 'integrated' | 'fallback' | 'error' | 'profile_recommendations';
  response_time?: number;
  robot_recommendations?: RobotRecommendation[];
  profile_recommendations?: ProfileRecommendation[];

  // NEW: Gallery examples
  gallery_examples?: GalleryExampleReference[];
  gallery_context?: GalleryQueryContext;

  // NEW: Quick actions
  suggested_actions?: SuggestedAction[];
}

export interface GalleryExampleReference {
  id: string;
  title: string;
  title_zh?: string;
  thumbnail_url?: string;
  media_type: 'video' | 'image' | 'article';
  duration_seconds?: number;
  source_name: string;
  relevance_reason: string;  // Why this example is relevant
}

export interface GalleryQueryContext {
  query_type: 'capability' | 'task' | 'environment' | 'comparison';
  matched_terms: string[];
  total_matches: number;
}

export interface SuggestedAction {
  id: string;
  label: string;
  label_zh?: string;
  type: 'add_requirement' | 'add_task' | 'change_environment' | 'browse_gallery';
  payload: Record<string, any>;
}
```

### 3.5 New Components

#### 3.5.1 GalleryExamplesBlock (Inline in Chat)
**File:** `/demo/src/components/ai/GalleryExamplesBlock.tsx`

```typescript
// GalleryExamplesBlock.tsx
import React from 'react';
import { ChevronRight, Play, Image, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { GalleryExampleReference, GalleryQueryContext } from '@/types/chat';

interface GalleryExamplesBlockProps {
  examples: GalleryExampleReference[];
  context?: GalleryQueryContext;
  onExampleClick: (exampleId: string) => void;
  onBrowseMore: () => void;
}

export const GalleryExamplesBlock: React.FC<GalleryExamplesBlockProps> = ({
  examples,
  context,
  onExampleClick,
  onBrowseMore,
}) => {
  const { t, language } = useLanguage();

  if (examples.length === 0) return null;

  const MediaIcon = (type: string) => {
    switch (type) {
      case 'video': return Play;
      case 'image': return Image;
      default: return FileText;
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-3 my-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-600">
          {t('gallery.realWorldExamples')}
        </span>
        {context && context.total_matches > examples.length && (
          <span className="text-xs text-gray-400">
            {context.total_matches} {t('gallery.totalMatches')}
          </span>
        )}
      </div>

      {/* Example Cards Grid */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {examples.map((example) => {
          const title = language === 'zh' && example.title_zh
            ? example.title_zh
            : example.title;
          const Icon = MediaIcon(example.media_type);

          return (
            <div
              key={example.id}
              className="flex-shrink-0 w-32 cursor-pointer group"
              onClick={() => onExampleClick(example.id)}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-gray-200 rounded overflow-hidden mb-1">
                {example.thumbnail_url ? (
                  <img
                    src={example.thumbnail_url}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon className="w-6 h-6 text-gray-400" />
                  </div>
                )}

                {/* Play overlay for videos */}
                {example.media_type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="w-4 h-4 text-gray-800 ml-0.5" />
                    </div>
                  </div>
                )}

                {/* Duration */}
                {example.duration_seconds && (
                  <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1 rounded">
                    {Math.floor(example.duration_seconds / 60)}:{(example.duration_seconds % 60).toString().padStart(2, '0')}
                  </div>
                )}
              </div>

              {/* Title */}
              <p className="text-xs font-medium line-clamp-2 leading-tight">
                {title}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {example.source_name}
              </p>
            </div>
          );
        })}
      </div>

      {/* Browse More Button */}
      {context && context.total_matches > examples.length && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2 text-xs"
          onClick={onBrowseMore}
        >
          {t('gallery.browseAllMatches', { count: context.total_matches })}
          <ChevronRight className="w-3 h-3 ml-1" />
        </Button>
      )}
    </div>
  );
};
```

#### 3.5.2 SuggestedActionsBar
**File:** `/demo/src/components/ai/SuggestedActionsBar.tsx`

```typescript
// SuggestedActionsBar.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Settings, Eye, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SuggestedAction } from '@/types/chat';

interface SuggestedActionsBarProps {
  actions: SuggestedAction[];
  onActionClick: (action: SuggestedAction) => void;
}

export const SuggestedActionsBar: React.FC<SuggestedActionsBarProps> = ({
  actions,
  onActionClick,
}) => {
  const { language } = useLanguage();

  if (actions.length === 0) return null;

  const getIcon = (type: SuggestedAction['type']) => {
    switch (type) {
      case 'add_requirement':
      case 'add_task':
        return Plus;
      case 'change_environment':
        return Settings;
      case 'browse_gallery':
        return Eye;
      default:
        return ArrowRight;
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {actions.map((action) => {
        const Icon = getIcon(action.type);
        const label = language === 'zh' && action.label_zh
          ? action.label_zh
          : action.label;

        return (
          <Button
            key={action.id}
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => onActionClick(action)}
          >
            <Icon className="w-3 h-3 mr-1" />
            {label}
          </Button>
        );
      })}
    </div>
  );
};
```

### 3.6 Enhanced AI Service with Gallery Integration
**Modify:** `/demo/src/services/enhanced-mode-ai-service.ts`

```typescript
// Add to enhanced-mode-ai-service.ts

import { galleryService, GalleryItem, GalleryFilters } from './gallery-service';
import { GalleryExampleReference, GalleryQueryContext, SuggestedAction } from '@/types/chat';

interface AIResponseWithGallery {
  content: string;
  gallery_examples?: GalleryExampleReference[];
  gallery_context?: GalleryQueryContext;
  suggested_actions?: SuggestedAction[];
}

class EnhancedModeAIServiceWithGallery {

  /**
   * Analyze user query to determine if gallery examples would be helpful
   */
  private async shouldIncludeGalleryExamples(query: string): Promise<{
    include: boolean;
    filters: GalleryFilters;
    queryType: GalleryQueryContext['query_type'];
    matchedTerms: string[];
  }> {
    // Keywords that suggest user wants to see examples
    const exampleTriggers = [
      'example', 'show me', 'how do', 'can robots', 'is it possible',
      'real world', 'actual', 'deployment', 'implementation',
      '例子', '展示', '如何', '机器人能', '是否可能', '实际', '部署', '实施'
    ];

    // Capability keywords to match
    const capabilityKeywords: Record<string, string[]> = {
      'autonomous_navigation': ['navigate', 'autonomous', 'self-driving', 'move around', '导航', '自主'],
      'obstacle_avoidance': ['obstacle', 'avoid', 'collision', '障碍', '避障'],
      'pick_place': ['pick', 'place', 'grasp', 'grip', 'handle', '抓取', '放置'],
      'palletizing': ['pallet', 'stack', 'palletizing', '码垛', '堆放'],
      'inspection': ['inspect', 'check', 'quality', 'defect', '检测', '质量'],
      'cleaning': ['clean', 'scrub', 'sweep', 'mop', '清洁', '打扫'],
      'delivery': ['deliver', 'transport', 'carry', 'bring', '配送', '运输'],
      'fragile_handling': ['fragile', 'gentle', 'delicate', 'soft', 'careful', '易碎', '轻柔'],
    };

    // Environment keywords
    const environmentKeywords: Record<string, string[]> = {
      'warehouse': ['warehouse', 'storage', 'distribution', '仓库', '存储'],
      'hospital': ['hospital', 'medical', 'healthcare', 'clinic', '医院', '医疗'],
      'factory': ['factory', 'manufacturing', 'production', '工厂', '制造'],
      'retail': ['retail', 'store', 'shop', 'supermarket', '零售', '商店'],
      'hotel': ['hotel', 'hospitality', 'restaurant', '酒店', '餐厅'],
    };

    const queryLower = query.toLowerCase();

    // Check if query triggers example search
    const triggersExample = exampleTriggers.some(trigger =>
      queryLower.includes(trigger.toLowerCase())
    );

    if (!triggersExample) {
      return { include: false, filters: {}, queryType: 'capability', matchedTerms: [] };
    }

    // Find matched capabilities
    const matchedCapabilities: string[] = [];
    const matchedTerms: string[] = [];

    for (const [capability, keywords] of Object.entries(capabilityKeywords)) {
      if (keywords.some(kw => queryLower.includes(kw.toLowerCase()))) {
        matchedCapabilities.push(capability);
        matchedTerms.push(...keywords.filter(kw => queryLower.includes(kw.toLowerCase())));
      }
    }

    // Find matched environments
    let matchedEnvironment: string | undefined;
    for (const [env, keywords] of Object.entries(environmentKeywords)) {
      if (keywords.some(kw => queryLower.includes(kw.toLowerCase()))) {
        matchedEnvironment = env;
        matchedTerms.push(...keywords.filter(kw => queryLower.includes(kw.toLowerCase())));
        break;
      }
    }

    // Build filters
    const filters: GalleryFilters = {};
    if (matchedCapabilities.length > 0) {
      filters.requirements = matchedCapabilities;
    }
    if (matchedEnvironment) {
      filters.scene_type = matchedEnvironment;
    }

    const hasMatches = matchedCapabilities.length > 0 || matchedEnvironment;

    return {
      include: hasMatches,
      filters,
      queryType: matchedEnvironment ? 'environment' : 'capability',
      matchedTerms: [...new Set(matchedTerms)],
    };
  }

  /**
   * Fetch relevant gallery examples based on filters
   */
  private async fetchGalleryExamples(
    filters: GalleryFilters,
    limit: number = 3
  ): Promise<{ examples: GalleryExampleReference[]; total: number }> {
    const response = await galleryService.getItems(filters, limit);

    const examples: GalleryExampleReference[] = response.data.map((item) => ({
      id: item.id,
      title: item.title,
      title_zh: item.title_zh,
      thumbnail_url: item.thumbnail_url,
      media_type: item.media_type,
      duration_seconds: item.duration_seconds,
      source_name: item.source_name,
      relevance_reason: this.generateRelevanceReason(item, filters),
    }));

    return { examples, total: response.count };
  }

  /**
   * Generate a reason why this example is relevant
   */
  private generateRelevanceReason(item: GalleryItem, filters: GalleryFilters): string {
    const reasons: string[] = [];

    if (filters.requirements?.length) {
      const matched = item.functional_requirements.filter(
        req => filters.requirements!.includes(req)
      );
      if (matched.length > 0) {
        reasons.push(`Demonstrates ${matched.join(', ')}`);
      }
    }

    if (filters.scene_type && item.scene_type === filters.scene_type) {
      reasons.push(`${item.scene_type} environment`);
    }

    return reasons.join(' | ') || 'Related example';
  }

  /**
   * Generate suggested actions based on the conversation
   */
  private generateSuggestedActions(
    matchedCapabilities: string[],
    matchedEnvironment?: string
  ): SuggestedAction[] {
    const actions: SuggestedAction[] = [];

    // Add capability suggestions
    matchedCapabilities.forEach((cap, index) => {
      actions.push({
        id: `add-req-${index}`,
        label: `Add ${cap.replace(/_/g, ' ')}`,
        label_zh: `添加 ${cap}`,
        type: 'add_requirement',
        payload: { requirement: cap },
      });
    });

    // Add environment suggestion
    if (matchedEnvironment) {
      actions.push({
        id: 'set-env',
        label: `Set to ${matchedEnvironment}`,
        label_zh: `设置为 ${matchedEnvironment}`,
        type: 'change_environment',
        payload: { environment: matchedEnvironment },
      });
    }

    // Always add browse gallery option
    actions.push({
      id: 'browse-gallery',
      label: 'Browse more examples',
      label_zh: '浏览更多案例',
      type: 'browse_gallery',
      payload: {},
    });

    return actions.slice(0, 4); // Max 4 actions
  }

  /**
   * Enhanced chat method with gallery integration
   */
  async chatWithGallery(
    userMessage: string,
    context: any // existing context
  ): Promise<AIResponseWithGallery> {
    // Check if we should include gallery examples
    const galleryAnalysis = await this.shouldIncludeGalleryExamples(userMessage);

    // Get base AI response (existing logic)
    const baseResponse = await this.chat(userMessage, context);

    // If no gallery examples needed, return base response
    if (!galleryAnalysis.include) {
      return { content: baseResponse.content };
    }

    // Fetch gallery examples
    const { examples, total } = await this.fetchGalleryExamples(
      galleryAnalysis.filters,
      3
    );

    // Generate suggested actions
    const suggestedActions = this.generateSuggestedActions(
      galleryAnalysis.filters.requirements || [],
      galleryAnalysis.filters.scene_type
    );

    // Build enhanced response
    return {
      content: baseResponse.content,
      gallery_examples: examples,
      gallery_context: {
        query_type: galleryAnalysis.queryType,
        matched_terms: galleryAnalysis.matchedTerms,
        total_matches: total,
      },
      suggested_actions: suggestedActions,
    };
  }
}

export const enhancedModeAIServiceWithGallery = new EnhancedModeAIServiceWithGallery();
```

### 3.7 Updated Chat Message Component
**Modify:** `/demo/src/components/ai/ChatMessage.tsx`

```typescript
// Add to existing ChatMessage component

import { GalleryExamplesBlock } from './GalleryExamplesBlock';
import { SuggestedActionsBar } from './SuggestedActionsBar';
import { GalleryQuickView } from '../gallery/GalleryQuickView';

// In the AI message rendering section, add:

{message.type === 'ai' && (
  <>
    {/* Existing content rendering */}
    <div className="prose prose-sm max-w-none">
      <ReactMarkdown>{message.content}</ReactMarkdown>
    </div>

    {/* NEW: Gallery Examples Block */}
    {message.gallery_examples && message.gallery_examples.length > 0 && (
      <GalleryExamplesBlock
        examples={message.gallery_examples}
        context={message.gallery_context}
        onExampleClick={(id) => handleExampleClick(id)}
        onBrowseMore={() => handleBrowseMore(message.gallery_context)}
      />
    )}

    {/* NEW: Suggested Actions */}
    {message.suggested_actions && message.suggested_actions.length > 0 && (
      <SuggestedActionsBar
        actions={message.suggested_actions}
        onActionClick={handleActionClick}
      />
    )}

    {/* Existing robot recommendations, profile recommendations, etc. */}
  </>
)}
```

### 3.8 Translation Keys for AI Integration
```typescript
// Add to translations
gallery: {
  // ... existing keys ...

  // AI Integration
  realWorldExamples: 'Real-world examples',
  totalMatches: 'total matches',
  browseAllMatches: 'Browse all {count} examples',
  addToConfiguration: 'Add to configuration',
  showMoreExamples: 'Show more examples',
  relevantBecause: 'Relevant because:',

  // Chinese
  realWorldExamples_zh: '真实案例',
  totalMatches_zh: '个匹配',
  browseAllMatches_zh: '浏览全部 {count} 个案例',
  addToConfiguration_zh: '添加到配置',
  showMoreExamples_zh: '显示更多案例',
  relevantBecause_zh: '相关原因：',
},
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
1. Create `gallery-service.ts` in demo platform
2. Add translation keys
3. Create base components: `GalleryCard`, `GalleryCardCompact`

### Phase 2: Proposal 1 - Entrance Gallery (Week 2-3)
1. Create `StartMethodSelector` component
2. Create `GalleryBrowserModal` component
3. Create `GalleryDetailPanel` component
4. Integrate with `SceneDefinitionMain`
5. Add configuration mapping utility

### Phase 3: Proposal 2 - Contextual Examples (Week 3-4)
1. Create `ExamplesLink` component
2. Create `ContextualExamplesPanel` component
3. Create `useGalleryExamples` hook
4. Create `useExampleCounts` hook
5. Integrate with Enhanced Mode left panel

### Phase 4: Proposal 3 - AI Integration (Week 4-5)
1. Extend chat message types
2. Create `GalleryExamplesBlock` component
3. Create `SuggestedActionsBar` component
4. Enhance AI service with gallery query detection
5. Integrate with both chatbot components

### Phase 5: Polish & Testing (Week 5-6)
1. Performance optimization (lazy loading, caching)
2. Responsive design refinement
3. Multi-language testing
4. User testing and feedback
5. Documentation

---

## Database Considerations

### Required RPC Function
```sql
-- Add to Supabase
CREATE OR REPLACE FUNCTION increment_gallery_view(item_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE application_gallery
  SET view_count = view_count + 1
  WHERE id = item_id;
END;
$$ LANGUAGE plpgsql;
```

### Recommended Indexes
```sql
-- For filtering performance
CREATE INDEX idx_gallery_category ON application_gallery(application_category);
CREATE INDEX idx_gallery_scene_type ON application_gallery(scene_type);
CREATE INDEX idx_gallery_status ON application_gallery(status);
CREATE INDEX idx_gallery_featured ON application_gallery(featured);

-- For task/requirement filtering
CREATE INDEX idx_gallery_task_types ON application_gallery USING GIN(task_types);
CREATE INDEX idx_gallery_requirements ON application_gallery USING GIN(functional_requirements);

-- For full-text search
CREATE INDEX idx_gallery_title_search ON application_gallery USING GIN(to_tsvector('english', title));
```

---

## File Structure Summary

```
demo/src/
├── components/
│   ├── gallery/                          # NEW folder
│   │   ├── GalleryBrowserModal.tsx       # Proposal 1: Full gallery browser
│   │   ├── GalleryCard.tsx               # Shared: Standard card
│   │   ├── GalleryCardCompact.tsx        # Proposal 2: Compact card for panels
│   │   ├── GalleryDetailPanel.tsx        # Proposal 1: Detail side panel
│   │   ├── GalleryQuickView.tsx          # Shared: Quick view modal
│   │   ├── ContextualExamplesPanel.tsx   # Proposal 2: Side panel
│   │   └── ExamplesLink.tsx              # Proposal 2: Inline trigger
│   ├── ai/
│   │   ├── GalleryExamplesBlock.tsx      # Proposal 3: Inline examples in chat
│   │   ├── SuggestedActionsBar.tsx       # Proposal 3: Action buttons
│   │   └── ... existing files
│   └── scene-definition/
│       ├── StartMethodSelector.tsx       # Proposal 1: Entry point
│       └── ... existing files
├── services/
│   ├── gallery-service.ts                # NEW: Gallery API service
│   └── enhanced-mode-ai-service.ts       # MODIFY: Add gallery integration
├── hooks/
│   ├── useGalleryExamples.ts             # Proposal 2: Panel state hook
│   └── useExampleCounts.ts               # Proposal 2: Counts cache hook
├── utils/
│   └── gallery-config-mapper.ts          # Proposal 1: Config mapping
└── types/
    ├── gallery.ts                        # Gallery types (copy from Video_Library)
    └── chat.ts                           # MODIFY: Add gallery message types
```

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Gallery usage rate | 30%+ of new sessions | Analytics: StartMethodSelector clicks |
| Example view rate | 5+ views per session | Gallery view_count increments |
| Configuration adoption | 20%+ "Use this config" clicks | Analytics: handleSelectExample calls |
| AI example relevance | 4/5 satisfaction | User feedback on examples shown |
| Time to first config | -25% reduction | Session duration before first save |

---

*Document Version: 1.0*
*Last Updated: 2026-02-01*
*Authors: PM, Architect, UI/UX Team*
