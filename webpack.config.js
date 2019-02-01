const path = require('path');

module.exports = {
  entry: './client/app.js',
  mode: 'development',
  output: {
    path: path.resolve(__dirname, './client'),
    filename: 'app.build.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-react'
            ]
          }
        }
      },
      {
        test: /\.scss$/,
        use: [
          { loader: 'style-loader' }, // creates style nodes from JS strings
          { loader: 'css-loader' },// translates CSS into CommonJS
          { loader: 'sass-loader' } // compiles Sass to CSS
        ]
      },
      {
        test: /\.css$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' }
        ]
      },
      {
        test: /\.(svg|eot|ttf|woff|woff2)$/,
        loader: 'url-loader'
      }
    ]
  }
}
