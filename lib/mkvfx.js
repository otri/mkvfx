#! /usr/bin/env node
/*
 * mkvfx
 * https://github.com/meshula/mkvfx
 *
 * Copyright (c) 2014 Nick Porcino
 * Licensed under the MIT license.
 */

'use strict';

var cwd = process.cwd();

function userHome() {
  return process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
}

var home = userHome();

var mkvfx_root = cwd + "/local";
var mkvfx_source_root = home + "/mkvfx-sources";
var mkvfx_build_root = home + "/mkvfx-build";

var 
    ansi = require('ansi'),
//    assert = require('assert'),
    cursor = ansi(process.stdout),
//    exec = require("child_process").exec,
    execSync = require("child_process").execSync,
    fs = require('fs'),
    mkdirp = require('mkdirp'),
//    sys = require('sys'),
    usleep = require('sleep').usleep;


// var token = 0;

var lower_case_map = {};
var built_packages = {};
var package_recipes;

var option_do_fetch = 1;
var option_do_build = 1;
var option_do_install = 1;
var option_do_dependencies = 1;

// when other platforms are tested, this should be a platform detection block
// resolving to recipe_osx, recipe_darwin, recipe_linux, recipe_windows, recipe_ios, etc.
var platform_recipe = "recipe_osx";
var platform_install = "install_osx";


exports.version = function() { return "0.1.0"; };

var args = process.argv.slice(2);

String.prototype.trim = function () {
    return this.replace(/^\s*/, "").replace(/\s*$/, "");
};

function substitute_variables(subst) {
    var result = subst.replace("$(MKVFX_ROOT)", mkvfx_root);
    result = result.replace("$(MKVFX_SRC_ROOT)", mkvfx_source_root);
    result = result.replace("$(MKVFX_BUILD_ROOT)", mkvfx_build_root);
    if (result != subst) {
        result = substitute_variables(result);
    }
    return result;
}

function execTask(task, workingDir) {
    cursor.yellow();
    console.log("Running: %s", task);
    cursor.fg.reset();

    var result;

    try {
        usleep(0); // allow kernel to have a kick at the can, necessary for ln to succeed

        if (workingDir) {
            result = execSync(task, {encoding:"utf8", cwd:workingDir});
        } else {
            result = execSync(task, {encoding:"utf8"});
        }
    }
    catch (e) {
        if (e.message != "spawnSync ENOTCONN") {
            // seems to be a bug in node.js version 0.11.14
            // calling ln results in an ENOTCONN.
            console.log(e.message);
            console.log(e.name);
            console.log(e.fileName);
            console.log(e.lineNumber);
            console.log(e.columnNumber);
            console.log(e.stack);
            throw e;
        }
        result = "";
    }

    process.stdout.write(result);
    return;
/*

    var tokenFile = "mkvfxToken" + token.toString();
    var taskStr = "rm -f " + tokenFile + ";" + task + ";echo hello > " + tokenFile;

    token += 1;

    var returnVal = 0;
    var finished = 0;
    var child = exec(taskStr,
        function (error, stdout, stderr) {
            returnVal = error;
            finished = 1;
            console.log('stdout: ' + stdout);
            console.log('stderr: ' + stderr);
            if (error !== null) {
              console.log('exec error: ' + error);
            }
    });

    while (!fs.existsSync(tokenFile)) {
        usleep(250000);
        console.log("***");
    }

    cursor.yellow();
    console.log("Finished: %s", task);
    cursor.fg.reset();

    return returnVal;
*/

    /*
    var stepSync = semaphore(1)
    stepSync.take(function() {
        var step = substitute_variables(task)
        console.log("Running: %s", step)
        exec(step, function(err, stdout, stderr) {
            if (err) {
                cursor.red()
                console.log("Build step failed.")
                cursor.fg.reset()
                console.log(stderr)
                stepSync.leave()
                throw err
            }
            console.log(stdout)
            console.log("^^^^ task complete")
            stepSync.leave()
        });
    });

    stepSync.take(function() {
        console.log("task sync")
        stepSync.leave()
    });
*/
}


function validate_tool_chain() {
    console.log("Validating directory structure");
    if (!fs.existsSync(mkvfx_root)) {
        fs.mkdir(mkvfx_root, function(err) {
            if (err) {
                cursor.red();
                console.log("MKVFX Could not find create dir: %s", mkvfx_root);
                cursor.fg.reset();
                throw err;
            }
        });
    }
    if (!fs.existsSync(mkvfx_root+"/bin")) {
        fs.mkdir(mkvfx_root+"/bin", function(err) {
            if (err) {
                cursor.red();
                console.log("MKVFX Could not find create dir: %s", mkvfx_root+"/bin");
                cursor.fg.reset();
                throw err;
            }
        });
    }
    if (!fs.existsSync(mkvfx_root+"/include")) {
        fs.mkdir(mkvfx_root+"/include", function(err) {
            if (err) {
                cursor.red();
                console.log("MKVFX Could not find create dir: %s", mkvfx_root+"/include");
                cursor.fg.reset();
                throw err;
            }
        });
    }
    if (!fs.existsSync(mkvfx_root+"/lib")) {
        fs.mkdir(mkvfx_root+"/lib", function(err) {
            if (err) {
                cursor.red();
                console.log("MKVFX Could not find create dir: %s", mkvfx_root+"/lib");
                cursor.fg.reset();
                throw err;
            }
        });
    }
    if (!fs.existsSync(mkvfx_root + "/man")) {
        fs.mkdir(mkvfx_root + "/man", function(err) {
            if (err) {
                cursor.red();
                console.log("MKVFX Could not find create dir: %s", mkvfx_root + "/man");
                cursor.fg.reset();
                throw err;
            }
        });
    }
    if (!fs.existsSync(mkvfx_root + "/man/man1")) {
        fs.mkdir(mkvfx_root + "/man/man1", function(err) {
            if (err) {
                cursor.red();
                console.log("MKVFX Could not find create dir: %s", mkvfx_root + "/man/man1");
                cursor.fg.reset();
                throw err;
            }
        });
    }
    if (!fs.existsSync(mkvfx_source_root)) {
        fs.mkdir(mkvfx_source_root, function(err) {
            if (err) {
                cursor.red();
                console.log("MKVFX Could not find create dir: %s", mkvfx_source_root);
                cursor.fg.reset();
                throw err;
            }
        });
    }
    if (!fs.existsSync(mkvfx_build_root)) {
        fs.mkdir(mkvfx_build_root, function(err) {
            if (err) {
                cursor.red();
                console.log("MKVFX Could not find create dir: %s", mkvfx_build_root);
                cursor.fg.reset();
                throw err;
            }
        });
    }
    console.log("Checking for tools");
    var err = execTask('git --version');
    if (err) {
        cursor.red();
        console.log("MKVFX Could not find git, please install it and try again");
        cursor.fg.reset();
        throw err;
    }
    err = execTask('cmake --version');
    console.log("Validation complete");
}

/*
var child = exec('ls -a | grep ' + searchParam, function(err, stdout, stderr) {
    if (err) throw err;
    console.log(stdout);
});
*/

validate_tool_chain();

function runRecipe(recipe, package_name, p, dir_name) {
    console.log("Building %s recipe", package_name);
    var build_dir = mkvfx_root;
    if ("build_in" in p) {
        build_dir = substitute_variables(p.build_in);
        console.log("in directory %s", build_dir);
    }
    else {
        build_dir = mkvfx_source_root + "/" + dir_name;
    }

    if (!fs.existsSync(build_dir)) {
        try {
            mkdirp.sync(build_dir);
        }
        catch (err) {
            cursor.red();
            console.error("Couldn't create build directory ", build_dir);
            cursor.fg.reset();
            throw new Error("Couldn't create build directory for " + package_name);
        }
    }

    process.chdir(build_dir);

    // join all lines ending in +
    var r;
    for (r = recipe.length-2; r >= 0; --r) {
        var task = recipe[r];
        if (task.slice(-1) == "+") {
            recipe[r] = task.slice(0,-1) + " " + recipe[r+1];
            recipe.splice(r+1, 1);
        }
    }

    for (r = 0; r < recipe.length; ++r) {
        if (option_do_build) {  // should be an option for simulate build
            execTask(substitute_variables(recipe[r]), build_dir);
        } else {
            console.log("Simulating: %s", substitute_variables(recipe[r]));
        }
    }

    process.chdir(cwd);
}

function bake(package_name) {
    console.log("Baking %s", package_name);
    if (package_name in built_packages) {
        return;
    }

    for (var i = 0; i < package_recipes.length; ++i) {
        if (package_recipes[i].name === package_name) {
            var p = package_recipes[i];
            if (option_do_dependencies) {
                if ("dependencies" in p) {
                    var dependencies = p.dependencies;
                    for (var d = 0; d < dependencies.length; ++d) {
                        bake(dependencies[d]);
                    }
                }
                console.log("Dependencies of %s baked, moving on the entree", package_name);
            }

            var repo_dir = "";
            var dir_name;
            if ("dir" in p) {
                dir_name = substitute_variables(p.dir);
            }
            else {
                throw new Error("No dir specified for \"" + package_name + "\" in recipe");
            }

            if ("repository" in p) {
                console.log("Fetching %s", package_name);

                var dir_path = mkvfx_source_root + "/" + dir_name;

                var repository = p.repository;

                if (option_do_fetch) {
                    if ("type" in repository && "url" in repository) {
                        var type = repository.type;
                        if (type == "git") {
                            var cmd;
                            if (fs.existsSync(dir_path)) {
                                cmd = "git -C " + dir_path + " pull";
                            }
                            else {
                                var branch = "";
                                if ("branch" in repository) {
                                    branch = " --branch " + repository.branch + " ";
                                }
                                cmd = "git -C " + mkvfx_source_root + " clone --depth 1 " + branch + repository.url + " " + dir_name;
                            }
                            execTask(cmd);
                        }
                        else if (type == "curl-tgz") {
                            console.log("**** %s ****", dir_path);
                            if (!fs.existsSync(dir_path)) {
                                fs.mkdir(dir_path, function(err) {
                                    if (err) {
                                        cursor.red();
                                        console.log("MKVFX Could not find create dir: %s", dir_path);
                                        cursor.fg.reset();
                                        throw err;
                                    }
                                });
                            }
                            cmd = "curl -L -o " + dir_path + "/" + package_name + ".tgz " + repository.url;
                            execTask(cmd);
                            process.chdir(dir_path);
                            cmd = "tar -zxvf " + package_name + ".tgz";
                            execTask(cmd);
                            process.chdir(cwd);
                        }
                    }
                }
                if ("repo_dir" in repository) {
                    repo_dir = "/" + repository.repo_dir;
                }
            }
            else {
                console.log("Repository not specified for %s, not fetching", package_name);
            }

            if (option_do_build) {
                if (platform_recipe in p) {
                    runRecipe(p.recipe_osx, package_name, p, dir_name);
                }
                else if ("recipe" in p) {
                    runRecipe(p.recipe, package_name, p, dir_name);
                }
                else {
                    cursor.red();
                    console.log("No recipe exists for " + package_name);
                    cursor.fg.reset();
                    throw new Error("No recipe exists for " + package_name);
                }
            }

            if (option_do_install) {                
                if (platform_install in p) {
                    console.log("Installing %s", package_name);
                    var build_dir = mkvfx_root;
                    if ("build_in" in p) {
                        build_dir = substitute_variables(p.build_in);
                        console.log("in directory %s", build_dir);
                    }
                    else {
                        build_dir = mkvfx_source_root + "/" + dir_name;
                    }

                    if (!fs.existsSync(build_dir)) {
                        try {
                            mkdirp.sync(build_dir);            
                        }
                           catch (err) {
                            cursor.red();
                               console.error("Couldn't create build directory ", build_dir);
                            cursor.fg.reset();
                            throw new Error("Couldn't create build directory for " + package_name);
                        }
                    }

                    process.chdir(build_dir);
                    var recipe = p.install_osx;

                    // join all lines ending in +
                    var r;
                    for (r = recipe.length-2; r >= 0; --r) {
                        var task = recipe[r];
                        if (task.slice(-1) == "+") {
                            recipe[r] = task.slice(0,-1) + " " + recipe[r+1];
                            recipe.splice(r+1, 1);
                        }
                    }

                    for (r = 0; r < recipe.length; ++r) {
                        execTask(substitute_variables(recipe[r]), build_dir);
                    }

                    process.chdir(cwd);
                }
                else {
                    cursor.red();
                    console.log("No install_osx exists for " + package_name);
                    cursor.fg.reset();
                    throw new Error("No install_osx exists for " + package_name);
                }
            }
        }        
    }

    built_packages[package_name] = "built";
}

function printHelp() {
    console.log("mkvfx knows how to build:");
    cursor.yellow();
    for (var i = 0; i < package_recipes.length; ++i) {
        console.log("%s", package_recipes[i].name);
    }
    cursor.fg.reset();
    console.log("\n\nmkvfx [options] [packages]\n");
    console.log("--help           this message");
    console.log("--install        install previously built package if possible");
    console.log("--nofetch        skip fetching, default is fetch");
    console.log("--nobuild        skip build, default is build");
    console.log("--nodependencies skip dependencies");
    console.log("-nfd             skip fetch and dependencies");
    console.log("[packages]       to build, default is nothing");
    console.log("\n\nNote that git repos are shallow cloned.");
}

// __dirname is the directory the script is located in
fs.readFile(__dirname + '/recipes.json', 'utf8', function(err, data) {
    var recipes = JSON.parse(data);
    package_recipes = recipes.packages;
    for (var i = 0; i < package_recipes.length; ++i) {
        var name = package_recipes[i].name;
        lower_case_map[name.toLowerCase()] = name;
    }

    var to_build = [];
    var arg;
    for (arg = 0; arg < args.length; ++arg) {
        var argLower = args[arg].toLowerCase();
        if (argLower == "--help") {
            printHelp();
        }
        else if (argLower === "--nofetch" || argLower === "-nf") {
            option_do_fetch = 0;
        }
        else if (argLower === "--nobuild" || argLower === "-nb") {
            option_do_build = 0;
        }
        else if (argLower == "--nodependencies" || argLower === "-nd") {
            option_do_dependencies = 0;
        }
        else if (argLower === "-nfd") {
            option_do_fetch = 0;
            option_do_dependencies = 0;
        }
        else if (argLower == "--noinstall" || argLower == "-ni") {
            option_do_install = 0;
        }
        else if (argLower == "--install") {
            option_do_fetch = 0;
            option_do_build = 0;
            option_do_dependencies = 0;
            option_do_install = 1;
        }
        else if (argLower in lower_case_map) {
            to_build.push(args[arg]);
        }
        else {
            cursor.red();
            console.log("Unknown option %s", args[arg]);
            cursor.fg.reset();
            throw new Error("Unknown option: " + args[arg]);
        }
    }
    for (arg = 0; arg < to_build.length; ++arg) {
        bake(lower_case_map[to_build[arg].toLowerCase()]);
    }

    if (!args.length) {
        printHelp();
    }
});
