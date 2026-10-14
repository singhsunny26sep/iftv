// Central API configuration.
//
// app-api.md lists the Render live box (`iftv-ott.onrender.com/iftv-ott`) as an
// example, but the app's actual backend is `iftv.nvsricemart.com`. Pointing the
// client at the doc host would 404 every call, so the default below is the real
// host. Swap BASE_URL here only when wiring against a different backend (for
// example a local dev box over the ADB tunnel).
export const BASE_URL = __DEV__
  ? 'https://iftv.nvsricemart.com/iftv-ott'
  : 'https://iftv.nvsricemart.com/iftv-ott';

// `appVersion` is sent on support tickets for debugging. Set it from your
// build config if you want it to track the real release version.
export const APP_VERSION = '1.0.0';
