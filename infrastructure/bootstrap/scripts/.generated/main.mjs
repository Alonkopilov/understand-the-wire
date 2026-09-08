const ORIGIN = "https://origin.understand-the-wire.com";
const SNAPSHOT = "https://alonko-utw-snapshot-bucket.s3.eu-central-1.amazonaws.com";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Request the live website
    try {
        const live = await fetch(ORIGIN + url.pathname + url.search, request);
        if (live.status < 500) {
            return live
        }
    } catch {}

    // If the website is down, request the snapshot version
    const key = url.pathname === "/" ? "/index.html" : url.pathname;
    return fetch(SNAPSHOT + key);
  },
};
