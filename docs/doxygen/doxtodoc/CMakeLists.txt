cmake_minimum_required(VERSION 3.6)
project(doxtodoc)

set(CMAKE_CXX_STANDARD 11)

set(SOURCE_FILES main.cpp dirparser.c pugixml.cpp ../../../core/util/friendstring.c)
add_executable(doxtodoc ${SOURCE_FILES})
