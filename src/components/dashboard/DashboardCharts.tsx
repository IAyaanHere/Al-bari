"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { useTranslation } from "@/lib/i18n/context";

interface ChartsData {
  monthlyUploads: Array<{ month: string; count: number }>;
  categoryDistribution: Array<{ name: string; count: number }>;
  madrasaBreakdown: Array<{ name: string; count: number }>;
  topTeachers: Array<{ name: string; count: number }>;
}

const COLORS = ["#065f46", "#d97706", "#0284c7", "#7c3aed", "#e11d48", "#10b981", "#64748b"];

export function DashboardCharts({ data }: { data: ChartsData }) {
  const { t } = useTranslation();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
        <div className="h-72 bg-slate-100 rounded-2xl" />
        <div className="h-72 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Monthly Records Ingestion */}
      <Card className="rounded-2xl border-slate-200/90 shadow-2xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-slate-800">
            {t.dashboard.charts.monthlyUploads}
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64 sm:h-72 pt-2">
          {data.monthlyUploads.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              No historical data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyUploads} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#064e3b",
                    borderRadius: "8px",
                    color: "#fff",
                    border: "none",
                    fontSize: "12px",
                  }}
                  itemStyle={{ color: "#fef3c7" }}
                />
                <Bar dataKey="count" fill="#065f46" radius={[4, 4, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* 2. Category Distribution */}
      <Card className="rounded-2xl border-slate-200/90 shadow-2xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-slate-800">
            {t.dashboard.charts.categoryDistribution}
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64 sm:h-72 pt-2">
          {data.categoryDistribution.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              No category data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.categoryDistribution}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={3}
                >
                  {data.categoryDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#064e3b",
                    borderRadius: "8px",
                    color: "#fff",
                    border: "none",
                    fontSize: "12px",
                  }}
                  itemStyle={{ color: "#fef3c7" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* 3. Activity by Madrasa */}
      <Card className="rounded-2xl border-slate-200/90 shadow-2xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-slate-800">
            {t.dashboard.charts.madrasaBreakdown}
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64 sm:h-72 pt-2">
          {data.madrasaBreakdown.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              No madrasa activity recorded
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.madrasaBreakdown}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" fontSize={11} allowDecimals={false} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} width={110} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#064e3b",
                    borderRadius: "8px",
                    color: "#fff",
                    border: "none",
                    fontSize: "12px",
                  }}
                  itemStyle={{ color: "#fef3c7" }}
                />
                <Bar dataKey="count" fill="#d97706" radius={[0, 4, 4, 0]} maxBarSize={25} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* 4. Top Contributing Educators */}
      <Card className="rounded-2xl border-slate-200/90 shadow-2xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-slate-800">
            {t.dashboard.charts.topTeachers}
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64 sm:h-72 pt-2">
          {data.topTeachers.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              No educator uploads recorded
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.topTeachers}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" fontSize={11} allowDecimals={false} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} width={100} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#064e3b",
                    borderRadius: "8px",
                    color: "#fff",
                    border: "none",
                    fontSize: "12px",
                  }}
                  itemStyle={{ color: "#fef3c7" }}
                />
                <Bar dataKey="count" fill="#0284c7" radius={[0, 4, 4, 0]} maxBarSize={25} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
