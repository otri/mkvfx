# mkvfx

Make vfx libraries and programs

Install node, minimally 0.11.14, using nvm. You'll also get npm with it.

Install grunt using

```sh
 npm install -g grunt-cli
```

clone this repo. Run grunt in the root directory.

Now type mkvfx, and all will be revealed.

You should see a message like -

```
 mkvfx knows how to build:
 Alembic
 boost
 boost-build-club
 c-blosc
 glew
 glfw
 hdf5
 IlmBase
 libjpeg
 libpng
 libtiff
 llvm
 OpenColorIO
 OpenEXR
 OpenImageIO
 OpenShadingLanguage-WIP
 OpenSubdiv
 OpenVDB-WIP
 partio
 ptex
 PyIlmBase
 python
 sqlite
 tbb

 mkvfx [options] [packages]
 --help           this message
 --nofetch        skip fetching, default is fetch
 --nobuild        skip build, default is build
 --nodependencies skip dependencies
 -nfd             skip fetch and dependencies
 [packages]       to build, default is nothing


 Note that git repos are shallow cloned.
```






## License
Copyright (c) 2014 Nick Porcino  
Licensed under the MIT license.
