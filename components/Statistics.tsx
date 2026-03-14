import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { dataService } from '../services/dataService';
import { TrendingUp, Users, Trophy, Target, Calendar, Activity, Zap, Award } from 'lucide-react';
import { TrainingSession, MatchRecord, Player } from '../types';
import { DashboardSkeleton } from './Skeleton';

const COLORS = {
  primary: '#f97316',
  secondary: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
};

const PIE_COLORS = ['#f97316', '#6366f1', '#10b981', '#f59e0b', '#3b82f6'];

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: number;
  color: keyof typeof COLORS;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon: Icon, trend, color }) => (
  <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{title}</span>
        <Icon size={18} style={{ color: COLORS[color] }} />
      </div>
      <div className="text-3xl font-black text-white tracking-tight">{value}</div>
      {subtitle && <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">{subtitle}</p>}
      {trend !== undefined && trend !== 0 && (
        <div className={`inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-full text-[9px] font-bold ${trend > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
          <TrendingUp size={10} className={trend < 0 ? 'rotate-180' : ''} />
          {Math.abs(trend)}% vs förra månaden
        </div>
      )}
    </div>
    <div
      className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"
      style={{ backgroundColor: COLORS[color] }}
    />
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-xl">
        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-bold" style={{ color: entry.color }}>
            {entry.name}: {entry.value.toFixed(1)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const Statistics: React.FC = () => {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'season'>('season');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [s, m, p] = await Promise.all([
          dataService.getSessions(),
          dataService.getMatches(),
          dataService.getPlayers(),
        ]);
        setSessions(s);
        setMatches(m);
        setPlayers(p);
      } catch (err) {
        console.error('Failed to load statistics:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Development Progress Chart Data
  const progressData = useMemo(() => {
    const timeline = dataService.getTeamProgressTimeline(sessions);
    if (timeline.length === 0) return [];

    const now = new Date();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];

    if (timeRange === 'week') {
      return timeline.slice(-7).map(d => ({
        name: `${d.date.split('-')[2]}/${d.date.split('-')[1]}`,
        utveckling: d.avg,
      }));
    }

    if (timeRange === 'month') {
      const cutoff = new Date();
      cutoff.setDate(now.getDate() - 30);
      const weeks: Record<string, { sum: number; count: number }> = {};

      timeline.forEach(d => {
        const date = new Date(d.date);
        if (date >= cutoff) {
          const startOfYear = new Date(date.getFullYear(), 0, 1);
          const weekNum = Math.ceil((((date.getTime() - startOfYear.getTime()) / 86400000) + startOfYear.getDay() + 1) / 7);
          const key = `V.${weekNum}`;
          if (!weeks[key]) weeks[key] = { sum: 0, count: 0 };
          weeks[key].sum += d.avg;
          weeks[key].count += 1;
        }
      });

      return Object.entries(weeks).map(([name, data]) => ({
        name,
        utveckling: parseFloat((data.sum / data.count).toFixed(1)),
      }));
    }

    // Season view - group by month
    const months: Record<string, { sum: number; count: number }> = {};
    timeline.forEach(d => {
      const date = new Date(d.date);
      const key = monthNames[date.getMonth()];
      if (!months[key]) months[key] = { sum: 0, count: 0 };
      months[key].sum += d.avg;
      months[key].count += 1;
    });

    return Object.entries(months).map(([name, data]) => ({
      name,
      utveckling: parseFloat((data.sum / data.count).toFixed(1)),
    }));
  }, [sessions, timeRange]);

  // Match Results Distribution
  const matchDistribution = useMemo(() => {
    const wins = matches.filter(m => m.score > m.opponentScore).length;
    const losses = matches.filter(m => m.score < m.opponentScore).length;
    const draws = matches.length - wins - losses;

    return [
      { name: 'Vinster', value: wins, color: COLORS.success },
      { name: 'Förluster', value: losses, color: COLORS.error },
      { name: 'Oavgjorda', value: draws, color: COLORS.warning },
    ].filter(d => d.value > 0);
  }, [matches]);

  // Category Focus Distribution
  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    sessions.forEach(s => {
      s.evaluations.forEach(e => {
        const cat = e.category || 'Övrigt';
        categories[cat] = (categories[cat] || 0) + 1;
      });
    });

    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [sessions]);

  // Team Average Skills Radar
  const teamSkillsData = useMemo(() => {
    if (players.length === 0) return [];

    const skills = ['Skytte', 'Dribbling', 'Passning', 'Försvar', 'Spelförståelse', 'Kondition', 'Fysik'];
    const averages: Record<string, number> = {};

    skills.forEach(skill => {
      const total = players.reduce((acc, p) => acc + (p.skillAssessment?.[skill] || 5), 0);
      averages[skill] = parseFloat((total / players.length).toFixed(1));
    });

    return skills.map(skill => ({
      skill,
      värde: averages[skill],
      fullMark: 10,
    }));
  }, [players]);

  // Stats Summary
  const stats = useMemo(() => {
    const attendanceRate = dataService.calculateAttendanceRate(sessions);
    const wins = matches.filter(m => m.score > m.opponentScore).length;
    const winRate = matches.length > 0 ? Math.round((wins / matches.length) * 100) : 0;
    
    // Calculate trend (compare last 5 sessions to previous 5)
    const sorted = [...sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const recent = sorted.slice(-5).flatMap(s => s.evaluations);
    const prev = sorted.slice(-10, -5).flatMap(s => s.evaluations);
    let trend = 0;
    if (prev.length > 0 && recent.length > 0) {
      const rAvg = recent.reduce((acc, ev) => acc + (ev.scores.reduce((a, b) => a + b, 0) / ev.scores.length), 0) / recent.length;
      const pAvg = prev.reduce((acc, ev) => acc + (ev.scores.reduce((a, b) => a + b, 0) / ev.scores.length), 0) / prev.length;
      trend = Math.round(((rAvg - pAvg) / pAvg) * 100);
    }

    return { attendanceRate, winRate, trend, totalSessions: sessions.length, totalMatches: matches.length };
  }, [sessions, matches]);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24 page-enter">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">Statistik</h1>
          <p className="text-sm text-slate-500 mt-1">Detaljerad analys av lagets prestationer</p>
        </div>
        <div className="flex gap-2">
          {(['week', 'month', 'season'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${
                timeRange === range
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/30'
                  : 'bg-slate-900 text-slate-500 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {range === 'week' ? 'Vecka' : range === 'month' ? 'Månad' : 'Säsong'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Träningspass"
          value={stats.totalSessions}
          subtitle="Totalt denna säsong"
          icon={Calendar}
          color="primary"
        />
        <StatCard
          title="Närvaro"
          value={`${stats.attendanceRate}%`}
          subtitle="Genomsnitt per pass"
          icon={Users}
          trend={5}
          color="success"
        />
        <StatCard
          title="Matcher"
          value={stats.totalMatches}
          subtitle={`${stats.winRate}% vinstprocent`}
          icon={Trophy}
          color="warning"
        />
        <StatCard
          title="Utvecklingsindex"
          value={progressData.length > 0 ? progressData[progressData.length - 1]?.utveckling?.toFixed(1) || '0' : '0'}
          subtitle="Senaste perioden"
          icon={TrendingUp}
          trend={stats.trend}
          color="secondary"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Development Progress Area Chart */}
        <div className="p-6 rounded-[2rem] bg-slate-900/50 border border-slate-800 backdrop-blur-sm">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
            <Activity size={16} className="text-orange-500" />
            Utvecklingskurva
          </h3>
          <div className="h-64">
            {progressData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={progressData}>
                  <defs>
                    <linearGradient id="colorDev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={10} tickLine={false} domain={[0, 5]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="utveckling"
                    stroke={COLORS.primary}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorDev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-600 text-sm">
                Ingen data tillgänglig
              </div>
            )}
          </div>
        </div>

        {/* Match Results Pie Chart */}
        <div className="p-6 rounded-[2rem] bg-slate-900/50 border border-slate-800 backdrop-blur-sm">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
            <Trophy size={16} className="text-amber-500" />
            Matchresultat
          </h3>
          <div className="h-64 flex items-center justify-center">
            {matchDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={matchDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {matchDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-600 text-sm">Inga matcher registrerade</div>
            )}
          </div>
          {matchDistribution.length > 0 && (
            <div className="flex justify-center gap-6 mt-4">
              {matchDistribution.map((entry, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {entry.name}: {entry.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Distribution */}
        <div className="p-6 rounded-[2rem] bg-slate-900/50 border border-slate-800 backdrop-blur-sm">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
            <Target size={16} className="text-indigo-500" />
            Träningsfokus
          </h3>
          <div className="h-64">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" stroke="#475569" fontSize={10} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#475569" fontSize={10} tickLine={false} width={100} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill={COLORS.secondary} radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-600 text-sm">
                Ingen data tillgänglig
              </div>
            )}
          </div>
        </div>

        {/* Team Skills Radar */}
        <div className="p-6 rounded-[2rem] bg-slate-900/50 border border-slate-800 backdrop-blur-sm">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
            <Award size={16} className="text-emerald-500" />
            Lagets Färdigheter
          </h3>
          <div className="h-64">
            {teamSkillsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={teamSkillsData}>
                  <PolarGrid stroke="#1e293b" />
                  <PolarAngleAxis dataKey="skill" stroke="#475569" fontSize={9} />
                  <PolarRadiusAxis stroke="#1e293b" domain={[0, 10]} tick={false} />
                  <Radar
                    name="Värde"
                    dataKey="värde"
                    stroke={COLORS.success}
                    fill={COLORS.success}
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-600 text-sm">
                Inga spelare registrerade
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
