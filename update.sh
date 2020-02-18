#!/bin/sh

#https://github.com/bjwa2020/coronavirus.git
cd /var/apps/coronavirus
git pull
cp coronavirus/*.json /var/apps/corapp/coronavirus
curl "http://localhost:3000/data/update"