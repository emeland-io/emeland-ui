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
    tokenSha256: "fc4e1856dfbc7162bba81299665844f37749cb6dfeea33e8597b6df0f3702797",
  },
  api: {
    baseUrl: "http://localhost:8080",
  },
};
