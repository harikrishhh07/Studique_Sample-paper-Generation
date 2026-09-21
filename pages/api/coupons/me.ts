import { NextApiRequest, NextApiResponse } from "next";
import { isValidToken } from "@/utils/security";
import { userInfo } from "@/server/action";
import {
  getOrCreateCoupon,
  couponQRDataUrl,
} from "@/lib/coupons";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // No caching so a fresh coupon state is always returned
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  try {
    const token = req.cookies.token;
    if (!token || !isValidToken(token)) {
      return res
        .status(401)
        .json({ error: "Invalid or missing authentication token" });
    }

    const info = await userInfo(token);
    const userInfoData = info?.data?.userInfo;
    if (!userInfoData?.regNumber) {
      return res
        .status(401)
        .json({ error: info?.data?.error || "Could not identify user" });
    }

    const { coupon, restaurant, created } = await getOrCreateCoupon(
      userInfoData.regNumber
    );

    const qrImage = await couponQRDataUrl(coupon.coupon_code);

    res.status(200).json({
      coupon,
      restaurant,
      qrImage,
      created,
      discount: coupon.discount,
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ error: error?.message || "Internal server error" });
  }
}