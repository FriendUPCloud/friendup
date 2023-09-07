#!/bin/bash

# Check if site.ini exists
if [ -e "build/site.ini" ]; then
    # Read SiteName from site.ini
    site_name=$(awk -F '=' '/^\s*SiteName/ {gsub(/"/, "", $2); gsub(/^[[:space:]]+|[[:space:]]+$/, "", $2); print $2}' build/site.ini)
    site_short_name=$(awk -F '=' '/^\s*SiteShortName/ {gsub(/"/, "", $2); gsub(/^[[:space:]]+|[[:space:]]+$/, "", $2); print $2}' build/site.ini)
    background_color=$(awk -F '=' '/^\s*BackgroundColor/ {gsub(/"/, "", $2); gsub(/^[[:space:]]+|[[:space:]]+$/, "", $2); print $2}' build/site.ini)
    description=$(awk -F '=' '/^\s*Description/ {gsub(/"/, "", $2); gsub(/^[[:space:]]+|[[:space:]]+$/, "", $2); print $2}' build/site.ini)
    site_logo=$(awk -F '=' '/^\s*SiteLogo/ {gsub(/"/, "", $2); gsub(/^[[:space:]]+|[[:space:]]+$/, "", $2); print $2}' build/site.ini)
    site_css=$(awk -F '=' '/^\s*SiteCSS/ {gsub(/"/, "", $2); gsub(/^[[:space:]]+|[[:space:]]+$/, "", $2); print $2}' build/site.ini)
    
    cp interfaces/web_desktop/manifest.json build/resources/manifest.json
    
    # Replace string in manifest.json
    sed -i "s/\"name\": \"Friend OS\"/\"name\": \"$site_name\"/g" build/resources/manifest.json
    echo "Manifest updated with site name: $site_name"
    sed -i "s/\"short_name\": \"Friend\"/\"short_name\": \"$site_short_name\"/g" build/resources/manifest.json
    echo "Manifest updated with site short name: $site_short_name"
    sed -i "s/\"background_color\": \"#335675\"/\"background_color\": \"$background_color\"/g" build/resources/manifest.json
    echo "Manifest updated with background color: $background_color"
    sed -i "s/\"description\": \"A web OS for everyone.\"/\"description\": \"$description\"/g" build/resources/manifest.json
    echo "Manifest updated with background color: $description"
    cp build/resources/manifest.json build/resources/webclient/manifest.json
    
    # Fix login logo / css
    if [ -n "$site_logo" ]; then
    	echo "Copying build/cfg/$site_logo to build/resources/graphics/release_logo.png"
	    cp -f build/cfg/$site_logo build/resources/graphics/release_logo.png
	fi
    if [ -n "$site_css" ]; then
	    cp -f build/cfg/$site_css build/resources/webclient/css/static.css
    fi
else
    echo "site.ini not found in the build directory."
fi
