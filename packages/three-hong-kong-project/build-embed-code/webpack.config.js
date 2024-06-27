/* eslint-disable */
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
import fs from 'fs'
import path, { dirname } from 'path'
import pkg from '../package.json' assert { type: 'json' }
import webpack from 'webpack'
import { WebpackManifestPlugin } from 'webpack-manifest-plugin'
import { fileURLToPath } from 'url'

// Create __filename and __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const port = process.env.PORT || 8080

const isProduction = process.env.NODE_ENV === 'production'
const resourcesHostedAt = process.env.RESOURCES_HOSTED_AT

const distFolderName = 'webpack-bundles'

let publicPath = ''
switch(resourcesHostedAt) {
  case 'unpkg':
  case 'github': {
    publicPath = `https://unpkg.com/${pkg.name}@${pkg.version}/${distFolderName}/`
    break
  }
  case 'gcs': {
    publicPath = `https://story-telling-storage.twreporter.org/projects/three-hong-kong-project/${distFolderName}/`
    break
  }
  case 'localhost':
  default: {
    publicPath = `http://localhost:${port}/${distFolderName}/`
  }
}

const distDir = `../${distFolderName}`
const manifestFileName = 'manifest.json'

function AfterManifestPlugin() {}

AfterManifestPlugin.prototype.apply = function(compiler) {

  compiler.hooks.afterEmit.tap('AfterManifestPlugin', async (compilation) => {
    const manifestFilePath = path.resolve(__dirname, distDir, manifestFileName)
    const manifest = await import(manifestFilePath, { assert: { type: 'json' } }).then((manifest) => {
      return manifest?.default || manifest
    })
    const newManifest = Object.assign({}, manifest, {
      version: pkg.version
    })

    fs.writeFileSync(
      manifestFilePath,
      JSON.stringify(newManifest)
    )
  })
}

const webpackConfig = {
  mode: isProduction ? 'production' : 'development',
  entry: {
    main: {import: path.resolve(__dirname, './entry.js')},
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, distDir),
    library: '@story-telling-reporter/react-three-hong-kong-project',
    libraryTarget: 'umd',
    publicPath,
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx|js|jsx)$/,
        resolve: {
          fullySpecified: false,
          extensions: ['.tsx', '.ts', '.js', '.mjs'],
        },
        exclude: /node_modules/,
        use: [{
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-typescript',
              '@babel/preset-env',
              [
                '@babel/preset-react',
                { runtime: 'automatic' },
              ],
            ],
            plugins: [
              [
                'styled-components',
                { ssr: true, displayName: true, preprocess: false },
              ],
            ],
          },
        }]
      },
    ],
  },
  optimization: {
    usedExports: true,
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: Infinity,
      minSize: 0,
      minChunks: 1,
      cacheGroups: {
        'threejs-vendor': {
          test: /[\\/]node_modules[\\/](three|three-story-controls)[\\/]/,
          name: 'threejs-vendor',
          filename: '[name].js',
        },
        'react-vendor': {
          test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
          name: 'react-vendor',
          filename: '[name].js',
        },
        'regenerator-runtime': {
          test: /[\\/]node_modules[\\/](regenerator-runtime)[\\/]/,
          name: 'regenerator-runtime',
          filename: '[name].js',
        },
        'styled-components': {
          test: /[\\/]node_modules[\\/](styled-components)[\\/]/,
          name: 'styled-components',
          filename: '[name].js',
        },
        lodash: {
          test: /[\\/]node_modules[\\/](lodash)[\\/]/,
          name: 'lodash',
          filename: '[name].js',
        },
        gsap: {
          test: /[\\/]node_modules[\\/](gsap)[\\/]/,
          name: 'gsap',
          filename: '[name].js',
        },
        //vendor: {
        //  test: /[\\/]node_modules[\\/]/,
        //  name: 'vendor',
        //  filename: '[name].js',
        //  priority: -10,
        //},
      },
    },
  },
  plugins: [
    new webpack.EnvironmentPlugin({
      NODE_ENV: process.env.NODE_ENV,
      RESOURCES_HOSTED_AT: resourcesHostedAt || 'gcs',
    }),
    new WebpackManifestPlugin({
      useEntryKeys: true,
      fileName: manifestFileName,
    }),
    new AfterManifestPlugin(),
    // new BundleAnalyzerPlugin(),
  ],
}

export default webpackConfig
export { webpackConfig }
