module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // A linha abaixo DEVE SER A ÚLTIMA na lista de plugins.
      'react-native-reanimated/plugin',
    ],
  };
};