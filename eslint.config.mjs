// @ts-check

import withNuxt from "./.nuxt/eslint.config.mjs"
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended"

export default withNuxt(
  // Your custom configs here
  eslintPluginPrettierRecommended,
  {
    rules: {
      "vue/multi-word-component-names": "off",
      "vue/require-default-prop": "off",
    },
  },
)
