#!/bin/bash

cd core
doxygen -g coreInternal
doxygen -g coreWebCalls
cd ..

