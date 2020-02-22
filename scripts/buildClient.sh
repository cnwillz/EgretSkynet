#!/bin/bash
cd ../tools/converter
node xlsx2lua client ../../config out_c
node lua2json out_c out_j
node pack out_j ../../client/resource/config/config.pack