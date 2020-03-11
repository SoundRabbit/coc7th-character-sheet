const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
    mode: "production",
    devtool: "source-map",
    entry: "./assets",
    output: {
        path: path.join(__dirname, "./docs")
    },
    resolve: {
        extensions: [".js", ".ts", ".tsx", ".scss", "css"],
        plugins: [new TsconfigPathsPlugin({ configFile: "./tsconfig.json" })]
    },
    module: {
        rules: [
            {
                test: /\.ts(x?)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "ts-loader"
                    }
                ]
            },
            {
                enforce: "pre",
                test: /\.js$/,
                loader: "source-map-loader"
            },
            {
                test: /\.s?css$/,
                use: [
                    {
                        loader: "style-loader",
                    },
                    {
                        loader: "css-loader",
                    },
                    {
                        loader: 'resolve-url-loader',
                    },
                    {
                        loader: "sass-loader",
                        options: {
                            sourceMap: true,
                        },
                    },
                ],
            },
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.join(__dirname, "./assets/index.html"),
            inlineSource: ".(js|css)$"
        }),
        // new HtmlWebpackInlineSourcePlugin(),
    ],
    externals: {
        "react": "React",
        "react-dom": "ReactDOM"
    },
    devServer: {
        historyApiFallback: false
    }
};