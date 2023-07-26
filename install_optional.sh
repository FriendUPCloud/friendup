#!/bin/bash

# Function to download the selected package
download_package() {
	local url="$1"
	local package_name="$2"
	wget "$url" -O "./optional/$package_name"
}

unpack() {
	cd optional && $1 && cd ..
}

# Function to check and install jq if it's missing
check_and_install_jq() {
	if ! command -v jq &>/dev/null; then
		echo "jq is not installed. Installing jq..."
		
		# Check the package manager and install jq accordingly
		if command -v apt-get &>/dev/null; then
			sudo apt-get update
			sudo apt-get install -y jq
		elif command -v yum &>/dev/null; then
			sudo yum install -y jq
		else
			echo "Unsupported package manager. Please install jq manually (https://stedolan.github.io/jq/download/)."
			exit 1
		fi

		if ! command -v jq &>/dev/null; then
			echo "Failed to install jq. Please install jq manually (https://stedolan.github.io/jq/download/)."
			exit 1
		fi

		echo "jq has been installed successfully!"
	fi
}

# Read packages from the JSON file
read_packages() {
	local json_file="$1"
	jq -r '.[] | "\(.title)\n\(.description)\n\(.package_url)"' "$json_file"
}

# Main script starts here
json_file="repository/optional.json"

# Check and install jq if it's missing
check_and_install_jq

# Create the "optional" directory if it doesn't exist
mkdir -p "./optional"

# Read packages and generate the menu using jq
menu=$(jq -r '.[] | "\(.title)\n\(.description)\n\(.package_url)\n\(.package)\n\(.unpack)\n\(.install)"' "$json_file")

# Create an array of menu options
IFS=$'\n' read -d '' -ra menu_options <<< "$menu"

t=0

while true; do
	# Clear the screen and display the menu
	clear
	echo -e "\033[1m\033[4mAvailable Packages:\033[0m"
	echo ""
	
	for (( i = 0; i < ${#menu_options[@]}; i+=6 )); do
		title="${menu_options[i]}"
		description="${menu_options[i+1]}"
		installed=""
		if [ -f "optional/${menu_options[i+3]}" ]; then
			installed=" (Installed)"
		fi
		echo -e "\e[1m$((i/6 + 1))) $title$installed\e[0m"
		echo "   $description"
	done

	# Prompt user for selection
	echo ""
	read -p "Enter the number to download the corresponding package (type 'quit' to exit): " choice

	# Check if the user wants to quit
	if [[ "$choice" == "quit" ]]; then
		echo ""
		echo "Goodbye!"
		echo ""
		break
	fi

	# Validate user input
	if [[ "$choice" =~ ^[0-9]+$ ]]; then
		for (( i = 0; i < ${#menu_options[@]}; i+=6 )); do
			t=$((i/6+1))
			if [[ "$t" == "$choice" ]]; then
				selected_package="${menu_options[i+2]}"
				selected_title="${menu_options[i+3]}"
				selected_unpack="${menu_options[i+4]}"
				selected_install="${menu_options[i+5]}"
				break;
			fi
		done
		if [[ -z "$selected_package" ]]; then
			echo "Invalid selection. Please try again."
			sleep 2
			continue
		fi

		# Download the selected package
		download_package "$selected_package" "$selected_title"
		echo "Package '$selected_title' downloaded to ./optional/"
		unpack "$selected_unpack"
		rsync -ravl $selected_install
		exit
	else
		echo "Invalid input. Please try again."
		sleep 2
	fi
done
