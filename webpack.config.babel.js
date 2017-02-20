// @flow

import webpack from 'webpack';

import { main } from './package.json';

export default {
  entry: './src/MQComponent.js',
  output: {
    filename: main,
    libraryTarget: 'umd',
    library: 'MQComponent',
  },
  devtool: 'source-map',
  externals: {
    react: 'umd react',
    'react-dom': 'umd react-dom',
  },
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
  ],
  resolve: {
    extensions: ['.js'],
  },
  module: {
    loaders: [{
      test: [/\.js$/, /\.jsx$/],
      loader: 'babel-loader',
      exclude: /node_modules/,
    }],
  },
};
