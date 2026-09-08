const ORIGIN = "https://origin.understand-the-wire.com"; // https://origin.understand-the-wire.com
const SNAPSHOT = "https://alonko-utw-snapshot-bucket.s3.eu-central-1.amazonaws.com"; // "https://alonko-utw-snapshot-bucket.s3.eu-central-1.amazonaws.com/"

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    if (env.SITE_MODE !== "snapshot") {
      try {
        const live = await fetch(ORIGIN + url.pathname + url.search, request);
        if (live.status < 500) {
            return live
        }
      } catch {
        // origin.<domain> no longer resolves — the cluster is gone
      }
    }

    const key = url.pathname === "/" ? "/index.html" : url.pathname;
    return fetch(SNAPSHOT + key);
  },
};
