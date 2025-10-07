const path = require('path');

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  
  entry: {
    code: './src/code.ts'
  },
  
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  
  resolve: {
    extensions: ['.ts', '.js']
  },
  
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  }
};
