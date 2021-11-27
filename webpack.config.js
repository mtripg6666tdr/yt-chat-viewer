const path = require("path");

module.exports = {
  mode: "production",
  entry: path.join(__dirname, "./src/client/index.ts"),
  output: {
    path: path.join(__dirname, "./common"),
    filename: "app.js"
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: "ts-loader",
          options: {
            configFile: "tsconfig.client.json"
          }
        }
      }
    ]
  },
  resolve: {
    extensions: [".js", ".ts"]
  }
}