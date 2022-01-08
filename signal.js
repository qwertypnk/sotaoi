#!/usr/bin/env node

const main = async () => {
  const path = require("path");
  const packageJson = require("./package.json");
  const sotaoiDirectory = path.resolve(
    process.argv[1],
    "../",
    "../",
    packageJson.name,
    "sotaoi"
  );
  const fs = require("fs");

  const { SignalContract } = require("@sotaoi/signal");

  const sotaoiVersions = {};
  fs.readdirSync(sotaoiDirectory).map(
    (version) =>
      fs.lstatSync(path.resolve(sotaoiDirectory, version)).isDirectory() &&
      (sotaoiVersions[version] = path.resolve(sotaoiDirectory, version))
  );

  class Signal extends SignalContract {}

  new Signal(packageJson, { ...require("./core.signal") })
    .console()
    .command(
      "unpack [sotaoiVersion] [deploymentPath]",
      "Unpack SOTAOI with the given version",
      (yargs) => {
        return yargs
          .positional("sotaoiVersion", {
            describe: "SOTAOI version",
            default: null
          })
          .positional("deploymentPath", {
            describe: "Directory path for deployment",
            default: null
          });
      },
      (argv) => {
        typeof argv.deploymentPath === "string" && argv.deploymentPath
          ? (argv.deploymentPath = path.resolve(argv.deploymentPath))
          : (argv.deploymentPath = path.resolve("./"));
        typeof argv.sotaoiVersion === "number" &&
          (argv.sotaoiVersion = argv.sotaoiVersion.toString());
        if (typeof argv.sotaoiVersion !== "string" || !argv.sotaoiVersion) {
          throw new Error("Failed to unpack SOTAOI, bad version argument");
        }
        if (typeof argv.deploymentPath !== "string" || !argv.deploymentPath) {
          throw new Error(
            "Failed to unpack SOTAOI, bad deployment path argument"
          );
        }
        const parentDirectory = path.resolve(argv.deploymentPath, "../");
        fs.existsSync(parentDirectory) &&
          fs.lstatSync(parentDirectory).isDirectory() &&
          !fs.existsSync(argv.deploymentPath) &&
          fs.mkdirSync(argv.deploymentPath);
        if (
          !fs.existsSync(argv.deploymentPath) ||
          !fs.lstatSync(argv.deploymentPath).isDirectory() ||
          fs.readdirSync(argv.deploymentPath).length
        ) {
          throw new Error("Failed to unpack SOTAOI, invalid deployment path");
        }
        switch (true) {
          case !sotaoiVersions[argv.sotaoiVersion]:
            throw new Error(
              "Failed to unpack SOTAOI, given version does not exist"
            );
          case !!sotaoiVersions[argv.sotaoiVersion]:
            //
            copyDirectory(
              fs,
              path,
              sotaoiVersions[argv.sotaoiVersion],
              argv.deploymentPath
            );
            break;
          default:
            throw new Error("Failed to unpack SOTAOI, something went wrong");
        }
      }
    )
    .run();
};

const copyDirectory = (fs, path, src, dest, exclude = []) => {
  if (exclude.indexOf(path.resolve(src)) !== -1) {
    return;
  }
  const stats = fs.existsSync(src) ? fs.statSync(src) : false;
  const isDirectory = !!stats && stats.isDirectory();
  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((childItemName) => {
      copyDirectory(
        fs,
        path,
        path.join(src, childItemName),
        path.join(dest, childItemName),
        exclude
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
};

main();
