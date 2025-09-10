module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Esta linha é essencial para a navegação de gaveta funcionar.
      'react-native-reanimated/plugin',
    ],
  };
};