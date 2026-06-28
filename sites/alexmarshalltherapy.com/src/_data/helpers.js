// Exposes the shared helpers as the `helpers` global data object and to the
// site's .11tydata.js / _data modules. The implementation lives in
// @alxm/eleventy-config; keep this re-export so the data cascade still has a
// `helpers` global.
export { default } from "@alxm/eleventy-config/helpers";
