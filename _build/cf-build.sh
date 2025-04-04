#!/bin/bash
export FONTCONFIG_FILE=`pwd`/_build/fonts.conf

cat <<EOF > _build/fonts.conf
<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd">
<fontconfig>
  <dir>`pwd`/_build/fonts/</dir>
  <cachedir>/tmp/fonts-cache/</cachedir>
  <config></config>
</fontconfig>
EOF

npx @11ty/eleventy
