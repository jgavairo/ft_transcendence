const path = require('path');

module.exports = {
  mode: 'development', // Assurez-vous que le mode est défini
  entry: './src/main.ts', // Assurez-vous que ce chemin est correct
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  devServer: {
    static: path.join(__dirname, 'dist'), // Utilisez 'static' au lieu de 'contentBase'
    compress: true,
    port: 8080,
  },
};
