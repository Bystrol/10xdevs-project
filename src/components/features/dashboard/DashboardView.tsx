import { useDashboard } from "@/hooks/useDashboard";
import { AIReportGenerator } from "./AIReportGenerator";
import { ChartComponent } from "./ChartComponent";
import { EmptyState } from "./EmptyState";
import { FiltersPanel } from "./FiltersPanel";

export function DashboardView() {
  const { state, actions } = useDashboard();

  // Check if we have any data to display
  const hasData = state.chartsData.some((chart) => chart.data.length > 0);

  return (
    <div className="h-screen bg-background flex flex-col">
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto py-8 px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Waste Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-2">Analyze waste trends and patterns across different dimensions</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-4">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <FiltersPanel
                  wasteTypes={state.dictionaries.wasteTypes}
                  locations={state.dictionaries.locations}
                  onFilterChange={actions.handleFilterChange}
                  onFilterReset={() =>
                    actions.handleFilterChange({
                      dateRange: { from: undefined, to: undefined },
                      wasteTypeIds: [],
                      locationIds: [],
                    })
                  }
                  isLoading={state.isLoading}
                />
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* AI Report Generator */}
              <AIReportGenerator
                onGenerateReport={actions.handleGenerateReport}
                report={state.aiReport.report}
                isLoading={state.aiReport.isLoading}
                error={state.aiReport.error}
                disabled={!hasData}
              />

              {/* Charts Grid or Empty State */}
              <div className="grid gap-6 md:grid-cols-1">
                {!hasData && !state.isLoading && !state.dictionaries.isLoading ? (
                  <EmptyState />
                ) : (
                  state.chartsData.map((chartData) => (
                    <ChartComponent key={chartData.id} chartData={chartData} onExport={actions.handleExportPdf} />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
