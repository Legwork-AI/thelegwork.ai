/* Google Analytics 4 bootstrap. External file rather than the stock inline
   snippet because CSP is script-src 'self' (no inline scripts); the gtag.js
   library itself is allowlisted from googletagmanager.com in netlify.toml.
   Order-independent with the async library: gtag.js hooks dataLayer.push,
   so config queued here is processed whenever the library arrives. */
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag("js", new Date());
gtag("config", "G-Z7TSKMSDQX");
