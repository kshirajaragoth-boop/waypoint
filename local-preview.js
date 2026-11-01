(function (root, factory) {
  const isLocalPreview = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = isLocalPreview;
  if (root) root.WAYPOINT_IS_LOCAL_PREVIEW = isLocalPreview;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  return function isLocalPreview(protocol, search) {
    return ['file:', 'http:', 'https:'].includes(protocol) && new URLSearchParams(search).get('preview') === '1';
  };
});
