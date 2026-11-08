// Customer dùng MapLibre (GoongMap). Mapbox chỉ dùng ở driver nên phải loại khỏi
// autolinking RN để tránh trùng TurboModule NativeMapViewModule (duplicate symbol khi link).
module.exports = {
  dependencies: {
    '@rnmapbox/maps': {
      platforms: { ios: null, android: null },
    },
    '@rnmapbox/navigation': {
      platforms: { ios: null, android: null },
    },
  },
};
