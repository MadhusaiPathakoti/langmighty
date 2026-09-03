// One-time setup script — run manually via `node scripts/seedSubscriptionPlans.mjs`.
// Creates the two Razorpay Plans (Mighty Pro / Mighty Premium) that
// api/subscriptions.js's `create` action subscribes users to via
// RAZORPAY_PRO_PLAN_ID / RAZORPAY_PREMIUM_PLAN_ID. A Plan's price is fixed at
// creation time in Razorpay — re-running this script creates NEW plans rather
// than updating the price of existing ones, so only run it once per price point.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Razorpay from "razorpay";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function readDotEnv() {
  const envPath = path.resolve(__dirname, "..", ".env");
  const result = {};
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    result[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
  }
  return result;
}

const env = readDotEnv();
if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
  throw new Error("RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET missing from .env");
}

const razorpay = new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });

const PLANS = [
  { key: "RAZORPAY_PRO_PLAN_ID", name: "Mighty Pro", amountPaise: 9900 },
  { key: "RAZORPAY_PREMIUM_PLAN_ID", name: "Mighty Premium", amountPaise: 24900 },
];

for (const plan of PLANS) {
  const created = await razorpay.plans.create({
    period: "monthly",
    interval: 1,
    item: { name: plan.name, amount: plan.amountPaise, currency: "INR" },
  });
  console.log(`${plan.key}=${created.id}`);
}

console.log("\nPaste the two lines above into .env (and your Vercel project's env vars once deployed).");
