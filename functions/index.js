import { onRequest } from "firebase-functions/v2/https";
import { BetaAnalyticsDataClient } from "@google-analytics/data";
import cors from "cors";

const analyticsDataClient = new BetaAnalyticsDataClient();
const GA4_PROPERTY_ID = "508537916";

const corsHandler = cors({ origin: true });

export const ga4report = onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const { startDate = "7daysAgo", endDate = "today" } = req.query;

      const [summaryResponse, trendResponse] = await Promise.all([
        analyticsDataClient.runReport({
          property: `properties/${GA4_PROPERTY_ID}`,
          dateRanges: [{ startDate, endDate }],
          metrics: [{ name: "totalUsers" }],
        }),
        analyticsDataClient.runReport({
          property: `properties/${GA4_PROPERTY_ID}`,
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: "date" }],
          metrics: [{ name: "totalUsers" }],
          orderBys: [{ dimension: { dimensionName: "date" } }],
        }),
      ]);

      const totalVisitors = parseInt(
        summaryResponse[0]?.rows?.[0]?.metricValues?.[0]?.value || "0"
      );

      const dailyTrend = (trendResponse[0]?.rows || []).map((row) => ({
        date: row.dimensionValues[0].value,
        visitors: parseInt(row.metricValues[0].value || "0"),
      }));

      res.json({ totalVisitors, dailyTrend });
    } catch (error) {
      console.error("GA4 API error:", error);
      res.status(500).json({ error: "Failed to fetch GA4 data" });
    }
  });
});
