#!/bin/bash
export FONTCONFIG_FILE=`pwd`/fonts.conf

cat <<EOF > fonts.conf
<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd">
<fontconfig>
  <dir>/opt/buildhome/repo/src/assets/fonts/inter/</dir>
   <cachedir>/tmp/fonts-cache/</cachedir>
   <config></config>
</fontconfig>
EOF

# DEBUG
fc-list :family=Inter
fc-match Inter

sass src/assets/scss/main.scss src/assets/css/main.css
npx @11ty/eleventy

rm fonts.conf
