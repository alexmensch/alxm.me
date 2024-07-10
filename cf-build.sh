#!/bin/bash
export FONTCONFIG_FILE=${pwd}/fonts.conf
export FC_DEBUG=1024

# Debug stuff
fc-list

sass src/assets/scss/main.scss src/assets/css/main.css
npx @11ty/eleventy