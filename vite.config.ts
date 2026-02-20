import { resolve } from "node:path";
// vite.config.ts
import Vue from "@vitejs/plugin-vue";
import UnoCss from "unocss/vite";
import AutoImport from "unplugin-auto-import/vite";
import IconsResolver from "unplugin-icons/resolver";
import Icons from "unplugin-icons/vite";
import Components from "unplugin-vue-components/vite";
import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    Vue({
      features:{
        customElement:['Tldraw']
      }
    }),
    cloudflare(),
    Icons({
      scale: 1.5, // Scale of icons against 1em
      defaultStyle: "", // Style apply to icons
      defaultClass: "inline-block h-5 w-5 stroke-current md:h-6 md:w-6", // Class names apply to icons
      compiler: "vue3", // "vue2", "vue3", "jsx"
      jsx: "react", // "react" or "preact"
      autoInstall: true,
    }),
    // https://github.com/antfu/unplugin-auto-import
    AutoImport({
      imports: [
        "vue",
        "vue-router",
        "@vueuse/head",
        "@vueuse/core",
      ],
      dts: "types/auto-imports.d.ts",
      dirs: [
        "src/composables",
        "src/store",
      ],
      vueTemplate: true,
    }),

    // https://github.com/antfu/unplugin-vue-components
    Components({
      extensions: ["vue"],
      include: [/\.vue$/, /\.vue\?vue/],
      dts: "types/components.d.ts",
      exclude: [/[\\/]node_modules[\\/]/, /[\\/]\.git[\\/]/, /[\\/]\.nuxt[\\/]/],
      resolvers: [
        IconsResolver(),
      ],
    }),

    // https://github.com/unocss/unocss
    // see unocss.config.ts for config
    UnoCss(),
  ],
  resolve: {
    alias: {
      "@/": `${resolve(__dirname, "src")}/`,
    },
  }
});