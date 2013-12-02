#!/usr/bin/bash

wget https://github.com/elmisto/fire-hexagon/archive/master.zip
unzip master.zip -d ./
rm master.zip
cp -r fire-hexagon-master/* webapp/
rm -r fire-hexagon-master

