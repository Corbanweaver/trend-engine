import Script from "next/script";

const googleAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim();

export function GoogleAdsTag() {
  if (!googleAdsId) return null;

  return (
    <>
      <Script
        id="google-ads-gtag"
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
          googleAdsId,
        )}`}
        strategy="afterInteractive"
      />
      <Script id="google-ads-config" strategy="afterInteractive">
        {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${googleAdsId}');
`}
      </Script>
    </>
  );
}
