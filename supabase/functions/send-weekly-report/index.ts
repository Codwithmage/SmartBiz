import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;

webpush.setVapidDetails(
  "mailto:admin@smartbiz.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

Deno.serve(async (req: Request) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*");

    if (subError) throw subError;

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: "No subscribers found." }), { status: 200 });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    let sentCount = 0;

    for (const sub of subscriptions) {
      console.log(`🔍 [DEBUG] Checking subscription for business_id: "${sub.business_id}"`);

      const [salesRes, servicesRes] = await Promise.all([
        supabase
          .from("sales")
          .select("*")
          .eq("business_id", sub.business_id)
          .gte("created_at", sevenDaysAgo),
        supabase
          .from("services")
          .select("*")
          .eq("business_id", sub.business_id)
          .gte("created_at", sevenDaysAgo),
      ]);

      console.log("📊 [DEBUG] Sales fetched:", salesRes.data, "Error:", salesRes.error);
      console.log("🛠️ [DEBUG] Services fetched:", servicesRes.data, "Error:", servicesRes.error);

      const productSales = (salesRes.data || []).reduce((acc: number, s: any) => {
        const val = Number(s.amount ?? s.total_amount ?? s.unit_price ?? s.price ?? s.total ?? 0);
        return acc + val;
      }, 0);

      const serviceSales = (servicesRes.data || []).reduce((acc: number, s: any) => {
        const val = Number(s.price ?? s.amount ?? s.total_amount ?? s.total ?? 0);
        return acc + val;
      }, 0);

      const totalRevenue = productSales + serviceSales;
      const totalTransactions = (salesRes.data?.length || 0) + (servicesRes.data?.length || 0);

      console.log(`💰 [DEBUG] Computed Revenue: ₦${totalRevenue} | Transactions: ${totalTransactions}`);

      const payload = JSON.stringify({
        title: "📈 SmartBiz Weekly Performance",
        body: `Past 7 Days Revenue: ₦${totalRevenue.toLocaleString()} across ${totalTransactions} transactions.`,
        url: "/dashboard",
      });

      try {
        await webpush.sendNotification(sub.subscription, payload);
        sentCount++;
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, delivered: sentCount }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("❌ [DEBUG] Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
});