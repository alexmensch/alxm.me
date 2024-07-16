#!/bin/bash

# Function to generate a unique hash for a file
generate_hash() {
  local file=$1
  # Use a portion of the file's content to generate the hash
  head -c 1024 "$file" | md5sum | awk '{print tolower($1)}'
}

# Function to add permalink to the frontmatter of a Markdown file
add_permalink() {
  local file=$1
  local hash=$2
  local path=$3
  local permalink="/$path/$hash"
  
  # Check if the file has frontmatter
  if grep -q "^---" "$file"; then
    # File has frontmatter, add permalink
    sed -i "0,/^---$/!b;//a permalink: $permalink" "$file"
  else
    # File does not have frontmatter, add it
    echo -e "---\npermalink: $permalink\n---\n$(cat "$file")" > "$file"
  fi
}

# Directory to process
DIRECTORY=${1:-.}
# Subfolder for the permalink value
SUBFOLDER=${2:-evergreen}

# Iterate through all Markdown files in the given directory and subdirectories
find "$DIRECTORY" -name "*.md" | while read -r file; do
  # Generate a unique hash for the file
  hash=$(generate_hash "$file")
  # Add permalink to the frontmatter of the file
  add_permalink "$file" "$hash" "$SUBFOLDER"
done