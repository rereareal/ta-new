// `vp check` (tsgolint) does not run the Vue language service. This wildcard
// only exists for that type check; `vue-tsc` uses tsconfig.vue.json, which
// excludes this file and resolves the real SFC types instead.
declare module "*.vue" {
  import type { DefineComponent } from "vue";

  const component: DefineComponent<
    Record<string, never>,
    Record<string, never>,
    Record<string, never>
  >;
  export default component;
}
