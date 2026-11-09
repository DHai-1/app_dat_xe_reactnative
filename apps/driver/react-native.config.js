// Driver dùng MapLibre (Goong style, giống customer). Mapbox cũ (@rnmapbox/*) không còn
// dùng nên loại khỏi autolinking RN để tránh trùng TurboModule NativeMapViewModule
// (duplicate symbol khi link iOS).
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
