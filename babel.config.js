module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./src"],
          alias: {
            "@": ["./src"],
            "@/components": ["./src/components"],
            "@/lib": ["./src/lib"],
            "@/utils": ["./src/utils"],
            "@/hooks": ["./src/hooks"],
            "@/pages": ["./src/pages"],
            "@/services": ["./src/services"],
            "@/contexts": ["./src/contexts"],
            "@/types": ["./src/types"],
            "@/assets": ["./src/assets"],
            "@/integrations": ["./src/integrations"]
          }
        }
      ],
      ["module:react-native-dotenv", {
        "moduleName": "@env",
        "path": ".env",
        "blacklist": null,
        "whitelist": null,
        "safe": false,
        "allowUndefined": true
      }]
    ],
  };
};
