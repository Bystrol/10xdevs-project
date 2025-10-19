import { AlertCircleIcon, DownloadIcon } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChartDataViewModel } from "@/types";

interface ChartComponentProps {
  chartData: ChartDataViewModel;
  onExport: (chartId: string) => void;
}

export function ChartComponent({ chartData, onExport }: ChartComponentProps) {
  const handleExport = () => {
    onExport(chartData.id);
  };

  if (chartData.isLoading) {
    return (
      <div className="space-y-4 p-4 border rounded-lg bg-card">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-9 w-24" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (chartData.error) {
    return (
      <div className="space-y-4 p-4 border rounded-lg bg-card">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold">{chartData.title}</h4>
          <Button variant="outline" size="sm" disabled>
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription>{chartData.error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const renderChart = () => {
    const commonProps = {
      data: chartData.data,
      margin: {
        top: 5,
        right: 30,
        left: 20,
        bottom: 5,
      },
    };

    switch (chartData.groupBy) {
      case "month":
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value: number) => [value, "Quantity"]}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        );

      case "type":
      case "location":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12 }}
              angle={chartData.groupBy === "type" ? -45 : 0}
              textAnchor={chartData.groupBy === "type" ? "end" : "middle"}
              height={chartData.groupBy === "type" ? 80 : 40}
              interval={0}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value: number) => [value, "Quantity"]}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
            />
            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold">{chartData.title}</h4>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={chartData.data.length === 0}>
          <DownloadIcon className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
