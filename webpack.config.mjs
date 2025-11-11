import path from "node:path";
import { fileURLToPath } from "node:url";

import CopyWebpackPlugin from "copy-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === "production";

const stripDistPrefix = (value) => value.replace(/^dist\//u, "");

const transformSystemManifest = (content) => {
  const manifest = JSON.parse(content.toString());

  if (Array.isArray(manifest.esmodules)) {
    manifest.esmodules = manifest.esmodules.map(stripDistPrefix);
  }

  if (Array.isArray(manifest.styles)) {
    manifest.styles = manifest.styles.map(stripDistPrefix);
  }

  return JSON.stringify(manifest, null, 2);
};

export default {
  mode: isProduction ? "production" : "development",
  target: ["web", "es2021"],
  entry: "./src/soulslike.ts",
  output: {
    filename: "soulslike.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
    module: true,
    library: {
      type: "module"
    }
  },
  experiments: {
    outputModule: true
  },
  devtool: "source-map",
  resolve: {
    extensions: [".ts", ".js"],
    extensionAlias: {
      ".js": [".ts", ".js"],
      ".mjs": [".mts", ".mjs"],
      ".cjs": [".cts", ".cjs"]
    }
  },
  module: {
    rules: [
      {
        test: /\.ts$/u,
        use: {
          loader: "ts-loader",
          options: {
            configFile: "tsconfig.json",
            transpileOnly: false
          }
        },
        exclude: /node_modules/u
      },
      {
        test: /\.less$/u,
        use: [MiniCssExtractPlugin.loader, "css-loader", "less-loader"]
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "soulslike.css"
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "system.json",
          to: "system.json",
          transform: transformSystemManifest
        },
        {
          from: "src/static/template.json",
          to: "template.json"
        },
        {
          from: "templates",
          to: "templates"
        },
        {
          from: "lang",
          to: "lang",
          noErrorOnMissing: true
        },
        {
          from: "packs",
          to: "packs",
          noErrorOnMissing: true
        },
        {
          from: "assets",
          to: "assets",
          noErrorOnMissing: true
        }
      ]
    })
  ],
  optimization: {
    splitChunks: false,
    runtimeChunk: false
  },
  stats: "minimal"
};
