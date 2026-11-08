// Driver dùng Mapbox (@rnmapbox/maps + navigation). MapLibre chỉ dùng ở customer
// (qua @datxe/ui/goong-map) nên phải loại khỏi autolinking RN để tránh trùng
// TurboModule NativeMapViewModule (duplicate symbol khi link).
module.exports = {
  dependencies: {
    '@maplibre/maplibre-react-native': {
      platforms: { ios: null, android: null },
    },
  },
};
