#!/bin/bash
set +e
HOST=web1d

ENVIRONMENT=$@
if [[ $ENVIRONMENT == *'staging'* ]] ; then
	DESTDIR="/usr/share/nginx/html/static/demos/staging/freight"
	echo
	echo "*** DEPLOYING STAGE ***"
	echo
	echo "For the staging demo to function ensure:"
	echo "1. app/scripts/app.js has app.baseUrl changed from:"
	echo "  app.baseUrl = '/demos/freight/';'"
	echo "to"
	echo "  app.baseUrl = '/demos/staging/freight/';"
	echo
	echo "2. app/index.html has scope-to-path changed from:"
	echo ' scope-to-path="/demos/freight/"'
	echo "to"
	echo ' scope-to-path="/demos/staging/freight/"'
	echo
	echo "Press any key to continue..."
	read -n 1
else
	DESTDIR="/usr/share/nginx/html/static/demos/freight"
	echo
	echo "*** DEPLOYING LIVE ***"
	echo
	echo "If you meant to deploy to stage run this command instead:"
	echo " ./deploy-freight.sh staging"
	echo
	echo "If you meant to deploy to live, press any key to continue..."
	read -n 1
fi

echo "...Updating from Git..."
git pull
echo "...Removing old Bower components and Dist..."
rm -rf ./app/bower_components
rm -rf ./dist
echo "...Updating Bower with new install..."
bower install
echo "...Processing Gulp for production..."
gulp || { exit 1; }
cd ./dist
echo "...Compressing Dist for transfer..."
tar -zcf ../freight.tar.gz .
cd ..
echo "...Copying Dist to server..."
scp -i ~/.ssh/ICEsoft_Linux_Test_Key_Pair.pem freight.tar.gz ubuntu@web1d:~/. || { exit 1; }

echo "...Unpacking Dist on server to $DESTDIR..."
ssh -i ~/.ssh/ICEsoft_Linux_Test_Key_Pair.pem ubuntu@web1d "sudo tar -zxf /home/ubuntu/freight.tar.gz -C $DESTDIR"
echo "...Cleaning up local compressed file..."
rm freight.tar.gz
