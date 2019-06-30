module.exports = {
  env: {
    cjs: {
      presets: ["@babel/preset-env"]
    },
    mjs: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              esmodules: true,
            },
            modules: false,
          }
        ]
      ]
    },
    umd: {
      presets: [
        [
          '@babel/preset-env',
          {
            modules: 'umd',
          }
        ]
      ]
    }
  }
};
