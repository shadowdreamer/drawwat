import { presetAttributify, presetIcons, presetWind4, transformerDirectives, transformerVariantGroup } from "unocss";
 
import { defineConfig } from "unocss/vite";
import { presetDaisy } from "@ameinhardt/unocss-preset-daisy";

export default defineConfig({
  presets: [
    presetWind4(),
    presetAttributify(),
    presetDaisy(), 
    presetIcons({
      scale: 1.5,
    }),
 
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
});