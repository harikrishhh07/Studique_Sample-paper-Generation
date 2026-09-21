import { createClient } from "@supabase/supabase-js";
import QRCode from "qrcode";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Service-role client (server-side only). Bypasses RLS so inserts/selects
// work without writing policies. NEVER expose this key to the client.
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const FIRST_COUPON_DISCOUNT = 10;
export const REUSE_COUPON_DISCOUNT = 7;

// Discount used for restaurants without a specific deal configured.
const DEFAULT_COUPON_DISCOUNT = Number(
  process.env.DEFAULT_COUPON_DISCOUNT || 10
);

// Ambiguity-free alphanumeric alphabet (no 0/O, 1/I/L)
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export interface Restaurant {
  id: string;
  name: string;
  address?: string | null;
  slug?: string | null;
}

export interface Coupon {
  id: string;
  user_registration_number: string;
  restaurant_id: string | null;
  coupon_code: string;
  discount: number;
  status: string;
  generated_at: string;
  scanned_at: string | null;
}

function generateCouponCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  let code = "";
  for (let i = 0; i < 10; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return code;
}

async function ensureRestaurant(): Promise<Restaurant> {
  const name = process.env.RESTAURANT_NAME || "Ark Bistro";
  const slug = process.env.RESTAURANT_SLUG || "";

  // Prefer slug lookup when a slug is configured. If the slug column does not
  // exist yet (migration not run), fall back to matching by name.
  if (slug) {
    const { data, error } = await supabase
      .from("restaurants")
      .select("id, name, address, slug")
      .eq("slug", slug)
      .limit(1)
      .maybeSingle();
    if (!error && data) return data as Restaurant;
  }

  const { data: byName, error: nameError } = await supabase
    .from("restaurants")
    .select("id, name, address")
    .eq("name", name)
    .limit(1)
    .maybeSingle();

  if (nameError) throw nameError;
  if (byName) return byName as Restaurant;

  // Create with slug when supported, otherwise name-only insert.
  if (slug) {
    const { error: insertError } = await supabase
      .from("restaurants")
      .insert({ name, slug });
    if (!insertError) {
      const { data: fresh } = await supabase
        .from("restaurants")
        .select("id, name, address, slug")
        .eq("slug", slug)
        .limit(1)
        .maybeSingle();
      if (fresh) return fresh as Restaurant;
    }
  }

  const { data: inserted, error: insertError } = await supabase
    .from("restaurants")
    .insert({ name })
    .select("id, name, address")
    .single();

  if (insertError) throw insertError;
  return inserted as Restaurant;
}

async function ensureUser(registrationNumber: string): Promise<void> {
  const { error } = await supabase
    .from("users")
    .upsert(
      { registration_number: registrationNumber },
      { onConflict: "registration_number" }
    );
  if (error) throw error;
}

async function findUnscannedCoupon(
  registrationNumber: string,
  restaurantId: string
): Promise<Coupon | null> {
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("user_registration_number", registrationNumber)
    .eq("restaurant_id", restaurantId)
    .eq("status", "unscanned")
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as Coupon) || null;
}

async function insertCoupon(
  registrationNumber: string,
  restaurantId: string | null,
  discount: number
): Promise<Coupon> {
  // Retry on the rare unique-violation race for coupon_code
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCouponCode();
    const { data, error } = await supabase
      .from("coupons")
      .insert({
        user_registration_number: registrationNumber,
        restaurant_id: restaurantId,
        coupon_code: code,
        discount,
        status: "unscanned",
      })
      .select("*")
      .single();

    if (!error && data) return data as Coupon;
  }
  throw new Error("Failed to generate a unique coupon code");
}

async function countUserCoupons(
  registrationNumber: string,
  restaurantId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("coupons")
    .select("id", { count: "exact", head: true })
    .eq("user_registration_number", registrationNumber)
    .eq("restaurant_id", restaurantId);

  if (error) throw error;
  return count || 0;
}

function isArkBistro(restaurant: Restaurant): boolean {
  const slug = process.env.RESTAURANT_SLUG || "ARKB";
  const name = process.env.RESTAURANT_NAME || "Ark Bistro";
  return restaurant.slug === slug || restaurant.name === name;
}

// Ark Bistro deal: first-ever coupon for this restaurant is 10%, every coupon
// created afterwards (only once the prior one has been scanned) is 5%. Other
// restaurants keep the generic default discount.
async function discountForUser(
  registrationNumber: string,
  restaurant: Restaurant
): Promise<number> {
  if (!isArkBistro(restaurant)) {
    return DEFAULT_COUPON_DISCOUNT;
  }

  const count = await countUserCoupons(registrationNumber, restaurant.id);
  return count > 0 ? REUSE_COUPON_DISCOUNT : FIRST_COUPON_DISCOUNT;
}

export async function getOrCreateCoupon(
  registrationNumber: string
): Promise<{ coupon: Coupon; restaurant: Restaurant | null; created: boolean }> {
  const restaurant = await ensureRestaurant();
  await ensureUser(registrationNumber);

  const existing = await findUnscannedCoupon(
    registrationNumber,
    restaurant.id
  );
  if (existing) {
    return { coupon: existing, restaurant, created: false };
  }

  const discount = await discountForUser(registrationNumber, restaurant);
  const coupon = await insertCoupon(
    registrationNumber,
    restaurant.id,
    discount
  );
  return { coupon, restaurant, created: true };
}

const qrCache = new Map<string, Promise<string>>();

export function couponQRDataUrl(code: string): Promise<string> {
  if (qrCache.has(code)) return qrCache.get(code)!;

  const promise = QRCode.toDataURL(code, {
    width: 640,
    margin: 2,
    errorCorrectionLevel: "H",
  });
  qrCache.set(code, promise);
  return promise;
}