// Admin Moderation Dashboard
import { useState, useEffect } from 'react';
import { ArrowLeft, LayoutGrid, Flag, BarChart3 } from 'lucide-react';
import ContentQueue from './ContentQueue';
import ReportsQueue from './ReportsQueue';
import { getModerationStats } from '../../services/moderation-service';
import type { ModerationStats } from '../../types/moderation';

type TabType = 'content' | 'reports';

export default function AdminModerationPage() {
  const [activeTab, setActiveTab] = useState<TabType>('content');
  const [stats, setStats] = useState<ModerationStats>({
    pendingContent: 0,
    pendingReports: 0,
    approvedToday: 0,
    rejectedToday: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const data = await getModerationStats();
    setStats(data);
  };

  const handleBack = () => {
    window.location.href = window.location.pathname;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Content Moderation
                </h1>
                <p className="text-sm text-gray-500">
                  Manage gallery content and user reports
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<LayoutGrid className="w-5 h-5 text-blue-500" />}
              label="Pending Content"
              value={stats.pendingContent}
              highlight={stats.pendingContent > 0}
            />
            <StatCard
              icon={<Flag className="w-5 h-5 text-amber-500" />}
              label="Pending Reports"
              value={stats.pendingReports}
              highlight={stats.pendingReports > 0}
            />
            <StatCard
              icon={<BarChart3 className="w-5 h-5 text-green-500" />}
              label="Approved Today"
              value={stats.approvedToday}
            />
            <StatCard
              icon={<BarChart3 className="w-5 h-5 text-red-500" />}
              label="Rejected Today"
              value={stats.rejectedToday}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            <TabButton
              active={activeTab === 'content'}
              onClick={() => setActiveTab('content')}
              badge={stats.pendingContent}
            >
              <LayoutGrid className="w-4 h-4" />
              Content Queue
            </TabButton>
            <TabButton
              active={activeTab === 'reports'}
              onClick={() => setActiveTab('reports')}
              badge={stats.pendingReports}
            >
              <Flag className="w-4 h-4" />
              Reports Queue
            </TabButton>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'content' ? (
          <ContentQueue onUpdate={loadStats} />
        ) : (
          <ReportsQueue onUpdate={loadStats} />
        )}
      </main>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg ${
        highlight ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'
      }`}
    >
      <div className="flex-shrink-0">{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p
          className={`text-xl font-semibold ${
            highlight ? 'text-amber-600' : 'text-gray-900'
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

// Tab Button Component
function TabButton({
  children,
  active,
  onClick,
  badge,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span
          className={`px-2 py-0.5 text-xs rounded-full ${
            active
              ? 'bg-blue-100 text-blue-600'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
