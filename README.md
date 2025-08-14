# MindRender

## Simulation Frame

Interactive simulations are rendered inside a dedicated `/sim-frame` page. The main
application embeds this page using an `<iframe>` with `sandbox="allow-scripts"` and
passes the simulation payload once the frame finishes loading.

### Messaging Protocol

1. The parent page listens for the iframe `load` event.
2. After load, it posts a message containing `canvasHtml` and `jsCode` to the frame.
3. The frame listens for this message, injects the canvas markup into the DOM and
   executes the provided JavaScript.

### Content Security Policy

The `/sim-frame` route is served with its own Content Security Policy and framing
rules:

```
Content-Security-Policy: default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:;
X-Frame-Options: SAMEORIGIN
```

All other routes retain a restrictive CSP and `X-Frame-Options: DENY`, preventing
embedding of the primary application.

### CSP inheritance bug

Originally the application also shipped a `<meta http-equiv="Content-Security-Policy">`
tag inside `index.html`. Because Vercel rewrites every path to `index.html`, this meta
policy combined with the route-specific headers. As a result the browser treated the
iframe's document as `about:srcdoc` and enforced the main app's `script-src 'self'`
directive, blocking the injected simulation script.

The meta tag has been removed so that CSP is controlled exclusively by headers.
This allows `/sim-frame` to execute inline scripts under its relaxed policy while
the rest of the application remains locked down.
