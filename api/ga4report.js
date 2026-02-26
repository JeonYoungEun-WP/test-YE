import { ExternalAccountClient } from "google-auth-library";
import { getVercelOidcToken } from "@vercel/functions/oidc";

const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID || "508537916";

const GCP_PROJECT_NUMBER = process.env.GCP_PROJECT_NUMBER;
const GCP_SERVICE_ACCOUNT_EMAIL = process.env.GCP_SERVICE_ACCOUNT_EMAIL;
const GCP_WORKLOAD_IDENTITY_POOL_ID = process.env.GCP_WORKLOAD_IDENTITY_POOL_ID;
const GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID = process.env.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID;

async function getAccessToken() {
  const authClient = ExternalAccountClient.fromJSON({
    type: "external_account",
    audience: `//iam.googleapis.com/projects/${GCP_PROJECT_NUMBER}/locations/global/workloadIdentityPools/${GCP_WORKLOAD_IDENTITY_POOL_ID}/providers/${GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID}`,
    subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
    token_url: "https://sts.googleapis.com/v1/token",
    service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${GCP_SERVICE_ACCOUNT_EMAIL}:generateAccessToken`,
    service_account_impersonation: {
      token_lifetime_seconds: 3600,
    },
    subject_token_supplier: {
      getSubjectToken: getVercelOidcToken,
    },
  });
  authClient.scopes = ["https://www.googleapis.com/auth/analytics.readonly"];
  const { token } = await authClient.getAccessToken();
  return token;
}

async function runGA4Report(accessToken, body) {
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:runReport`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GA4 API ${res.status}: ${err}`);
  }
  return res.json();
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { startDate = "7daysAgo", endDate = "today" } = req.query;
    const accessToken = await getAccessToken();

    const [summaryData, trendData, sourceData] = await Promise.all([
      runGA4Report(accessToken, {
        dateRanges: [{ startDate, endDate }],
        metrics: [{ name: "totalUsers" }, { name: "screenPageViews" }],
      }),
      runGA4Report(accessToken, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "date" }],
        metrics: [{ name: "totalUsers" }, { name: "screenPageViews" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      }),
      runGA4Report(accessToken, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "sessionSource" }],
        metrics: [{ name: "sessions" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 10,
      }),
    ]);

    const totalVisitors = parseInt(
      summaryData.rows?.[0]?.metricValues?.[0]?.value || "0"
    );
    const totalPageViews = parseInt(
      summaryData.rows?.[0]?.metricValues?.[1]?.value || "0"
    );

    const dailyTrend = (trendData.rows || []).map((row) => ({
      date: row.dimensionValues[0].value,
      visitors: parseInt(row.metricValues[0].value || "0"),
      pageViews: parseInt(row.metricValues[1].value || "0"),
    }));

    const sessionSources = (sourceData.rows || []).map((row) => ({
      source: row.dimensionValues[0].value,
      sessions: parseInt(row.metricValues[0].value || "0"),
    }));

    res.json({ totalVisitors, totalPageViews, dailyTrend, sessionSources });
  } catch (error) {
    console.error("GA4 API error:", error);
    res.status(500).json({ error: "Failed to fetch GA4 data", detail: error.message });
  }
}
