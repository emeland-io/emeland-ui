// Runtime configuration for the EmELand Observer Console.
// At deploy time this file is replaced by the Helm chart's ConfigMap.
window.EMELAND_UI_CONFIG = {
  oidc: {
    enabled: false,
    authority: "",
    clientId: "emeland-ui",
    scope: "openid profile email",
  },
  rootAdmin: {
    enabled: true,
    // SHA-256 of "dev-root-admin" — development default. Override in deployments.
    tokenSha256: "1917fd799bc758930885698fed25fca26bfc5f6bf550641a8dedeb6c63fb97ca",
  },
  api: {
    baseUrl: "http://localhost:8080",
  },
};
