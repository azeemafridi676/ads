const webpack = require('webpack');

module.exports = {
  plugins: [
    new webpack.DefinePlugin({
      'process.env.TIMEZONE': JSON.stringify(process.env.TIMEZONE || 'America/New_York')
    })
  ]
};