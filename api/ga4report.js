import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { ExternalAccountClient } from "google-auth-library";
import { getVercelOidcToken } from "@vercel/functions/oidc";

const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID || "508537916";

const GCP_PROJECT_NUMBER = process.env.GCP_PROJECT_NUMBER;
const GCP_SERVICE_ACCOUNT_EMAIL = process.env.GCP_SERVICE_ACCOUNT_EMAIL;
const GCP_WORKLOAD_IDENTITY_POOL_ID = process.env.GCP_WORKLOAD_IDENTITY_POOL_ID;
const GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID = process.env.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID;

function getClient() {
  const authClient = ExternalAccountClient.fromJSON({
    type: "external_account",
    audience: `//iam.googleapis.com/projects/${GCP_PROJECT_NUMBER}/locations/global/workloadIdentityPools/${GCP_WORKLOAD_IDENTITY_POOL_ID}/providers/${GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID}`,
    subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
    token_url: "https://sts.googleapis.com/v1/token",
    service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${GCP_SERVICE_ACCOUNT_EMAIL}:generateAccessToken`,
    subject_token_supplier: {
      getSubjectToken: getVercelOidcToken,
    },
  });

  return new BetaAnalyticsDataClient({ authClient });
}

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { startDate = "7daysAgo", endDate = "today" } = req.query;
    const client = getClient();

    const [summaryResponse, trendResponse] = await Promise.all([
      client.runReport({
        property: `properties/${GA4_PROPERTY_ID}`,
        dateRanges: [{ startDate, endDate }],
        metrics: [{ name: "totalUsers" }, { name: "screenPageViews" }],
      }),
      client.runReport({
        property: `properties/${GA4_PROPERTY_ID}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "date" }],
        metrics: [{ name: "totalUsers" }, { name: "screenPageViews" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      }),
    ]);

    const totalVisitors = parseInt(
      summaryResponse[0]?.rows?.[0]?.metricValues?.[0]?.value || "0"
    );
    const totalPageViews = parseInt(
      summaryResponse[0]?.rows?.[0]?.metricValues?.[1]?.value || "0"
    );

    const dailyTrend = (trendResponse[0]?.rows || []).map((row) => ({
      date: row.dimensionValues[0].value,
      visitors: parseInt(row.metricValues[0].value || "0"),
      pageViews: parseInt(row.metricValues[1].value || "0"),
    }));

    res.json({ totalVisitors, totalPageViews, dailyTrend });
  } catch (error) {
    console.error("GA4 API error:", error);
    res.status(500).json({ error: "Failed to fetch GA4 data", detail: error.message });
  }
}
