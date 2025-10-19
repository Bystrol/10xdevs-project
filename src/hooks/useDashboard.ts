import { useCallback, useEffect, useReducer } from "react";
import type {
  ChartDataViewModel,
  FilterViewModel,
  GenerateAiReportResponseDto,
  LocationDto,
  WasteDataSummaryResponseDto,
  WasteTypeDto,
} from "../types";

// State interface
interface DashboardState {
  filters: FilterViewModel;
  chartsData: ChartDataViewModel[];
  aiReport: {
    report: string;
    isLoading: boolean;
    error: string | null;
  };
  dictionaries: {
    wasteTypes: WasteTypeDto[];
    locations: LocationDto[];
    isLoading: boolean;
    error: string | null;
  };
  isLoading: boolean;
}

// Action types
type DashboardAction =
  | { type: "SET_FILTERS"; payload: FilterViewModel }
  | { type: "SET_DICTIONARIES_LOADING"; payload: boolean }
  | { type: "SET_DICTIONARIES_SUCCESS"; payload: { wasteTypes: WasteTypeDto[]; locations: LocationDto[] } }
  | { type: "SET_DICTIONARIES_ERROR"; payload: string }
  | { type: "SET_CHART_LOADING"; payload: { id: string; loading: boolean } }
  | { type: "SET_CHART_DATA"; payload: { id: string; data: WasteDataSummaryResponseDto } }
  | { type: "SET_CHART_ERROR"; payload: { id: string; error: string } }
  | { type: "SET_AI_REPORT_LOADING"; payload: boolean }
  | { type: "SET_AI_REPORT_SUCCESS"; payload: string }
  | { type: "SET_AI_REPORT_ERROR"; payload: string }
  | { type: "SET_LOADING"; payload: boolean };

// Chart configurations (constant, doesn't change)
const CHART_CONFIGS: Pick<ChartDataViewModel, "id" | "title" | "groupBy">[] = [
  {
    id: "by-month",
    title: "Waste by Month",
    groupBy: "month",
  },
  {
    id: "by-type",
    title: "Waste by Type",
    groupBy: "type",
  },
  {
    id: "by-location",
    title: "Waste by Location",
    groupBy: "location",
  },
];

// Initial state
const initialState: DashboardState = {
  filters: {
    dateRange: {
      from: undefined,
      to: undefined,
    },
    wasteTypeIds: [],
    locationIds: [],
  },
  chartsData: CHART_CONFIGS.map((config) => ({
    ...config,
    data: [],
    isLoading: true,
    error: null,
  })),
  aiReport: {
    report: "",
    isLoading: false,
    error: null,
  },
  dictionaries: {
    wasteTypes: [],
    locations: [],
    isLoading: true,
    error: null,
  },
  isLoading: true,
};

// Reducer
function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case "SET_FILTERS":
      return { ...state, filters: action.payload };

    case "SET_DICTIONARIES_LOADING":
      return {
        ...state,
        dictionaries: { ...state.dictionaries, isLoading: action.payload },
      };

    case "SET_DICTIONARIES_SUCCESS":
      return {
        ...state,
        dictionaries: {
          wasteTypes: action.payload.wasteTypes,
          locations: action.payload.locations,
          isLoading: false,
          error: null,
        },
      };

    case "SET_DICTIONARIES_ERROR":
      return {
        ...state,
        dictionaries: {
          ...state.dictionaries,
          isLoading: false,
          error: action.payload,
        },
      };

    case "SET_CHART_LOADING":
      return {
        ...state,
        chartsData: state.chartsData.map((chart) =>
          chart.id === action.payload.id ? { ...chart, isLoading: action.payload.loading, error: null } : chart
        ),
      };

    case "SET_CHART_DATA":
      return {
        ...state,
        chartsData: state.chartsData.map((chart) =>
          chart.id === action.payload.id
            ? { ...chart, data: action.payload.data.data, isLoading: false, error: null }
            : chart
        ),
      };

    case "SET_CHART_ERROR":
      return {
        ...state,
        chartsData: state.chartsData.map((chart) =>
          chart.id === action.payload.id ? { ...chart, isLoading: false, error: action.payload.error } : chart
        ),
      };

    case "SET_AI_REPORT_LOADING":
      return {
        ...state,
        aiReport: { ...state.aiReport, isLoading: action.payload, error: null },
      };

    case "SET_AI_REPORT_SUCCESS":
      return {
        ...state,
        aiReport: { report: action.payload, isLoading: false, error: null },
      };

    case "SET_AI_REPORT_ERROR":
      return {
        ...state,
        aiReport: { ...state.aiReport, report: "", isLoading: false, error: action.payload },
      };

    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    default:
      return state;
  }
}

// Helper functions
function transformFiltersToQueryParams(filters: FilterViewModel) {
  const params = new URLSearchParams();

  if (filters.dateRange.from) {
    params.append("startDate", filters.dateRange.from.toISOString().split("T")[0]);
  }
  if (filters.dateRange.to) {
    params.append("endDate", filters.dateRange.to.toISOString().split("T")[0]);
  }
  if (filters.wasteTypeIds.length > 0) {
    params.append("wasteTypeIds", filters.wasteTypeIds.join(","));
  }
  if (filters.locationIds.length > 0) {
    params.append("locationIds", filters.locationIds.join(","));
  }

  return params;
}

// Custom hook
export function useDashboard() {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  // Fetch dictionaries on mount
  const fetchDictionaries = useCallback(async () => {
    dispatch({ type: "SET_DICTIONARIES_LOADING", payload: true });

    try {
      const [wasteTypesRes, locationsRes] = await Promise.all([fetch("/api/waste-types"), fetch("/api/locations")]);

      if (!wasteTypesRes.ok || !locationsRes.ok) {
        throw new Error("Failed to fetch dictionaries");
      }

      const wasteTypes: WasteTypeDto[] = await wasteTypesRes.json();
      const locations: LocationDto[] = await locationsRes.json();

      dispatch({ type: "SET_DICTIONARIES_SUCCESS", payload: { wasteTypes, locations } });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      dispatch({ type: "SET_DICTIONARIES_ERROR", payload: message });
    }
  }, []);

  // Fetch chart data
  const fetchChartData = useCallback(async (chart: ChartDataViewModel, filters: FilterViewModel) => {
    dispatch({ type: "SET_CHART_LOADING", payload: { id: chart.id, loading: true } });

    try {
      const params = transformFiltersToQueryParams(filters);
      params.append("groupBy", chart.groupBy);

      const response = await fetch(`/api/waste-data?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch ${chart.groupBy} data`);
      }

      const data: WasteDataSummaryResponseDto = await response.json();
      dispatch({ type: "SET_CHART_DATA", payload: { id: chart.id, data } });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      dispatch({ type: "SET_CHART_ERROR", payload: { id: chart.id, error: message } });
    }
  }, []);

  // Fetch all charts data
  const fetchAllChartsData = useCallback(
    async (filters: FilterViewModel) => {
      dispatch({ type: "SET_LOADING", payload: true });
      await Promise.all(
        CHART_CONFIGS.map((chart) => {
          const chartWithState = {
            ...chart,
            data: [],
            isLoading: true,
            error: null,
          };
          return fetchChartData(chartWithState, filters);
        })
      );
      dispatch({ type: "SET_LOADING", payload: false });
    },
    [fetchChartData]
  );

  // Handle filter change
  const handleFilterChange = useCallback(
    (filters: FilterViewModel) => {
      dispatch({ type: "SET_FILTERS", payload: filters });
      fetchAllChartsData(filters);
    },
    [fetchAllChartsData]
  );

  // Generate AI report
  const handleGenerateReport = useCallback(async () => {
    dispatch({ type: "SET_AI_REPORT_LOADING", payload: true });

    try {
      const command = {
        groupBy: "month" as const, // Default grouping for report
        startDate: state.filters.dateRange.from?.toISOString().split("T")[0],
        endDate: state.filters.dateRange.to?.toISOString().split("T")[0],
        wasteTypeIds: state.filters.wasteTypeIds,
        locationIds: state.filters.locationIds,
      };

      const response = await fetch("/api/waste-data/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        throw new Error("Failed to generate AI report");
      }

      const result: GenerateAiReportResponseDto = await response.json();
      dispatch({ type: "SET_AI_REPORT_SUCCESS", payload: result.report });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      dispatch({ type: "SET_AI_REPORT_ERROR", payload: message });
    }
  }, [state.filters]);

  // Export to PDF
  const handleExportPdf = useCallback(async (chartId: string) => {
    try {
      // Dynamic imports to avoid bundling these libraries when not needed
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).jsPDF;

      // Find the chart element by ID
      const chartElement = document.querySelector(`[data-chart-id="${chartId}"]`) as HTMLElement;
      if (!chartElement) {
        console.error(`Chart element with ID ${chartId} not found`);
        return;
      }

      // Create canvas from the chart element
      const canvas = await html2canvas(chartElement, {
        backgroundColor: "#ffffff",
        scale: 2, // Higher quality
        useCORS: true,
      });

      // Create PDF
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // Calculate dimensions to fit the chart in PDF
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = (pdfHeight - imgHeight * ratio) / 2;

      pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);

      // Generate filename with current date
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      const filename = `waste-chart-${chartId}-${dateStr}.pdf`;

      // Download the PDF
      pdf.save(filename);
    } catch (error) {
      console.error("Error exporting chart to PDF:", error);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchDictionaries();
    // Fetch initial chart data
    const loadInitialData = async () => {
      dispatch({ type: "SET_LOADING", payload: true });
      await Promise.all(
        CHART_CONFIGS.map(async (chart) => {
          dispatch({ type: "SET_CHART_LOADING", payload: { id: chart.id, loading: true } });

          try {
            const params = transformFiltersToQueryParams(initialState.filters);
            params.append("groupBy", chart.groupBy);

            const response = await fetch(`/api/waste-data?${params.toString()}`);

            if (!response.ok) {
              throw new Error(`Failed to fetch ${chart.groupBy} data`);
            }

            const data: WasteDataSummaryResponseDto = await response.json();
            dispatch({ type: "SET_CHART_DATA", payload: { id: chart.id, data } });
          } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            dispatch({ type: "SET_CHART_ERROR", payload: { id: chart.id, error: message } });
          }
        })
      );
      dispatch({ type: "SET_LOADING", payload: false });
    };
    loadInitialData();
  }, [fetchDictionaries]);

  return {
    state,
    actions: {
      handleFilterChange,
      handleGenerateReport,
      handleExportPdf,
    },
  };
}
