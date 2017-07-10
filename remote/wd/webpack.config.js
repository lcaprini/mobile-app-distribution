var path = require('path')
var webpack = require('webpack')

module.exports = {
    entry: './src/main.js',
    output: {
        path: path.resolve(__dirname, './'),
        publicPath: '/',
        filename: 'build.js'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/
            },
            {
                test : /\.(png|jpe?g|gif|svg)$/,
                loader : 'url-loader',
                options : {
                    name : '[name].[ext]?[hash]'
                }
            },
            {
                test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
                loader: 'url-loader',
                options: { name: '[name].[ext]?[hash]' }
            },
            {
                test : /\.[s]?[c|a]ss$/,
                loader : ['style-loader', 'css-loader', 'sass-loader']
            },
            {
                test : /\.vue$/,
                loader : 'vue-loader'
            }
        ]
    },
    resolve: {
        alias: {
            'vue$' : 'vue/dist/vue',
            'src' : path.resolve(__dirname, 'src/'),
            'assets' : path.resolve(__dirname, 'src/assets/')
        }
    },
    devServer: {
        historyApiFallback: true,
        noInfo: true
    },
    devtool: '#eval-source-map'
}

if (process.env.NODE_ENV === 'production') {
    module.exports.devtool = '#source-map'
    // http://vue-loader.vuejs.org/en/workflow/production.html
    module.exports.plugins = (module.exports.plugins || []).concat([
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: '"production"'
            }
        }),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            }
        }),
        new webpack.LoaderOptionsPlugin({
            minimize: true
        })
    ])
}
