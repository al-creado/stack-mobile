export const environment = {
  production: false,
  // `ng serve` proxies /stackapi -> indiancommodities.co.in (see proxy.conf.json),
  // so browser development has no CORS problems. On a device the absolute URL is used.
  apiUrl: '/stackapi',
  // Warehouse shown when the app opens (change to one of yours).
  defaultWarehouseId: 1,
};
