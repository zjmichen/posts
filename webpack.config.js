var webpack = require('webpack');

var babelPresets = ['react', 'es2015', 'stage-2'];
var plugins = [];
var output = {};
var entry = ['./app/src/App.jsx'];

if (process.env.NODE_ENV === 'production') {
  plugins = [
    new webpack.optimize.UglifyJsPlugin(),
    new webpack.optimize.OccurrenceOrderPlugin()
  ];

  output = {
    filename: 'app.js',
    path: __dirname + '/public/',
    publicPath: '/'
  };
} else {
  babelPresets = ['react', 'es2015', 'react-hmre', 'stage-2'];
  plugins = [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin()
  ];

  output = {
    filename: 'app.js',
    path: __dirname + '/public/',
    publicPath: 'http://localhost:3000/'
  };

  entry.push('webpack/hot/dev-server');
  entry.push('webpack-hot-middleware/client');
}

module.exports = {
  entry: entry,
  output: output,
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel',
        query: {
          presets: babelPresets,
          cacheDirectory: true
        }
      },
      {
        test: /\.less$/,
        loader: 'style-loader!css-loader!less-loader'
      }
    ]
  },
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  devtool: 'source-map',
  plugins: plugins
};