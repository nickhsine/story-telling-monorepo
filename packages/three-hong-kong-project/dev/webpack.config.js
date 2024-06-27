import * as url from 'url'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import path from 'path'
import webpack from 'webpack'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

export default {
  mode: 'development',
  entry: {
    main: path.resolve(__dirname, './entry'),
  },
  output: {
    path: path.resolve(__dirname, './dist'),
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
  devServer: {
    hot: false,
    host: '0.0.0.0',
    port: 8080,
    allowedHosts: 'all',
    static: {
      directory: path.join(__dirname),
    },
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx|js|jsx)$/,
        resolve: {
          fullySpecified: false,
        },
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-typescript',
              '@babel/preset-env',
              [
                '@babel/preset-react',
                { development: true, runtime: 'automatic' },
              ],
            ],
          },
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, './index.html'),
    }),
    new webpack.EnvironmentPlugin({
      NODE_ENV: process.env.NODE_ENV,
      RESOURCES_HOSTED_AT: process.env.RESOURCES_HOSTED_AT || 'localhost',
    }),
  ],
  devtool: 'eval-source-map',
}
