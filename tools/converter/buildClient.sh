#!/bin/bash
node xlsx2lua client excel out_c
node lua2json out_c out_j
node pack out_j config.pack