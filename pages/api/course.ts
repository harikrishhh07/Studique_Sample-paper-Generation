import { NextApiRequest, NextApiResponse } from "next";
import { isValidToken } from "@/utils/security";
import { fetchCourseImproved } from "@/lib/courseImproved";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const token = req.cookies.token;

    if (!token || !isValidToken(token)) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const courseData = await fetchCourseImproved(token);

    return res.status(courseData.status || 200).json(courseData);

  } catch (error: any) {
    return res.status(500).json({
      error: error?.message || "Failed to fetch course",
    });
  }
}