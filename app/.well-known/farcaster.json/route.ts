import { NextResponse } from "next/server";
import { APP_URL } from "../../../lib/constants";

export async function GET() {
  const farcasterConfig = {
      "accountAssociation": {
        "header": "eyJmaWQiOjI2ODAwOSwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDc5M0Y2MTBGNUUwQjM2RDc0OThkQUFhMTdFZDVBZjAyNTc5NjJlN0IifQ",
    "payload": "eyJkb21haW4iOiJiYXNlLWp1bXAtZml2ZS52ZXJjZWwuYXBwIn0",
    "signature": "MHg1ZWI5OTQxNWJiZjIwOTgxNWYwNmIxZTQ5ZDRmMGYxYTAzZjMxYjY2YjA1Mzk1ZGI5NTU1ZTE4ZmJhYTU4ZDBlNTQyOGMxN2ZlOGE3ZDhjNGExYmZlNTQzOTJiOTRiZmU5ODg3ZGE0ZDVjMDc4NmMyNTc3YTdlOTkxZmQ1OGU4MTFi"
  },
    
    frame: {
      version: "1",
      name: "Base jump",
      iconUrl: `${APP_URL}/images/icon.jpg`,
      homeUrl: `${APP_URL}`,
      imageUrl: `${APP_URL}/images/feed.jpg`,
      screenshotUrls: [],
      tags: ["base", "farcaster", "miniapp", "games"],
      primaryCategory: "games",
      buttonTitle: "Play Now",
      splashImageUrl: `${APP_URL}/images/splash.jpg`,
      splashBackgroundColor: "#6fcefd",
      webhookUrl: `${APP_URL}/api/webhook`,
      subtitle: "Base jump",
      description: "Play and Earn",
      tagline:"Play and Earn",
      ogTitle:"Base jump",
      ogDescription: "Play and Earn",
      ogImageUrl: `${APP_URL}/images/feed.jpg`,
      heroImageUrl: `${APP_URL}/images/feed.jpg`,
      requiredChains: ["eip155:8453"],
    },
    "baseBuilder": {
      "allowedAddresses": ["0x3C9d2436B3a4cAc62FBcfBA95903C391b3DFD002"]
    }
  };

  return NextResponse.json(farcasterConfig);
}
