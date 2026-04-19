// Image-level default for /config.js. Shipped inside the container so the UI
// fails closed when the operator forgets to mount a real runtime config. The
// Helm chart's ConfigMap overlays this file at /usr/share/nginx/html/config.js
// with an install-specific hash. Do NOT put the dev-time "dev-root-admin"
// default here — production must receive a per-deployment token.
window.EMELAND_UI_CONFIG = {
  oidc: {
    enabled: false,
    authority: "",
    clientId: "emeland-ui",
    scope: "openid profile email",
  },
  rootAdmin: {
    enabled: false,
    tokenSha256: ""
  },
  api: {
    baseUrl: ""
  }
};
